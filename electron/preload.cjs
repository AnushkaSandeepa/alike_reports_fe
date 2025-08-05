const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  storeSpreadsheet: (sourcePath, { programType, programDate }) =>
    ipcRenderer.invoke("store-spreadsheet", {
      sourcePath,
      programType,
      programDate,
    }),

  pickAndStoreSpreadsheet: async ({ programType, programDate }) => {
    const { canceled, filePaths } = await ipcRenderer.invoke("show-open-dialog", {
      title: "Select spreadsheet",
      properties: ["openFile"],
      filters: [{ name: "Sheets", extensions: ["csv", "xls", "xlsx"] }],
    });

    if (canceled || !filePaths || filePaths.length === 0) {
      return { success: false, error: "No file selected" };
    }

    return await ipcRenderer.invoke("store-spreadsheet", {
      sourcePath: filePaths[0],
      programType,
      programDate,
    });
  },
});
