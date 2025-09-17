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
  storeSpreadsheet: ({ sourcePath, programType, programDate, facilitator, dateRange , fundingBody,}) =>
   ipcRenderer.invoke("store-spreadsheet", {
    sourcePath, programType, programDate, facilitator, dateRange,  fundingBody,
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

  // ===== WebsiteDownloads APIs for PIF =====
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

  // ===== WebsiteDownloads APIs for SOL insights =====
  uploadAdditionalData: (documentType, filePath) =>
    ipcRenderer.invoke("AdditionalEvaluations:upload", { documentType, filePath }),

  // New: pass a File object OR a path string; it will do the right thing
  uploadAdditionalDataAuto: async (documentType, fileOrPath) => {
    if (typeof fileOrPath === "string") {
      return ipcRenderer.invoke("AdditionalEvaluations:upload", { documentType, filePath: fileOrPath });
    }
    if (fileOrPath?.path && typeof fileOrPath.path === "string") {
      // Electron sometimes gives you a real absolute path here
      return ipcRenderer.invoke("AdditionalEvaluations:upload", {
        documentType,
        filePath: fileOrPath.path
      });
    }
    // No reliable path -> read bytes and send them
    const ab = await fileOrPath.arrayBuffer();
    // pass a plain array (best cross-IPC compatibility)
    const bytesArray = Array.from(new Uint8Array(ab));
    return ipcRenderer.invoke("AdditionalEvaluations:upload", {
      documentType,
      originalName: fileOrPath.name || "upload.xlsx",
      fileBytes: bytesArray
    });
  },

  onAdditionalEvaluationsProgress: (cb) => {
    const fn = (_e, p) => cb?.(p);
    ipcRenderer.on("AdditionalEvaluations:progress", fn);
    return () => ipcRenderer.removeListener("AdditionalEvaluations:progress", fn);
  },

  readAnalytics: () => ipcRenderer.invoke("Additional:read-analytics"),
  onAnalyticsUpdated: (cb) => {
    const fn = () => cb?.();
    ipcRenderer.removeAllListeners("Additional:analytics-updated");
    ipcRenderer.on("Additional:analytics-updated", fn);
    return () => ipcRenderer.off("Additional:analytics-updated", fn);
  },

});
