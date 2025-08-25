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
  // Excel uses 1900 date system
  const utc_days = serial - 25569;
  const utc_value = utc_days * 86400; // seconds
  const date_info = new Date(utc_value * 1000);
  return date_info;
}

function extractEventDate(filePath) {
  try {
    const workbook = XLSX.readFile(filePath);
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const jsonData = XLSX.utils.sheet_to_json(sheet, { raw: true });

    const firstRow = jsonData[0];
    if (firstRow && firstRow["Event Date"] != null) {
      let dateValue = firstRow["Event Date"];

      if (typeof dateValue === "number") {
        dateValue = excelDateToJSDate(dateValue); // convert serial number
      } else {
        dateValue = new Date(dateValue); // fallback
      }

      return dateValue.toISOString().slice(0, 10); // "YYYY-MM-DD"
    }

    return null;
  } catch (err) {
    console.error("Error extracting event date:", err.message);
    return null;
  }
}



module.exports = (ipcMain) => {
  // File picker
  ipcMain.handle('show-open-dialog', async (_, options) => {
    return await dialog.showOpenDialog(options);
  });

  // Extract event date from spreadsheet
 ipcMain.handle("extract-event-date", async (_, filePath) => {
    const eventDate = extractEventDate(filePath); // already a string or null
    return {
      success: true,
      eventDate: eventDate || null, // no .toISOString()
    };
  });


  // Store spreadsheet
  ipcMain.handle('store-spreadsheet', async (_, { sourcePath, programType, programDate }) => {
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

      const baseDir = path.join(app.getPath("userData"), "Documents");
      await fs.promises.mkdir(baseDir, { recursive: true });

      const id = getNextId(path.join(baseDir, "last_id.txt"));

      const spreadsheetDir = path.join(app.getPath("userData"), "UploadFile");
      await fs.promises.mkdir(spreadsheetDir, { recursive: true });

      const originalName = path.basename(resolvedSource, ext);
      const safeOriginal = sanitize(originalName);
      const safeProgramType = sanitize(String(programType || "general"));
      const safeProgramDate = sanitize(String(programDate || ""));

      let fileName = `${safeOriginal}${ext}`;
      let destFilePath = path.join(spreadsheetDir, fileName);

      try {
        await fs.promises.access(destFilePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        fileName = `${safeProgramType}_${safeProgramDate}_${safeOriginal}_${timestamp}${ext}`;
        destFilePath = path.join(spreadsheetDir, fileName);
      } catch {}

      await fs.promises.copyFile(resolvedSource, destFilePath);

      const metadata = {
        fileId: id,
        originalPath: resolvedSource,
        storedAt: destFilePath,
        programType,
        programDate,
        savedOn: new Date().toISOString(),
      };

      const documentsDir = path.join(app.getPath("userData"), "Documents");
      await fs.promises.mkdir(documentsDir, { recursive: true });

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
