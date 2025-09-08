// electron/preload.cjs
const { contextBridge, ipcRenderer } = require("electron");

// One allow-list for ALL renderer subscriptions
const ALLOWED_ON = new Set([
  "period-updated",
  "period-progress",
  "report-updated",           
  "WebsiteDownloads:updated", 
]);

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
  updateReportStatus: (reportId, status) => ipcRenderer.invoke("update-report-status", { reportId, status }),

  // Period-based (unchanged here)
  getPeriodReports: () => ipcRenderer.invoke("get-period-reports"),
  generatePeriodReport: ({ start, end }) => ipcRenderer.invoke("report_generator_period", { start, end }),
  deletePeriodReport: (id) => ipcRenderer.invoke("delete-period-report", id),

  on: (channel, handler) => {
    if (!["period-updated", "period-progress"].includes(channel) || typeof handler !== "function") {
      return () => {};
    }
    const wrapped = (_evt, payload) => { try { handler(payload); } catch {} };
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped); // <-- unsubscribe
  },

  // ===== WebsiteDownloads APIs =====
  getWebsiteDownloads:     ()        => ipcRenderer.invoke("WebsiteDownloads:get-all"),
  addWebsiteDownload:      (item)    => ipcRenderer.invoke("WebsiteDownloads:add", item),
  updateWebsiteDownload:   (payload) => ipcRenderer.invoke("WebsiteDownloads:update", payload),
  deleteWebsiteDownload:   (id)      => ipcRenderer.invoke("WebsiteDownloads:delete", id),
  exportWebsiteDownloadsCsv: (rows, options = {}) =>
    ipcRenderer.invoke("WebsiteDownloads:export-csv", { rows, ...options }),

  on: (channel, handler) => {
    if (!ALLOWED_ON.has(channel) || typeof handler !== "function") return () => {};
    const wrapped = (_e, payload) => { try { handler(payload); } catch {} };
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  },

});
