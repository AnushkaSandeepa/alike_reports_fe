const { dialog, app, shell } = require('electron');
const path = require('path');
const fs = require('fs');
const XLSX = require("xlsx");


const sanitize = (name) => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();

function getNextId(idFilePath) {
  let lastId = 0;
  try {
    lastId = parseInt(fs.readFileSync(idFilePath, 'utf-8'), 10) || 0;
  } catch {
    lastId = 0;
  }
  const nextId = lastId + 1;
  fs.writeFileSync(idFilePath, String(nextId), 'utf-8');
  return "SS" + nextId.toString().padStart(4, "0");
}

function excelDateToJSDate(serial) {
  // Basic 1900 system handling (sufficient for dates-only)
  const utcDays = Math.floor(serial - 25569);
  const utcSeconds = utcDays * 86400;
  return new Date(utcSeconds * 1000);
}

function extractSheetMetadata(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: true });

    if (!jsonData.length) {
      return {
        success: false,
        error: "Sheet is empty",
        eventDate: null,
        incharge: "Anushka Sandeepa",
        range: { start: null, end: null },
      };
    }

    // Normalise a header key: lowercase + remove spaces/underscores
    const normKey = (k) => String(k).toLowerCase().replace(/\s|_/g, "");

    // Build a map from normalised -> original header
    const keys = Object.keys(jsonData[0]).reduce((map, key) => {
      map[normKey(key)] = key;
      return map;
    }, {});

    // --- Person Incharge (allow common misspellings/variants) ---
    const inchargeCandidates = [
      "persionincharge", // matches your sheets spelling
      "personincharge",
      "programmeincharge",
      "programincharge",
      "incharge",
      "coordinator",
      "facilitator",
      "lead",
    ];
    let incharge = null;
    for (const c of inchargeCandidates) {
      if (keys[c]) {
        const v = jsonData[0][keys[c]];
        if (v != null && String(v).trim()) {
          incharge = String(v).trim();
          break;
        }
      }
    }
    if (!incharge) incharge = "Anushka Sandeepa";

    // --- Dates (Event Date / Workshop Date) ---
    const dateCandidates = ["eventdate", "workshopdate"];
    const foundDateKey = dateCandidates.find((c) => keys[c]);
    let allDates = [];

    if (foundDateKey) {
      const orig = keys[foundDateKey];
      for (const row of jsonData) {
        let v = row[orig];
        if (v == null || v === "") continue;
        if (typeof v === "number") v = excelDateToJSDate(v);
        else v = new Date(v);
        if (!isNaN(v)) allDates.push(v);
      }
    }

    // Decide eventDate (use oldest) and always provide a two-value range
    let eventDate = null;
    let range = { start: null, end: null };

    if (allDates.length) {
      allDates.sort((a, b) => a - b);
      const oldest = allDates[0];
      const latest = allDates[allDates.length - 1];
      const iso = (d) => d.toISOString().slice(0, 10);
      eventDate = iso(oldest);
      range = { start: iso(oldest), end: iso(latest) };
    }

    return { success: true, eventDate, incharge, range };
  } catch (err) {
    console.error("extractSheetMetadata failed:", err);
    return {
      success: false,
      error: String(err?.message || err),
      eventDate: null,
      incharge: "Anushka Sandeepa",
      range: { start: null, end: null },
    };
  }
}



module.exports = (ipcMain) => {
  // File picker
  ipcMain.handle('show-open-dialog', async (_, options) => {
    return await dialog.showOpenDialog(options);
  });

  ipcMain.handle("extract-event-metadata", async (_, filePath) => {
    return extractSheetMetadata(filePath);
  });


  ipcMain.handle('store-spreadsheet', async (_, {
    sourcePath,
    programType,
    programDate,
    personIncharge,
    dateRange,         
  }) => {
    try {
      if (!sourcePath) throw new Error("sourcePath is required");

      const allowedExts = [".csv", ".xls", ".xlsx"];
      const resolvedSource = path.resolve(sourcePath);

      const stat = await fs.promises.stat(resolvedSource);
      if (!stat.isFile()) throw new Error("Source path is not a file.");

      const ext = path.extname(resolvedSource).toLowerCase();
      if (!allowedExts.includes(ext)) {
        throw new Error(`Unsupported file type "${ext}".`);
      }

      // Ensure base dirs
      const documentsDir = path.join(app.getPath("userData"), "Documents");
      await fs.promises.mkdir(documentsDir, { recursive: true });

      const spreadsheetDir = path.join(app.getPath("userData"), "UploadFile");
      await fs.promises.mkdir(spreadsheetDir, { recursive: true });

      // IDs / names
      const id = getNextId(path.join(documentsDir, "last_id.txt"));
      const originalName = path.basename(resolvedSource, ext);
      const safeOriginal = sanitize(originalName);
      const safeProgramType = sanitize(String(programType || "general"));
      const safeProgramDate = sanitize(String(programDate || ""));

      // Copy with de-dupe naming
      let fileName = `${safeOriginal}${ext}`;
      let destFilePath = path.join(spreadsheetDir, fileName);

      try {
        await fs.promises.access(destFilePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        fileName = `${safeProgramType}_${safeProgramDate}_${safeOriginal}_${timestamp}${ext}`;
        destFilePath = path.join(spreadsheetDir, fileName);
      } catch {}
      await fs.promises.copyFile(resolvedSource, destFilePath);

      // ---- Enrich metadata ----
      // Normalise inputs
      let incharge = (personIncharge && String(personIncharge).trim()) || null;

      // dateRange can be array or object
      let rangeObj = { start: null, end: null };
      if (Array.isArray(dateRange)) {
        rangeObj = { start: dateRange[0] || null, end: dateRange[1] || null };
      } else if (dateRange && typeof dateRange === "object") {
        rangeObj = { start: dateRange.start || null, end: dateRange.end || null };
      }

      // If incomplete, extract from the file
      if (!incharge || !rangeObj.start || !rangeObj.end) {
        const extracted = extractSheetMetadata(resolvedSource); // your helper above
        if (!incharge) incharge = extracted?.incharge || "Anushka Sandeepa";
        if (!rangeObj.start || !rangeObj.end) {
          rangeObj = {
            start: extracted?.range?.start || rangeObj.start || null,
            end:   extracted?.range?.end   || rangeObj.end   || null,
          };
        }
      }

      // Always enforce two-point range (duplicate if single date is present)
      if (rangeObj.start && !rangeObj.end) rangeObj.end = rangeObj.start;
      if (rangeObj.end && !rangeObj.start) rangeObj.start = rangeObj.end;

      // Build and persist metadata
      const metadata = {
        fileId: id,
        originalPath: resolvedSource,
        storedAt: destFilePath,
        programType,
        programDate,
        filesStatus: "Active",
        savedOn: new Date().toISOString(),
        // NEW FIELDS:
        personIncharge: incharge || "Anushka Sandeepa",
        includedRange: { start: rangeObj.start, end: rangeObj.end },
        schemaVersion: 1,
      };

      const metadataDbPath = path.join(documentsDir, "uploads_db.json");
      let allMetadata = [];
      try {
        const existing = await fs.promises.readFile(metadataDbPath, "utf-8");
        allMetadata = JSON.parse(existing);
      } catch {}
      allMetadata.push(metadata);
      await fs.promises.writeFile(metadataDbPath, JSON.stringify(allMetadata, null, 2), "utf-8");

      return { success: true, metadata };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // in your Electron main IPC file
  ipcMain.handle("update-spreadsheet-status", async (_, { fileId, status }) => {
    try {
      if (!fileId) throw new Error("fileId is required");
      if (!["Active", "Inactive"].includes(status))
        throw new Error("status must be 'Active' or 'Inactive'");

      const documentsDir = path.join(app.getPath("userData"), "Documents");
      const metadataDbPath = path.join(documentsDir, "uploads_db.json");
      const raw = await fs.promises.readFile(metadataDbPath, "utf-8");
      const db = JSON.parse(raw);

      const idx = db.findIndex((m) => m.fileId === fileId);
      if (idx === -1) throw new Error("File metadata not found");

      db[idx].filesStatus = status;
      await fs.promises.writeFile(metadataDbPath, JSON.stringify(db, null, 2), "utf-8");

      return { success: true, data: { fileId, status } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });


  // Get uploaded spreadsheets
  ipcMain.handle('get-uploaded-spreadsheets', async () => {
    try {
      const documentsDir = path.join(app.getPath("userData"), "Documents");
      const metadataDbPath = path.join(documentsDir, "uploads_db.json");
      const data = await fs.promises.readFile(metadataDbPath, "utf-8");
      return { success: true, data: JSON.parse(data) };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  // Open upload folder
  ipcMain.on('open-upload-folder', () => {
    shell.openPath(path.join(app.getPath("userData"), "UploadFile"));
  });

  // Delete spreadsheet
  ipcMain.handle('delete-spreadsheet', async (_, fileId) => {
    try {
      const documentsDir = path.join(app.getPath("userData"), "Documents");
      const metadataDbPath = path.join(documentsDir, "uploads_db.json");

      const data = await fs.promises.readFile(metadataDbPath, "utf-8");
      let allMetadata = JSON.parse(data);

      const index = allMetadata.findIndex(item => item.fileId === fileId);
      if (index === -1) throw new Error("File metadata not found");

      try {
        await fs.promises.unlink(allMetadata[index].storedAt);
      } catch {}

      allMetadata.splice(index, 1);
      await fs.promises.writeFile(metadataDbPath, JSON.stringify(allMetadata, null, 2), "utf-8");

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
};



