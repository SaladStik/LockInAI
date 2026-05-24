const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
const fs = require("node:fs");
const db = require("./db.cjs");
const { ALWAYS_ALLOWED_HOSTS } = require("./app-match.cjs");
const blockedServer = require("./blocked-server.cjs");
const { createBridge } = require("./extension-bridge.cjs");
const { createFocusEngine } = require("./focus-engine.cjs");
const permissions = require("./permissions.cjs");

// Companion browser extension bridge. When connected it gives us real tab URLs
// (which get-windows can't on Windows) and a reliable way to switch/navigate
// tabs — the same capability AppleScript gives us on macOS.
const extBridge = createBridge();

const isDev = process.env.NODE_ENV === "development";
const devUrl = process.env.NEXT_DEV_SERVER_URL;

// Force the visible app name to "LOCK//IN AI" even in dev (where the Electron
// binary would otherwise show as "Electron" in the macOS menu bar, Dock label,
// Windows taskbar, alt-tab switcher, system tray, etc.).
const APP_NAME = "LOCK//IN AI";
app.setName(APP_NAME);
if (process.platform === "win32") {
  // Windows uses the AppUserModelID to group windows in the taskbar and label
  // notifications. Match electron-builder's appId from package.json.
  app.setAppUserModelId("ai.lockin.app");
}
process.title = APP_NAME;

// `app.setName("LOCK//IN AI")` would also point userData at
// `~/Library/Application Support/LOCK//IN AI/`, which the filesystem collapses
// into the two-level `LOCK/IN AI/`. Pin the data dir to a plain folder so the
// SQLite DB + Electron cache live somewhere sensible, while the *display* name
// remains "LOCK//IN AI" everywhere the user sees it.
// In dev we use a separate folder so iterating doesn't pollute the path a
// packaged install would read — testing a release "fresh install" stays clean.
{
  const base = app.getPath("appData");
  app.setPath("userData", path.join(base, isDev ? "LockInAI-dev" : "LockInAI"));
}

// Lockie app icon (used for the window/dock in dev; packaged builds get their
// icon from electron-builder via build/icon.icns|ico). Guarded so a missing
// file is harmless.
const appIconPath = path.join(__dirname, "..", "build", "icon.png");
const appIcon = fs.existsSync(appIconPath) ? appIconPath : undefined;

let blockedPageBaseUrl = null; // set by blocked-server start
let extensionInstallUrl = null;

function blockedPageUrlFor(allowedSites) {
  if (!blockedPageBaseUrl) return "about:blank";
  const sites = JSON.stringify(allowedSites ?? []);
  return `${blockedPageBaseUrl}?sites=${encodeURIComponent(sites)}`;
}

// Focus-protection engine: owns focus-session state + active-app polling and
// gently snaps focus/tabs back to allowed targets during a session.
const focusEngine = createFocusEngine({ extBridge, isDev, blockedPageUrlFor });

function createWindow() {
  const win = new BrowserWindow({
    title: APP_NAME,
    width: 400,
    height: 680,
    icon: appIcon,
    useContentSize: true,
    resizable: false,
    fullscreenable: false,
    maximizable: false,
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

  focusEngine.startPolling(win);
}

// ---- IPC: active app + focus session -------------------------------------
ipcMain.handle("active-app:get", () => focusEngine.getActiveApp());
ipcMain.on("focus-session:sync", (_e, payload) => focusEngine.syncSession(payload));

// ---- IPC: window controls -------------------------------------------------
ipcMain.on("window:close", (e) => BrowserWindow.fromWebContents(e.sender)?.close());
ipcMain.on("window:minimize", (e) => BrowserWindow.fromWebContents(e.sender)?.minimize());
ipcMain.on("window:maximize", (e) => {
  const win = BrowserWindow.fromWebContents(e.sender);
  if (!win) return;
  if (win.isMaximized()) win.unmaximize();
  else win.maximize();
});

// ---- IPC: persistence (SQLite) -------------------------------------------
ipcMain.handle("custom-apps:list", () => db.listCustomApps());
ipcMain.handle("custom-apps:add", (_e, name) => db.addCustomApp(name));
ipcMain.handle("custom-apps:remove", (_e, id) => db.removeCustomApp(id));

ipcMain.handle("custom-sites:list", () => db.listCustomSites());
ipcMain.handle("custom-sites:add", (_e, host) => db.addCustomSite(host));
ipcMain.handle("custom-sites:remove", (_e, id) => db.removeCustomSite(id));

ipcMain.handle("garden:list", () => db.listGardenPlants());
ipcMain.handle("garden:add", (_e, plant) => db.addGardenPlant(plant));
ipcMain.handle("garden:clear", () => db.clearGardenPlants());

ipcMain.handle("custom-sessions:list", () => db.listCustomSessions());
ipcMain.handle("custom-sessions:add", (_e, payload) => db.addCustomSession(payload));
ipcMain.handle("custom-sessions:remove", (_e, id) => db.removeCustomSession(id));

// Prefs key-value (replaces renderer localStorage). The bootstrap channel is
// SYNCHRONOUS so the preload can deliver the full prefs map to the renderer
// before any JS runs — keeps voice/onboarding/etc. initializers synchronous.
ipcMain.on("prefs:bootstrap", (e) => {
  try {
    e.returnValue = db.getAllPrefs();
  } catch (err) {
    console.error("[prefs] bootstrap failed:", err?.message ?? err);
    e.returnValue = {};
  }
});
ipcMain.handle("prefs:set", (_e, key, value) => db.setPref(key, value));

// Full app reset — wipes garden, custom apps/sites, sessions, prefs (onboarding too).
ipcMain.handle("app:reset", () => {
  db.resetAll();
  return true;
});

// ---- IPC: extension install / status -------------------------------------
ipcMain.handle("extension:status", () => ({
  connected: extBridge.isConnected ? extBridge.isConnected() : false,
}));

/**
 * Locate the bundled extension. In dev it sits next to the repo; in a
 * packaged build electron-builder writes it to Contents/Resources/extension/
 * (via the "extraResources" entry in package.json).
 */
function findBundledExtension() {
  const candidates = [
    path.join(__dirname, "..", "extension"),
    path.join(process.resourcesPath ?? "", "extension"),
  ];
  for (const p of candidates) {
    try {
      if (fs.existsSync(path.join(p, "manifest.json"))) return p;
    } catch {
      /* ignore */
    }
  }
  return null;
}

/**
 * Copy the bundled extension into a stable, user-readable location under
 * userData. Inside the .app bundle's Resources/ Finder can technically reach
 * the folder, but the "Load unpacked" dialog can't traverse package contents
 * by default — a real user-data path is much friendlier.
 */
function ensureUserExtension() {
  const src = findBundledExtension();
  if (!src) return null;
  const dst = path.join(app.getPath("userData"), "extension");
  try {
    fs.mkdirSync(dst, { recursive: true });
    fs.cpSync(src, dst, { recursive: true, force: true, errorOnExist: false });
  } catch (e) {
    console.error("[extension] copy to userData failed:", e?.message ?? e);
    return src; // fall back to the bundled path so we don't break the flow
  }
  return dst;
}

ipcMain.handle("extension:open-install", async () => {
  const extensionPath = ensureUserExtension();
  // Reveal the extension folder so the user can pick it from chrome's
  // "Load unpacked" dialog (or drag it directly onto the extensions page).
  if (extensionPath) shell.showItemInFolder(extensionPath);
  // Open our install page in the user's ACTUAL default browser — `chrome://`
  // URLs only resolve in Chromium browsers, but `http://` always lands in the
  // real default. The page sniffs the user-agent and links to the correct
  // browser-specific extensions URL (chrome://, edge://, vivaldi://, …).
  const opened = extensionInstallUrl ?? "https://www.google.com/";
  try {
    await shell.openExternal(opened);
  } catch (e) {
    console.error("[extension] open install failed:", e?.message ?? e);
  }
  return { extensionPath, installUrl: extensionInstallUrl };
});

// ---- IPC: macOS permissions ----------------------------------------------
ipcMain.handle("permissions:status", () => permissions.getPermissionsStatus());
ipcMain.handle("permissions:request", () => permissions.requestMacPermissions({ prompt: true }));

ipcMain.on("open:accessibility-settings", () => {
  if (process.platform === "darwin") {
    permissions.ensurePermission("accessibility");
    return;
  }
  if (process.platform === "win32") {
    shell.openExternal("ms-settings:privacy");
  }
});

ipcMain.on("open:screen-recording-settings", () => {
  if (process.platform === "darwin") {
    permissions.ensurePermission("screen-recording");
  }
});

app.whenReady().then(async () => {
  db.init(app.getPath("userData"));

  // Pre-stage the bundled extension into userData so the "open install" path
  // is instant and the folder is ready for `showItemInFolder` immediately.
  try {
    ensureUserExtension();
  } catch (e) {
    console.error("[extension] pre-stage failed:", e?.message ?? e);
  }

  // Show Lockie on the macOS dock in dev (packaged builds use the bundle icon).
  if (isDev && appIcon && process.platform === "darwin") {
    try {
      app.dock?.setIcon(appIcon);
    } catch {
      /* non-fatal */
    }
  }

  try {
    const { url, installUrl } = await blockedServer.start({
      alwaysAllowed: ALWAYS_ALLOWED_HOSTS,
    });
    blockedPageBaseUrl = url;
    extensionInstallUrl = installUrl;
    console.log("[blocked-server] listening at", url);
  } catch (e) {
    console.error("[blocked-server] failed to start:", e?.message ?? e);
  }

  try {
    await extBridge.start();
  } catch (e) {
    console.error("[ext-bridge] failed to start:", e?.message ?? e);
  }

  createWindow();

  // Trigger macOS permission prompts (Accessibility + Screen Recording) on
  // first launch. Fire-and-forget so startup isn't blocked by the dialogs.
  if (!permissions.hasRequestedPermissions()) {
    permissions.requestMacPermissions({ prompt: true }).catch((e) =>
      console.error("[permissions] initial request failed:", e?.message ?? e),
    );
  }

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") app.quit();
});
