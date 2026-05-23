const { app, BrowserWindow, ipcMain, shell } = require("electron");
const { execFile } = require("node:child_process");
const { promisify } = require("node:util");
const execFileAsync = promisify(execFile);
const OSASCRIPT_TIMEOUT_MS = 2000;
const path = require("node:path");
const db = require("./db.cjs");
const { isAllowedFocusApp, isSiteAllowed } = require("./app-match.cjs");
const { createFocusWindow } = require("./focus-window.cjs");

const isDev = process.env.NODE_ENV === "development";
const devUrl = process.env.NEXT_DEV_SERVER_URL;
const OUR_APP_NAMES = new Set([
  "Electron",
  "LOCK//IN AI",
  "lockin-ai",
  "LOCKIN AI",
]);

function isOurApp(info) {
  const name = info.owner?.name ?? "";
  if (OUR_APP_NAMES.has(name)) return true;
  const exe = (info.owner?.path ?? "").toLowerCase();
  return exe.includes("lockin") || (isDev && exe.includes("electron.exe"));
}

let activeWindowFn = null;
let openWindowsFn = null;
async function getWindowsModule() {
  if (!activeWindowFn) {
    const mod = await import("get-windows");
    activeWindowFn = mod.activeWindow;
    openWindowsFn = mod.openWindows;
  }
  return { activeWindow: activeWindowFn, openWindows: openWindowsFn };
}

let lastSnapshot = null;
let lastError = null;
let focusSession = { active: false, allowedApps: [], allowedSites: [] };
let lastAllowedWindowId = null; // Windows HWND
let lastAllowedAppName = null; // macOS app name (for osascript fallback)
let lastAllowedUrl = null; // for browser tab restoration
let lastRestoreAt = 0;
const RESTORE_COOLDOWN_MS = 1200;

// macOS browsers that support AppleScript URL setting. Map from the OS-reported
// owner.name to whether they expect "current tab" (Safari) or "active tab".
const BROWSER_TAB_ACCESSORS = {
  "Google Chrome": "active tab of front window",
  "Google Chrome Canary": "active tab of front window",
  "Google Chrome Dev": "active tab of front window",
  "Google Chrome Beta": "active tab of front window",
  Chromium: "active tab of front window",
  "Microsoft Edge": "active tab of front window",
  "Brave Browser": "active tab of front window",
  "Brave Browser Nightly": "active tab of front window",
  Vivaldi: "active tab of front window",
  Arc: "active tab of front window",
  Opera: "active tab of front window",
  Safari: "current tab of front window",
  "Safari Technology Preview": "current tab of front window",
};

async function runOsascript(script) {
  try {
    const { stdout } = await execFileAsync("/usr/bin/osascript", ["-e", script], {
      timeout: OSASCRIPT_TIMEOUT_MS,
    });
    return { ok: true, stdout: String(stdout ?? "") };
  } catch (e) {
    return { ok: false, error: e };
  }
}

async function restoreBrowserTab(appName, targetUrl) {
  if (process.platform !== "darwin" || !appName || !targetUrl) return false;
  const accessor = BROWSER_TAB_ACCESSORS[appName];
  if (!accessor) return false;
  const safeApp = appName.replace(/"/g, '\\"');
  const safeUrl = targetUrl.replace(/"/g, '\\"');
  const r = await runOsascript(
    `tell application "${safeApp}" to set URL of ${accessor} to "${safeUrl}"`,
  );
  if (!r.ok) console.error("[focus] tab restore error:", r.error?.message);
  return r.ok;
}

/** List the URLs of every tab in the browser's front window. */
async function getBrowserTabUrls(appName) {
  if (process.platform !== "darwin") return null;
  if (!BROWSER_TAB_ACCESSORS[appName]) return null;
  // Safari uses a different tab object model — skip for now.
  if (/Safari/.test(appName)) return null;
  const safeApp = appName.replace(/"/g, '\\"');
  // \\u001E is RS (record separator) — unlikely to appear in URLs, easy to split.
  const script =
    `tell application "${safeApp}"\n` +
    `set AppleScript's text item delimiters to (ASCII character 30)\n` +
    `return (URL of every tab of front window) as text\n` +
    `end tell`;
  const r = await runOsascript(script);
  if (!r.ok) return null;
  const out = r.stdout.trim();
  if (!out) return [];
  try {
    return out.split("").map((s) => s.trim());
  } catch (e) {
    return null;
  }
}

/** Switch the browser's front window to the given 1-based tab index. */
async function switchToBrowserTab(appName, tabIndex) {
  if (process.platform !== "darwin") return false;
  if (!BROWSER_TAB_ACCESSORS[appName]) return false;
  if (/Safari/.test(appName)) return false;
  const safeApp = appName.replace(/"/g, '\\"');
  const r = await runOsascript(
    `tell application "${safeApp}" to set active tab index of front window to ${tabIndex}`,
  );
  if (!r.ok) console.error("[focus] switch tab error:", r.error?.message);
  return r.ok;
}

const { focusWindowById } = createFocusWindow();

function snapshotFromInfo(info) {
  return {
    app: info.owner.name,
    title: info.title ?? "",
    url: info.url ?? null,
    bundleId: info.owner?.bundleId ?? null,
    path: info.owner?.path ?? null,
    windowId: typeof info.id === "number" ? info.id : null,
  };
}

async function activateMacApp(appName) {
  if (process.platform !== "darwin" || !appName) return false;
  const safe = appName.replace(/"/g, '\\"');
  const r = await runOsascript(`tell application "${safe}" to activate`);
  if (!r.ok) console.error("[focus] activate error:", r.error?.message);
  return r.ok;
}

async function refocusLastAllowed() {
  // Windows: bring the specific HWND back to the foreground.
  if (lastAllowedWindowId && focusWindowById(lastAllowedWindowId)) {
    return { windowId: lastAllowedWindowId, refocused: null };
  }
  // macOS: activate the app by name via osascript.
  if (process.platform === "darwin" && lastAllowedAppName) {
    if (await activateMacApp(lastAllowedAppName)) {
      return { windowId: null, refocused: lastAllowedAppName };
    }
  }
  // Fallback: enumerate open windows and pick any allowed one.
  try {
    const { openWindows } = await getWindowsModule();
    const windows = await openWindows();
    for (const w of windows) {
      if (!w?.owner?.name || isOurApp(w)) continue;
      const snap = snapshotFromInfo(w);
      if (!isAllowedFocusApp(snap, focusSession.allowedApps, focusSession.allowedSites)) continue;
      if (typeof w.id === "number" && focusWindowById(w.id)) {
        lastAllowedWindowId = w.id;
        return { windowId: w.id, refocused: null };
      }
      if (process.platform === "darwin" && (await activateMacApp(snap.app))) {
        lastAllowedAppName = snap.app;
        return { windowId: null, refocused: snap.app };
      }
    }
  } catch (e) {
    console.error("[focus] enumerate error:", e?.message);
  }
  return null;
}

ipcMain.handle("active-app:get", () => ({ snapshot: lastSnapshot, error: lastError }));

ipcMain.on("focus-session:sync", (_e, payload) => {
  focusSession = {
    active: Boolean(payload?.active),
    allowedApps: Array.isArray(payload?.allowedApps) ? payload.allowedApps : [],
    allowedSites: Array.isArray(payload?.allowedSites) ? payload.allowedSites : [],
  };
  if (!focusSession.active) {
    lastAllowedWindowId = null;
    lastAllowedAppName = null;
    lastAllowedUrl = null;
  }
});

function startActiveAppPolling(win) {
  let lastKey = null;
  let lastErrorSent = null;
  let stopped = false;

  async function poll() {
    if (stopped || win.isDestroyed()) return;
    try {
      const { activeWindow } = await getWindowsModule();
      const info = await activeWindow();
      if (info?.owner?.name) {
        const snapshot = snapshotFromInfo(info);

        const ownApp = isOurApp(info);
        const allowed =
          !ownApp &&
          isAllowedFocusApp(snapshot, focusSession.allowedApps, focusSession.allowedSites);

        // During a focus session, snap back to the last allowed window whenever
        // the user lands on something off the list. Don't `return` after — the
        // renderer's breach UI relies on still receiving the disallowed
        // snapshot so its breach effect can fire reliably.
        if (
          focusSession.active &&
          !ownApp &&
          !allowed &&
          Date.now() - lastRestoreAt > RESTORE_COOLDOWN_MS
        ) {
          lastRestoreAt = Date.now();
          // If we're in a known browser, try to switch to an already-open
          // allowed tab. Falls back to URL navigation if no allowed tab exists.
          const inBrowser =
            !!snapshot.url && BROWSER_TAB_ACCESSORS[snapshot.app] !== undefined;
          let restored = null;
          if (inBrowser) {
            const urls = await getBrowserTabUrls(snapshot.app);
            if (urls && urls.length) {
              const currentIndex = urls.findIndex((u) => u === snapshot.url);
              // 1. Prefer the exact tab they were last allowed on.
              let targetIndex = lastAllowedUrl
                ? urls.findIndex(
                    (u, i) => i !== currentIndex && u === lastAllowedUrl,
                  )
                : -1;
              // 2. Otherwise pick any other allowed tab in this window.
              if (targetIndex < 0) {
                targetIndex = urls.findIndex(
                  (u, i) =>
                    i !== currentIndex &&
                    isSiteAllowed(u, focusSession.allowedSites),
                );
              }
              if (targetIndex >= 0) {
                if (await switchToBrowserTab(snapshot.app, targetIndex + 1)) {
                  restored = { windowId: null, refocused: urls[targetIndex] };
                }
              }
            }
            // No allowed tab open — navigate the offending tab to a safe URL.
            if (!restored && lastAllowedUrl) {
              if (await restoreBrowserTab(snapshot.app, lastAllowedUrl)) {
                restored = { windowId: null, refocused: lastAllowedUrl };
              }
            }
            if (!restored) {
              if (await restoreBrowserTab(snapshot.app, "https://www.google.com/")) {
                restored = { windowId: null, refocused: "google.com" };
              }
            }
          }
          if (!restored) restored = await refocusLastAllowed();
          if (restored && !win.isDestroyed()) {
            win.webContents.send("focus:restored", {
              windowId: restored.windowId,
              blocked: snapshot.url ?? snapshot.app,
              refocused: restored.refocused ?? undefined,
            });
          }
        }

        if (!ownApp) {
          if (allowed) {
            if (typeof info.id === "number") lastAllowedWindowId = info.id;
            lastAllowedAppName = snapshot.app;
            if (snapshot.url) lastAllowedUrl = snapshot.url;
          }

          lastSnapshot = snapshot;
          const key = `${snapshot.app}|${snapshot.url ?? ""}|${snapshot.title}`;
          if (key !== lastKey) {
            lastKey = key;
            if (!win.isDestroyed()) win.webContents.send("active-app:change", snapshot);
          }
          if (lastErrorSent) {
            lastErrorSent = null;
            lastError = null;
            if (!win.isDestroyed()) win.webContents.send("active-app:error", null);
          }
        }
      }
    } catch (e) {
      let stderr = e?.stderr
        ? Buffer.isBuffer(e.stderr)
          ? e.stderr.toString()
          : String(e.stderr)
        : "";
      // get-windows swallows stderr in some failure paths — probe the helper
      // binary directly so we can detect WHICH permission is missing.
      if (
        process.platform === "darwin" &&
        !stderr &&
        /Command failed/.test(e?.message ?? "")
      ) {
        try {
          await execFileAsync(
            path.join(__dirname, "..", "node_modules", "get-windows", "main"),
            [],
            { timeout: OSASCRIPT_TIMEOUT_MS },
          );
        } catch (probe) {
          if (probe?.stderr) stderr = probe.stderr.toString();
        }
      }
      const msg = `${e?.message ?? String(e)} ${stderr}`.trim();
      const kind =
        process.platform === "win32"
          ? "unknown"
          : /accessibility/i.test(msg)
            ? "needs-accessibility"
            : /screen recording/i.test(msg)
              ? "needs-screen-recording"
              : "unknown";
      if (lastErrorSent !== kind) {
        lastErrorSent = kind;
        lastError = { kind, message: msg };
        if (!win.isDestroyed()) {
          win.webContents.send("active-app:error", { kind, message: msg });
        }
        console.error("[active-app] poll error:", msg);
      }
    }
  }

  poll();
  const timer = setInterval(poll, 800);
  win.on("closed", () => {
    stopped = true;
    clearInterval(timer);
  });
}

function createWindow() {
  const win = new BrowserWindow({
    width: 400,
    height: 680,
    useContentSize: true,
    resizable: false,
    fullscreenable: false,
    frame: false,
    transparent: true,
    backgroundColor: "#00000000",
    hasShadow: true,
    show: false,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
      backgroundThrottling: false,
    },
  });

  win.once("ready-to-show", () => win.show());

  win.webContents.on("did-fail-load", (_e, code, desc, url) => {
    console.error(`[did-fail-load] ${code} ${desc} ${url}`);
  });
  win.webContents.on("console-message", (e) => {
    if (
      e.message &&
      (e.message.startsWith("[voice]") ||
        e.message.startsWith("[preview]") ||
        e.message.startsWith("[useActiveApp]"))
    ) {
      console.log(`[renderer] ${e.message}`);
      return;
    }
    if (e.level === "error" || e.level === "warning") {
      console.log(`[renderer ${e.level}] ${e.message}  (${e.sourceId}:${e.lineNumber})`);
    }
  });

  // Open external links in the user's default browser instead of a new window.
  win.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith("http://") || url.startsWith("https://")) {
      shell.openExternal(url);
      return { action: "deny" };
    }
    return { action: "allow" };
  });

  if (isDev && devUrl) {
    win.loadURL(devUrl);
    win.webContents.openDevTools({ mode: "detach" });
  } else {
    win.loadFile(path.join(__dirname, "..", "out", "index.html"));
  }

  startActiveAppPolling(win);
}

ipcMain.on("window:close", (e) => BrowserWindow.fromWebContents(e.sender)?.close());
ipcMain.on("window:minimize", (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.on("window:maximize", (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});

ipcMain.handle("custom-apps:list", () => db.listCustomApps());
ipcMain.handle("custom-apps:add", (_e, name) => db.addCustomApp(name));
ipcMain.handle("custom-apps:remove", (_e, id) => db.removeCustomApp(id));

ipcMain.handle("custom-sites:list", () => db.listCustomSites());
ipcMain.handle("custom-sites:add", (_e, host) => db.addCustomSite(host));
ipcMain.handle("custom-sites:remove", (_e, id) => db.removeCustomSite(id));

ipcMain.on("open:accessibility-settings", () => {
  if (process.platform === "darwin") {
    shell.openExternal(
      "x-apple.systempreferences:com.apple.preference.security?Privacy_Accessibility",
    );
    return;
  }
  if (process.platform === "win32") {
    shell.openExternal("ms-settings:privacy");
  }
});

ipcMain.on("open:screen-recording-settings", () => {
  if (process.platform === "darwin") {
    shell.openExternal(
      "x-apple.systempreferences:com.apple.preference.security?Privacy_ScreenCapture",
    );
  }
});

app.whenReady().then(() => {
  db.init(app.getPath("userData"));
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
