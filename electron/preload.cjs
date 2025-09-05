// electron/preload.cjs
const { contextBridge, ipcRenderer } = require("electron");

contextBridge.exposeInMainWorld("electronAPI", {
  // File picker
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

  extractSheetMetadata: (filePath) => ipcRenderer.invoke("extract-event-metadata", filePath),

  // Store uploaded spreadsheet
  storeSpreadsheet: ({ sourcePath, programType, programDate, personIncharge, dateRange }) =>
   ipcRenderer.invoke("store-spreadsheet", {
    sourcePath, programType, programDate, personIncharge, dateRange
  }),

  updateSpreadsheetStatus: (fileId, status) =>
    ipcRenderer.invoke("update-spreadsheet-status", { fileId, status }),


  getUploadedSheets: () => ipcRenderer.invoke("get-uploaded-spreadsheets"),
  openUploadFolder: () => ipcRenderer.send("open-upload-folder"),
  deleteSpreadsheet: (fileId) => ipcRenderer.invoke("delete-spreadsheet", fileId),

  // Event-based reports
  generateReport: ({ spreadsheetId, spreadsheetPath, programType, evaluationStartDate, evaluationEndDate }) =>
    ipcRenderer.invoke("generate-report", {
      spreadsheetId,
      spreadsheetPath,
      programType,
      evaluationStartDate,
      evaluationEndDate,
    }),
  getReports: () => ipcRenderer.invoke("get-reports"),
  deleteReport: (id) => ipcRenderer.invoke("delete-report", id),

  // Period-based (unchanged here)
  getPeriodReports: () => ipcRenderer.invoke("get-period-reports"),
  generatePeriodReport: ({ start, end }) => ipcRenderer.invoke("report_generator_period", { start, end }),
  deletePeriodReport: (id) => ipcRenderer.invoke("delete-period-report", id),
});
