const { app, BrowserWindow, ipcMain, shell } = require("electron");
const path = require("node:path");
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

let blockedPageBaseUrl = null; // set by blocked-server start

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
    width: 400,
    height: 680,
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

  try {
    const { url } = await blockedServer.start({ alwaysAllowed: ALWAYS_ALLOWED_HOSTS });
    blockedPageBaseUrl = url;
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
