// electron/ipcHandlers.cjs
const { dialog, app, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");

// ---------- utils ----------
const sanitize = (name) => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();
const normKey = (k) => String(k).toLowerCase().replace(/[^a-z0-9]+/g, "");

function getNextId(idFilePath) {
  let lastId = 0;
  try {
    lastId = parseInt(fs.readFileSync(idFilePath, "utf-8"), 10) || 0;
  } catch {
    lastId = 0;
  }
  const nextId = lastId + 1;
  fs.writeFileSync(idFilePath, String(nextId), "utf-8");
  return "SS" + nextId.toString().padStart(4, "0");
}

function excelDateToJSDate(serial) {
  const utcDays = Math.floor(serial - 25569);
  const utcSeconds = utcDays * 86400;
  return new Date(utcSeconds * 1000);
}

function toDate(val) {
  if (val == null || val === "") return null;
  if (typeof val === "number") return excelDateToJSDate(val);
  const s = String(val).trim();

  // yyyy-mm-dd or yyyy/mm/dd
  if (/^\d{4}[-/]\d{1,2}[-/]\d{1,2}$/.test(s)) {
    const [y, m, d] = s.split(/[-/]/).map(Number);
    const dt = new Date(y, m - 1, d);
    return isNaN(dt) ? null : dt;
  }
  // dd/mm/yyyy or d/m/yy or dd-mm-yyyy
  if (/^\d{1,2}[/-]\d{1,2}[/-]\d{2,4}$/.test(s)) {
    const [d, m, yRaw] = s.split(/[/-]/);
    const y = Number(yRaw.length === 2 ? (Number(yRaw) + 2000) : yRaw);
    const dt = new Date(y, Number(m) - 1, Number(d));
    return isNaN(dt) ? null : dt;
  }
  const dt = new Date(s);
  return isNaN(dt) ? null : dt;
}

function modeString(arr) {
  const freq = new Map();
  for (const v of arr) {
    const s = String(v || "").trim();
    if (!s) continue;
    freq.set(s, (freq.get(s) || 0) + 1);
  }
  let best = "";
  let bestC = 0;
  for (const [k, c] of freq.entries()) {
    if (c > bestC) { best = k; bestC = c; }
  }
  return best || "";
}

// ---------- core extraction shared logic ----------
function extractFromJsonRows(jsonData) {
  if (!jsonData || !jsonData.length) {
    return {
      success: false,
      error: "Sheet is empty",
      eventDate: null,
      facilitator: "Anushka Sandeepa",
      fundingBody: "",
      range: { start: null, end: null },
    };
  }

  // Auto-detect header row (scan first 10 rows)
  const rows = Array.isArray(jsonData[0]) ? jsonData : null;
  let data;
  if (rows) {
    // jsonData is header:1 form, but we pass objects; we typically call with sheet_to_json(..., header:1) first
    data = jsonData; // not used in this flow
  }

  // Build header map from the first object row
  const firstRow = jsonData[0];
  const headerMap = Object.keys(firstRow).reduce((acc, key) => {
    acc[normKey(key)] = key;
    return acc;
  }, {});

  // Facilitator
  const facilitatorCandidates = [
    "persionincharge","personincharge","programmeincharge","programincharge",
    "facilitator","coordinator","incharge","lead","personresponsible","presenter"
  ];
  let facilitator = "";
  for (const cand of facilitatorCandidates) {
    const col = headerMap[cand];
    if (col) {
      const v = String(jsonData[0][col] ?? "").trim();
      if (v) { facilitator = v; break; }
    }
  }
  if (!facilitator) facilitator = "Anushka Sandeepa";

  // Funding body
  const fundingCandidates = [
    "fundingbody","funding","fundingagency","fundingorg",
    "fundingorganisation","fundingorganization","funder","fundingbodies"
  ];
  let fundingBody = "";
  for (const cand of fundingCandidates) {
    const col = headerMap[cand];
    if (col) {
      const vals = jsonData.map(r => r[col]).filter(v => v != null && String(v).trim());
      fundingBody = modeString(vals);
      break;
    }
  }

  // Dates
  const dateCandidates = ["eventdate","workshopdate","programdate","sessiondate","date"];
  let allDates = [];
  for (const cand of dateCandidates) {
    const col = headerMap[cand];
    if (!col) continue;
    for (const row of jsonData) {
      const dt = toDate(row[col]);
      if (dt) allDates.push(dt);
    }
    if (allDates.length) break;
  }

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

  return { success: true, eventDate, facilitator, fundingBody, range };
}

// ---------- file/bytes readers ----------
function extractSheetMetadata(filePath) {
  try {
    if (!filePath || !fs.existsSync(filePath)) {
      return {
        success: false,
        error: `File not found at path: ${filePath}`,
        eventDate: null,
        facilitator: "Anushka Sandeepa",
        fundingBody: "",
        range: { start: null, end: null },
      };
    }

    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];

    // Use header autodetect: build objects reliably by finding header row
    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
    if (!rows || !rows.length) {
      return {
        success: false,
        error: "Sheet is empty",
        eventDate: null,
        facilitator: "Anushka Sandeepa",
        fundingBody: "",
        range: { start: null, end: null },
      };
    }

    // Heuristic: first row that contains a known alias when normalised
    const headerAliases = new Set([
      "eventdate","workshopdate","programdate","sessiondate","date",
      "persionincharge","personincharge","programmeincharge","programincharge",
      "facilitator","coordinator","incharge","lead","personresponsible","presenter",
      "fundingbody","funding","fundingagency","fundingorg","fundingorganisation",
      "fundingorganization","funder","fundingbodies"
    ]);

    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const r = rows[i] || [];
      const hit = r.some((cell) => cell && headerAliases.has(normKey(cell)));
      if (hit) { headerRowIdx = i; break; }
    }
    if (headerRowIdx === -1) headerRowIdx = 0;

    const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: true, range: headerRowIdx, defval: "" });
    return extractFromJsonRows(jsonData);
  } catch (err) {
    return {
      success: false,
      error: String(err?.message || err),
      eventDate: null,
      facilitator: "Anushka Sandeepa",
      fundingBody: "",
      range: { start: null, end: null },
    };
  }
}

function workbookFromBytes(bytes) {
  const buf = Buffer.from(bytes);
  return XLSX.read(buf, { type: "buffer" });
}

function extractSheetMetadataFromBytes(bytes /* array of numbers */, originalName = "upload.xlsx") {
  try {
    const wb = workbookFromBytes(bytes, originalName);
    const sheet = wb.Sheets[wb.SheetNames[0]];

    const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, raw: true });
    if (!rows || !rows.length) {
      return {
        success: false,
        error: "Sheet is empty",
        eventDate: null,
        facilitator: "Anushka Sandeepa",
        fundingBody: "",
        range: { start: null, end: null },
      };
    }

    const headerAliases = new Set([
      "eventdate","workshopdate","programdate","sessiondate","date",
      "persionincharge","personincharge","programmeincharge","programincharge",
      "facilitator","coordinator","incharge","lead","personresponsible","presenter",
      "fundingbody","funding","fundingagency","fundingorg","fundingorganisation",
      "fundingorganization","funder","fundingbodies"
    ]);

    let headerRowIdx = -1;
    for (let i = 0; i < Math.min(rows.length, 10); i++) {
      const r = rows[i] || [];
      const hit = r.some((cell) => cell && headerAliases.has(normKey(cell)));
      if (hit) { headerRowIdx = i; break; }
    }
    if (headerRowIdx === -1) headerRowIdx = 0;

    const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: true, range: headerRowIdx, defval: "" });
    return extractFromJsonRows(jsonData);
  } catch (err) {
    return {
      success: false,
      error: String(err?.message || err),
      eventDate: null,
      facilitator: "Anushka Sandeepa",
      fundingBody: "",
      range: { start: null, end: null },
    };
  }
}

// ---------- IPC ----------
module.exports = (ipcMain) => {
  // File picker passthrough
  ipcMain.handle("show-open-dialog", async (_, options) => {
    return await dialog.showOpenDialog(options);
  });

  // Existence check for dropped path
  ipcMain.handle("fs:path-exists", async (_e, p) => {
    try { return !!(p && fs.existsSync(p)); } catch { return false; }
  });

  // Metadata (by path or bytes)
  ipcMain.handle("extract-event-metadata", async (_, filePath) => {
    return extractSheetMetadata(filePath);
  });
  ipcMain.handle("extract-event-metadata-bytes", async (_e, { bytes, originalName }) => {
    return extractSheetMetadataFromBytes(bytes, originalName);
  });

  // Store spreadsheet (by path)
  ipcMain.handle(
    "store-spreadsheet",
    async (
      _,
      { sourcePath, programType, programDate, personIncharge, fundingBody, dateRange }
    ) => {
      try {
        if (!sourcePath) throw new Error("sourcePath is required");

        const allowedExts = [".csv", ".xlsx"];
        const resolvedSource = path.resolve(sourcePath);

        let stat;
        try {
          stat = await fs.promises.stat(resolvedSource);
          if (!stat.isFile()) throw new Error("Source path is not a file.");
        } catch {
          throw new Error(`Source file not found: ${resolvedSource}`);
        }

        const ext = path.extname(resolvedSource).toLowerCase();
        if (!allowedExts.includes(ext)) {
          throw new Error(`Unsupported file type "${ext}". Only .xlsx and .csv are allowed.`);
        }

        const documentsDir = path.join(app.getPath("userData"), "Documents");
        await fs.promises.mkdir(documentsDir, { recursive: true });

        const uploadsBase = path.join(app.getPath("userData"), "UploadFile");
        await fs.promises.mkdir(uploadsBase, { recursive: true });

        const fbNorm = String(fundingBody || "").trim().toLowerCase();
        let subfolder = "general";
        if (fbNorm === "doc") subfolder = "DOC";
        else if (fbNorm === "doh") subfolder = "DOH";

        const spreadsheetDir = path.join(uploadsBase, subfolder);
        await fs.promises.mkdir(spreadsheetDir, { recursive: true });

        const id = getNextId(path.join(documentsDir, "last_id.txt"));
        const originalName = path.basename(resolvedSource, ext);
        const safeOriginal = sanitize(originalName);

        let fileName = `${safeOriginal}${ext}`;
        let destFilePath = path.join(spreadsheetDir, fileName);

        try {
          await fs.promises.access(destFilePath);
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          fileName = `${safeOriginal}_${timestamp}${ext}`;
          destFilePath = path.join(spreadsheetDir, fileName);
        } catch {}
        await fs.promises.copyFile(resolvedSource, destFilePath);

        let personInchargeVal = (personIncharge && String(personIncharge).trim()) || null;

        // dateRange normalisation
        let rangeObj = { start: null, end: null };
        if (Array.isArray(dateRange)) {
          rangeObj = { start: dateRange[0] || null, end: dateRange[1] || null };
        } else if (dateRange && typeof dateRange === "object") {
          rangeObj = { start: dateRange.start || null, end: dateRange.end || null };
        }

        // Fill missing bits by re-reading file
        const needExtract = !personInchargeVal || !rangeObj.start || !rangeObj.end;
        const extracted = needExtract ? extractSheetMetadata(destFilePath) : null;

        if (!personInchargeVal) {
          personInchargeVal = extracted?.facilitator || "Anushka Sandeepa";
        }
        if (!rangeObj.start || !rangeObj.end) {
          rangeObj = {
            start: extracted?.range?.start || rangeObj.start || null,
            end: extracted?.range?.end || rangeObj.end || null,
          };
        }
        if (rangeObj.start && !rangeObj.end) rangeObj.end = rangeObj.start;
        if (rangeObj.end && !rangeObj.start) rangeObj.start = rangeObj.end;

        const metadata = {
          fileId: id,
          originalPath: resolvedSource,
          storedAt: destFilePath,
          programType,
          programDate,
          filesStatus: "Active",
          savedOn: new Date().toISOString(),
          facilitator: personInchargeVal,
          fundingBody,
          includedRange: { start: rangeObj.start, end: rangeObj.end },
          schemaVersion: 1,
        };

        const metadataDbPath = path.join(documentsDir, "uploads_db.json");
        let allMetadata = [];
        try {
          const existing = await fs.promises.readFile(metadataDbPath, "utf-8");
          allMetadata = JSON.parse(existing || "[]");
        } catch {}
        allMetadata.push(metadata);
        await fs.promises.writeFile(metadataDbPath, JSON.stringify(allMetadata, null, 2), "utf-8");

        return { success: true, metadata };
      } catch (err) {
        return { success: false, error: String(err?.message || err) };
      }
    }
  );

  // Store spreadsheet (by bytes)
  ipcMain.handle("store-spreadsheet-bytes", async (_e, { bytes, originalName, programType, programDate, personIncharge, fundingBody, dateRange }) => {
    try {
      if (!bytes || !bytes.length) throw new Error("No file bytes provided.");
      const documentsDir = path.join(app.getPath("userData"), "Documents");
      await fs.promises.mkdir(documentsDir, { recursive: true });

      const uploadsBase = path.join(app.getPath("userData"), "UploadFile");
      await fs.promises.mkdir(uploadsBase, { recursive: true });

      const fbNorm = String(fundingBody || "").trim().toLowerCase();
      let subfolder = "general";
      if (fbNorm === "doc") subfolder = "DOC";
      else if (fbNorm === "doh") subfolder = "DOH";
      const spreadsheetDir = path.join(uploadsBase, subfolder);
      await fs.promises.mkdir(spreadsheetDir, { recursive: true });

      const parsed = path.parse(originalName || "upload.xlsx");
      const safeOriginal = sanitize(parsed.name || "upload");
      const safeExt = parsed.ext && [".xlsx", ".csv"].includes(parsed.ext.toLowerCase()) ? parsed.ext.toLowerCase() : ".xlsx";

      let fileName = `${safeOriginal}${safeExt}`;
      let destFilePath = path.join(spreadsheetDir, fileName);
      try {
        await fs.promises.access(destFilePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        fileName = `${safeOriginal}_${timestamp}${safeExt}`;
        destFilePath = path.join(spreadsheetDir, fileName);
      } catch {}
      await fs.promises.writeFile(destFilePath, Buffer.from(bytes));

      // Extract missing metadata from the written file
      let personInchargeVal = (personIncharge && String(personIncharge).trim()) || null;

      let rangeObj = { start: dateRange?.start || null, end: dateRange?.end || null };
      const needExtract = !personInchargeVal || !rangeObj.start || !rangeObj.end;
      if (needExtract) {
        const meta = extractSheetMetadata(destFilePath);
        if (!personInchargeVal) personInchargeVal = meta?.facilitator || "Anushka Sandeepa";
        if (!rangeObj.start || !rangeObj.end) {
          rangeObj = {
            start: meta?.range?.start || rangeObj.start || null,
            end: meta?.range?.end || rangeObj.end || null,
          };
        }
        if (rangeObj.start && !rangeObj.end) rangeObj.end = rangeObj.start;
        if (rangeObj.end && !rangeObj.start) rangeObj.start = rangeObj.end;
      }

      const id = getNextId(path.join(documentsDir, "last_id.txt"));
      const metadata = {
        fileId: id,
        originalPath: `(bytes) ${originalName || ""}`,
        storedAt: destFilePath,
        programType,
        programDate,
        filesStatus: "Active",
        savedOn: new Date().toISOString(),
        facilitator: personInchargeVal || "Anushka Sandeepa",
        fundingBody,
        includedRange: { start: rangeObj.start, end: rangeObj.end },
        schemaVersion: 1,
      };

      const metadataDbPath = path.join(documentsDir, "uploads_db.json");
      let allMetadata = [];
      try {
        const existing = await fs.promises.readFile(metadataDbPath, "utf-8");
        allMetadata = JSON.parse(existing || "[]");
      } catch {}
      allMetadata.push(metadata);
      await fs.promises.writeFile(metadataDbPath, JSON.stringify(allMetadata, null, 2), "utf-8");

      return { success: true, metadata };
    } catch (err) {
      return { success: false, error: String(err?.message || err) };
    }
  });

  // Status + listing + delete
  ipcMain.handle("update-spreadsheet-status", async (_e, { fileId, status }) => {
    try {
      if (!fileId) throw new Error("fileId is required");
      if (!["Active", "Inactive"].includes(status))
        throw new Error("status must be 'Active' or 'Inactive'");

      const documentsDir = path.join(app.getPath("userData"), "Documents");
      const metadataDbPath = path.join(documentsDir, "uploads_db.json");

      let db = [];
      try {
        const raw = await fs.promises.readFile(metadataDbPath, "utf-8");
        db = JSON.parse(raw || "[]");
      } catch {}

      const idx = db.findIndex((m) => m.fileId === fileId);
      if (idx === -1) throw new Error("File metadata not found");

      db[idx].filesStatus = status;
      await fs.promises.writeFile(metadataDbPath, JSON.stringify(db, null, 2), "utf-8");

      return { success: true, data: { fileId, status } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle("get-uploaded-spreadsheets", async () => {
    try {
      const documentsDir = path.join(app.getPath("userData"), "Documents");
      const metadataDbPath = path.join(documentsDir, "uploads_db.json");
      let data = "[]";
      try {
        data = await fs.promises.readFile(metadataDbPath, "utf-8");
      } catch {}
      return { success: true, data: JSON.parse(data || "[]") };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.on("open-upload-folder", () => {
    shell.openPath(path.join(app.getPath("userData"), "UploadFile"));
  });

  ipcMain.handle("delete-spreadsheet", async (_e, fileId) => {
    try {
      const documentsDir = path.join(app.getPath("userData"), "Documents");
      const metadataDbPath = path.join(documentsDir, "uploads_db.json");

      let allMetadata = [];
      try {
        const data = await fs.promises.readFile(metadataDbPath, "utf-8");
        allMetadata = JSON.parse(data || "[]");
      } catch {}

      const index = allMetadata.findIndex((item) => item.fileId === fileId);
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
