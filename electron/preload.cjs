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
  setEnforcement: (payload) => ipcRenderer.send("enforcement:set", payload),
  onEnforcementBreach: (cb) => {
    const listener = (_event, info) => cb(info);
    ipcRenderer.on("enforcement:breach", listener);
    return () => ipcRenderer.removeListener("enforcement:breach", listener);
  },
});
