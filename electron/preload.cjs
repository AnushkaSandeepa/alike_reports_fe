// electron/preload.cjs
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // File picker — only pick, no upload
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

  // Upload the selected spreadsheet
  storeSpreadsheet: async ({ sourcePath, programType, programDate }) => {
    return await ipcRenderer.invoke("store-spreadsheet", {
      sourcePath,
      programType,
      programDate,
    });
  },

  // Load uploaded metadata
  getUploadedSheets: async () => {
    return await ipcRenderer.invoke("get-uploaded-spreadsheets");
  },

  // Open folder in file explorer
  openUploadFolder: () => ipcRenderer.send("open-upload-folder"),

  // Delete a spreadsheet by fileId
  deleteSpreadsheet: (fileId) => ipcRenderer.invoke("delete-spreadsheet", fileId),

  // Run Python report generator for a file
  generateReport: async ({ spreadsheetId, spreadsheetPath, programType }) => {
    return await ipcRenderer.invoke("generate-report", {
      spreadsheetId,
      spreadsheetPath,
      programType
    });
  },

  getReports: () => ipcRenderer.invoke("get-reports")

});
