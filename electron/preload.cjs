const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld("electronAPI", {
  showOpenDialog: (opts) => ipcRenderer.invoke("show-open-dialog", opts),
  storeSpreadsheet: (sourcePath, meta) =>
    ipcRenderer.invoke("store-spreadsheet", { sourcePath, ...meta }),
});
