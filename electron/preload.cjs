// electron/preload.cjs
const { contextBridge, ipcRenderer } = require("electron");

const ALLOWED_ON = new Set([
  "period-updated",
  "period-progress",
  "report-updated",
  "WebsiteDownloads:updated",
]);

contextBridge.exposeInMainWorld("electronAPI", {
  // Picker (xlsx/csv only)
  pickSpreadsheet: async () => {
    const result = await ipcRenderer.invoke("show-open-dialog", {
      title: "Select spreadsheet",
      properties: ["openFile"],
      filters: [{ name: "Sheets", extensions: ["xlsx", "csv"] }],
    });
    if (result.canceled || !result.filePaths.length) {
      return { success: false, error: "No file selected" };
    }
    return { success: true, filePath: result.filePaths[0] };
  },

  // Path existence check (for drag from VS Code / browsers)
  fsPathExists: (p) => ipcRenderer.invoke("fs:path-exists", p),

  // Metadata (path or bytes)
  extractSheetMetadata: (filePath) =>
    ipcRenderer.invoke("extract-event-metadata", filePath),
  extractSheetMetadataBytes: (bytes, originalName) =>
    ipcRenderer.invoke("extract-event-metadata-bytes", { bytes, originalName }),

  // Store (path or bytes)
  storeSpreadsheet: (payload) =>
    ipcRenderer.invoke("store-spreadsheet", payload),
  storeSpreadsheetBytes: (bytes, originalName, meta) =>
    ipcRenderer.invoke("store-spreadsheet-bytes", { bytes, originalName, ...meta }),

  updateSpreadsheetStatus: (fileId, status) =>
    ipcRenderer.invoke("update-spreadsheet-status", { fileId, status }),
  getUploadedSheets: () => ipcRenderer.invoke("get-uploaded-spreadsheets"),
  openUploadFolder: () => ipcRenderer.send("open-upload-folder"),
  deleteSpreadsheet: (fileId) => ipcRenderer.invoke("delete-spreadsheet", fileId),

  // Reports (unchanged)
  generateReport: (payload) => ipcRenderer.invoke("generate-report", payload),
  getReports: () => ipcRenderer.invoke("get-reports"),
  deleteReport: (id) => ipcRenderer.invoke("delete-report", id),
  updateReportStatus: (reportId, status) =>
    ipcRenderer.invoke("update-report-status", { reportId, status }),

  // Period reports
  getPeriodReports: () => ipcRenderer.invoke("get-period-reports"),
  generatePeriodReport: (payload) => ipcRenderer.invoke("report_generator_period", payload),
  deletePeriodReport: (id) => ipcRenderer.invoke("delete-period-report", id),

  // Unified event subscription
  on: (channel, handler) => {
    if (!ALLOWED_ON.has(channel) || typeof handler !== "function") return () => {};
    const wrapped = (_e, payload) => { try { handler(payload); } catch {} };
    ipcRenderer.on(channel, wrapped);
    return () => ipcRenderer.removeListener(channel, wrapped);
  },

  // WebsiteDownloads (unchanged)
  getWebsiteDownloads:     ()        => ipcRenderer.invoke("WebsiteDownloads:get-all"),
  addWebsiteDownload:      (item)    => ipcRenderer.invoke("WebsiteDownloads:add", item),
  updateWebsiteDownload:   (payload) => ipcRenderer.invoke("WebsiteDownloads:update", payload),
  deleteWebsiteDownload:   (id)      => ipcRenderer.invoke("WebsiteDownloads:delete", id),
  exportWebsiteDownloadsCsv: (rows, options = {}) =>
    ipcRenderer.invoke("WebsiteDownloads:export-csv", { rows, ...options }),

  // Additional Evaluations (unchanged)
  uploadAdditionalData: (documentType, filePath) =>
    ipcRenderer.invoke("AdditionalEvaluations:upload", { documentType, filePath }),
  uploadAdditionalDataAuto: async (documentType, fileOrPath) => {
    if (typeof fileOrPath === "string") {
      return ipcRenderer.invoke("AdditionalEvaluations:upload", { documentType, filePath: fileOrPath });
    }
    if (fileOrPath?.path && typeof fileOrPath.path === "string") {
      return ipcRenderer.invoke("AdditionalEvaluations:upload", { documentType, filePath: fileOrPath.path });
    }
    const ab = await fileOrPath.arrayBuffer();
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

  // Social Media (unchanged)
  getSocialFilters: (platform) => ipcRenderer.invoke("SocialMedia:get-filters", { platform }),
  getSocialData: (opts) => ipcRenderer.invoke("SocialMedia:get-data", opts),
  listSocialPlatforms: () => ipcRenderer.invoke("SocialMedia:list-platforms"),
  getSocialPosts: (filters) => ipcRenderer.invoke("SocialPosts:get", filters),
  getSocialReachSummary: (opts) => ipcRenderer.invoke("SocialMedia:get-reach-summary", opts),

  // Maintenance (unchanged)
  copyMaintenancePdf: () => ipcRenderer.invoke("maintenance.copy-pdf"),
  pushUploadsToOneDrive: (opts) => ipcRenderer.invoke("maintenance.push-uploads-to-onedrive", opts || {}),
  getOneDrivePath: () => ipcRenderer.invoke("maintenance.get-onedrive-path"),
});
