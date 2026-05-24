const { contextBridge, ipcRenderer } = require("electron");

// Pull the full prefs map synchronously *before* renderer scripts run so the
// renderer can use sync getters (mirrors the localStorage feel we replaced).
let prefsCache;
try {
  prefsCache = ipcRenderer.sendSync("prefs:bootstrap") || {};
} catch {
  prefsCache = {};
}

contextBridge.exposeInMainWorld("electronAPI", {
  platform: process.platform,
  windowClose: () => ipcRenderer.send("window:close"),
  windowMinimize: () => ipcRenderer.send("window:minimize"),
  windowMaximize: () => ipcRenderer.send("window:maximize"),
  onActiveAppChange: (cb) => {
    const listener = (_event, snapshot) => cb(snapshot);
    ipcRenderer.on("active-app:change", listener);
    return () => ipcRenderer.removeListener("active-app:change", listener);
  },
  getCurrentActiveApp: () => ipcRenderer.invoke("active-app:get"),
  onActiveAppError: (cb) => {
    const listener = (_event, error) => cb(error);
    ipcRenderer.on("active-app:error", listener);
    return () => ipcRenderer.removeListener("active-app:error", listener);
  },
  openAccessibilitySettings: () => ipcRenderer.send("open:accessibility-settings"),
  openScreenRecordingSettings: () => ipcRenderer.send("open:screen-recording-settings"),
  requestPermissions: () => ipcRenderer.invoke("permissions:request"),
  getPermissionsStatus: () => ipcRenderer.invoke("permissions:status"),
  syncFocusSession: (active, allowedApps, allowedSites, opts) =>
    ipcRenderer.send("focus-session:sync", {
      active,
      allowedApps,
      allowedSites,
      extraAlwaysAllowed: Array.isArray(opts?.extraAlwaysAllowed)
        ? opts.extraAlwaysAllowed
        : [],
      hideGemini: Boolean(opts?.hideGemini),
    }),
  onFocusRestored: (cb) => {
    const listener = (_event, payload) => cb(payload);
    ipcRenderer.on("focus:restored", listener);
    return () => ipcRenderer.removeListener("focus:restored", listener);
  },
  customApps: {
    list: () => ipcRenderer.invoke("custom-apps:list"),
    add: (name) => ipcRenderer.invoke("custom-apps:add", name),
    remove: (id) => ipcRenderer.invoke("custom-apps:remove", id),
  },
  customSites: {
    list: () => ipcRenderer.invoke("custom-sites:list"),
    add: (host) => ipcRenderer.invoke("custom-sites:add", host),
    remove: (id) => ipcRenderer.invoke("custom-sites:remove", id),
  },
  garden: {
    list: () => ipcRenderer.invoke("garden:list"),
    add: (plant) => ipcRenderer.invoke("garden:add", plant),
    clear: () => ipcRenderer.invoke("garden:clear"),
  },
  customSessions: {
    list: () => ipcRenderer.invoke("custom-sessions:list"),
    add: (payload) => ipcRenderer.invoke("custom-sessions:add", payload),
    remove: (id) => ipcRenderer.invoke("custom-sessions:remove", id),
  },
  extension: {
    status: () => ipcRenderer.invoke("extension:status"),
    getPath: () => ipcRenderer.invoke("extension:get-path"),
    revealFolder: () => ipcRenderer.invoke("extension:reveal-folder"),
    copyPath: () => ipcRenderer.invoke("extension:copy-path"),
    openInstall: () => ipcRenderer.invoke("extension:open-install"),
  },
  prefs: {
    get(key) {
      return prefsCache[key] ?? null;
    },
    async set(key, value) {
      // Update the local cache immediately so subsequent sync reads see the
      // new value without waiting for the IPC round-trip to complete.
      if (value === null || value === undefined) delete prefsCache[key];
      else prefsCache[key] = String(value);
      try {
        await ipcRenderer.invoke("prefs:set", key, value);
      } catch (e) {
        console.error("[prefs] set failed:", e?.message ?? e);
      }
    },
  },
  resetApp: () => ipcRenderer.invoke("app:reset"),
});
