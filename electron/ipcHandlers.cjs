// electron/ipcHandlers.cjs

const { dialog, app, shell } = require("electron");
const path = require("path");
const fs = require("fs");
const XLSX = require("xlsx");


const sanitize = (name) => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();

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
        facilitator: "Anushka Sandeepa",
        range: { start: null, end: null },
      };
    }

    const normKey = (k) => String(k).toLowerCase().replace(/\s|_/g, "");
    const keys = Object.keys(jsonData[0]).reduce((map, key) => {
      map[normKey(key)] = key;
      return map;
    }, {});

    // facilitator / person-in-charge candidates
    const facilitatorCandidates = [
      "persionincharge",
      "personincharge",
      "programmeincharge",
      "programincharge",
      "facilitator",
      "coordinator",
      "incharge",
      "lead",
    ];
    let facilitator = null;
    for (const c of facilitatorCandidates) {
      if (keys[c]) {
        const v = jsonData[0][keys[c]];
        if (v != null && String(v).trim()) {
          facilitator = String(v).trim();
          break;
        }
      }
    }
    if (!facilitator) facilitator = "Anushka Sandeepa";

    // date candidates
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

    return { success: true, eventDate, facilitator, range };
  } catch (err) {
    return {
      success: false,
      error: String(err?.message || err),
      eventDate: null,
      facilitator: "Anushka Sandeepa",
      range: { start: null, end: null },
    };
  }
}

module.exports = (ipcMain) => {
  // File picker
  ipcMain.handle("show-open-dialog", async (_, options) => {
    return await dialog.showOpenDialog(options);
  });

  ipcMain.handle("extract-event-metadata", async (_, filePath) => {
    return extractSheetMetadata(filePath);
  });

  ipcMain.handle(
    "store-spreadsheet",
    async (
      _,
      {
        sourcePath,
        programType,
        programDate,
        personIncharge,
        fundingBody,
        dateRange,
      }
    ) => {
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

        const documentsDir = path.join(app.getPath("userData"), "Documents");
        await fs.promises.mkdir(documentsDir, { recursive: true });

        const spreadsheetDir = path.join(app.getPath("userData"), "UploadFile");
        await fs.promises.mkdir(spreadsheetDir, { recursive: true });

        const id = getNextId(path.join(documentsDir, "last_id.txt"));
        const originalName = path.basename(resolvedSource, ext);
        const safeOriginal = sanitize(originalName);
        const safeProgramType = sanitize(String(programType || "general"));
        const safeProgramDate = sanitize(String(programDate || ""));

        let fileName = `${safeOriginal}${ext}`;
        let destFilePath = path.join(spreadsheetDir, fileName);

        try {
          await fs.promises.access(destFilePath);
          const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
          fileName = `${safeOriginal}_${timestamp}${ext}`;
          destFilePath = path.join(spreadsheetDir, fileName);
        } catch {}
        await fs.promises.copyFile(resolvedSource, destFilePath);

        // normalize inputs
        let personInchargeVal =
          (personIncharge && String(personIncharge).trim()) || null;

        // normalize date range
        let rangeObj = { start: null, end: null };
        if (Array.isArray(dateRange)) {
          rangeObj = { start: dateRange[0] || null, end: dateRange[1] || null };
        } else if (dateRange && typeof dateRange === "object") {
          rangeObj = { start: dateRange.start || null, end: dateRange.end || null };
        }

        // fill missing bits from file
        const needExtract =
          !personInchargeVal || !rangeObj.start || !rangeObj.end;
        const extracted = needExtract
          ? extractSheetMetadata(resolvedSource)
          : null;

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
        await fs.promises.writeFile(
          metadataDbPath,
          JSON.stringify(allMetadata, null, 2),
          "utf-8"
        );

        return { success: true, metadata };
      } catch (err) {
        return { success: false, error: err.message };
      }
    }
  );

  ipcMain.handle(
    "update-spreadsheet-status",
    async (_, { fileId, status }) => {
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
        } catch {} // treat as empty db if missing

        const idx = db.findIndex((m) => m.fileId === fileId);
        if (idx === -1) throw new Error("File metadata not found");

        db[idx].filesStatus = status;
        await fs.promises.writeFile(
          metadataDbPath,
          JSON.stringify(db, null, 2),
          "utf-8"
        );

        return { success: true, data: { fileId, status } };
      } catch (e) {
        return { success: false, error: e.message };
      }
    }
  );

  ipcMain.handle("get-uploaded-spreadsheets", async () => {
    try {
      const documentsDir = path.join(app.getPath("userData"), "Documents");
      const metadataDbPath = path.join(documentsDir, "uploads_db.json");
      let data = "[]";
      try {
        data = await fs.promises.readFile(metadataDbPath, "utf-8");
      } catch {} // file may not exist yet
      return { success: true, data: JSON.parse(data || "[]") };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.on("open-upload-folder", () => {
    shell.openPath(path.join(app.getPath("userData"), "UploadFile"));
  });

  ipcMain.handle("delete-spreadsheet", async (_, fileId) => {
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
      await fs.promises.writeFile(
        metadataDbPath,
        JSON.stringify(allMetadata, null, 2),
        "utf-8"
      );

      return { success: true };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });
};