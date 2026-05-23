const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const { isAllowedFocusApp } = require("./app-match.cjs");
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
let focusSession = { active: false, allowedApps: [] };
let lastAllowedWindowId = null;
let lastRestoreAt = 0;
const RESTORE_COOLDOWN_MS = 1200;

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

async function focusFirstAllowedWindow() {
  if (lastAllowedWindowId && focusWindowById(lastAllowedWindowId)) {
    return lastAllowedWindowId;
  }

  const { openWindows } = await getWindowsModule();
  const windows = await openWindows();
  for (const win of windows) {
    if (!win?.owner?.name || isOurApp(win)) continue;
    const snap = snapshotFromInfo(win);
    if (!isAllowedFocusApp(snap, focusSession.allowedApps)) continue;
    if (typeof win.id !== "number") continue;
    if (focusWindowById(win.id)) {
      lastAllowedWindowId = win.id;
      return win.id;
    }
  }
  return null;
}

ipcMain.handle("active-app:get", () => ({ snapshot: lastSnapshot, error: lastError }));

ipcMain.on("focus-session:sync", (_e, payload) => {
  focusSession = {
    active: Boolean(payload?.active),
    allowedApps: Array.isArray(payload?.allowedApps) ? payload.allowedApps : [],
  };
  if (!focusSession.active) {
    lastAllowedWindowId = null;
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
          !ownApp && isAllowedFocusApp(snapshot, focusSession.allowedApps);

        if (
          focusSession.active &&
          process.platform === "win32" &&
          !ownApp &&
          !allowed &&
          Date.now() - lastRestoreAt > RESTORE_COOLDOWN_MS
        ) {
          const focusedId = await focusFirstAllowedWindow();
          lastRestoreAt = Date.now();
          if (focusedId && !win.isDestroyed()) {
            win.webContents.send("focus:restored", {
              windowId: focusedId,
              blocked: snapshot.app,
            });
            return;
          }
        }

        if (!ownApp) {
          if (allowed && typeof info.id === "number") {
            lastAllowedWindowId = info.id;
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
      const msg = e?.message ?? String(e);
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
    if (e.message && (e.message.startsWith("[voice]") || e.message.startsWith("[preview]") || e.message.startsWith("[useActiveApp]"))) {
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

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
