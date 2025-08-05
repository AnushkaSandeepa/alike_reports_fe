const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // 1. File picker — only pick, no upload
  pickSpreadsheet: async () => {
    const result = await ipcRenderer.invoke("show-open-dialog", {
      title: "Select spreadsheet",
      properties: ["openFile"],
      filters: [{ name: "Sheets", extensions: ["csv", "xls", "xlsx"] }],
    });

    if (result.canceled || !result.filePaths.length) {
      return { success: false, error: "No file selected" };
    }

    return { success: true, filePath: result.filePaths[0] };
  },

  // 2. Upload separately
  storeSpreadsheet: async ({ sourcePath, programType, programDate }) => {
    return await ipcRenderer.invoke("store-spreadsheet", {
      sourcePath,
      programType,
      programDate,
    });
  },
});
