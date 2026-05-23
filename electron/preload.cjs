const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
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
  syncFocusSession: (active, allowedApps) =>
    ipcRenderer.send("focus-session:sync", { active, allowedApps }),
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
});
