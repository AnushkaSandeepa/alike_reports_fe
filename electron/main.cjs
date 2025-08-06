// electron/main.cjs
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');
const { shell } = require('electron');


const isDev = process.env.NODE_ENV === 'development';

function createWindow() {
  const win = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.cjs"), 
      contextIsolation: true,
      nodeIntegration: false,
    },
  });

  if (isDev) {
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// Dialog to pick a spreadsheet
ipcMain.handle('show-open-dialog', async (event, options) => {
  return await dialog.showOpenDialog(options);
});

// Avoids overwriting by uniquifying the filename if a name collision happens
const sanitize = (name) => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_");

function getNextId(idFilePath) {
  let lastId = 0;

  // Try to read the last used ID from file
  try {
    const content = fs.readFileSync(idFilePath, 'utf-8');
    lastId = parseInt(content, 10);
    if (isNaN(lastId)) lastId = 0;
  } catch {
    // If file doesn't exist or is unreadable, start from 0
    lastId = 0;
  }

  const nextId = lastId + 1;

  // Save the new ID back to the file
  fs.writeFileSync(idFilePath, String(nextId), 'utf-8');

  // Return formatted ID
  return "SS" + nextId.toString().padStart(4, "0");
}


ipcMain.handle(
  "store-spreadsheet",
  async (_, { sourcePath, programType, programDate }) => {
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

      const baseDir = path.join(app.getPath("documents"), "uploadfiles"); // your folder inside Documents
      await fs.promises.mkdir(baseDir, { recursive: true });

      // Generate ID here:
      const idFilePath = path.join(baseDir, "last_id.txt");
      const id = getNextId(idFilePath); 


      // Folder to store spreadsheets
      const spreadsheetDir = path.join(app.getPath("userData"), "UploadFile");
      await fs.promises.mkdir(spreadsheetDir, { recursive: true });

      const sanitize = (name) => name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();
      const originalName = path.basename(resolvedSource, ext);
      const safeOriginal = sanitize(originalName);
      const safeProgramType = sanitize(String(programType || "general"));
      const safeProgramDate = sanitize(String(programDate || ""));
      let fileName = `${safeProgramType}_${safeProgramDate}_${safeOriginal}${ext}`;
      let destFilePath = path.join(spreadsheetDir, fileName);

      // Ensure uniqueness if file exists
      try {
        await fs.promises.access(destFilePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        fileName = `${safeProgramType}_${safeProgramDate}_${safeOriginal}_${timestamp}${ext}`;
        destFilePath = path.join(spreadsheetDir, fileName);
      } catch {}

      await fs.promises.copyFile(resolvedSource, destFilePath);

      // Metadata
      const metadata = {
        fileId: id,
        originalPath: resolvedSource,
        storedAt: destFilePath,
        programType,
        programDate,
        savedOn: new Date().toISOString(),
      };

      // Save metadata in 'Documents' folder under userData
      const documentsDir = path.join(app.getPath("userData"), "Documents");
      await fs.promises.mkdir(documentsDir, { recursive: true });

      const metadataDbPath = path.join(documentsDir, "uploads_db.json");
      let allMetadata = [];

      try {
        const existing = await fs.promises.readFile(metadataDbPath, "utf-8");
        allMetadata = JSON.parse(existing);
      } catch {}

      allMetadata.push(metadata);

      await fs.promises.writeFile(
        metadataDbPath,
        JSON.stringify(allMetadata, null, 2),
        "utf-8"
      );

      return { success: true, metadata };

    } catch (err) {
      console.error("store-spreadsheet error:", err);
      return { success: false, error: err.message || "Unknown error" };
    }
  }
);


// Fetch uploaded spreadsheets metadata
ipcMain.handle("get-uploaded-spreadsheets", async () => {
  try {
    const documentsDir = path.join(app.getPath("userData"), "Documents");
    const metadataDbPath = path.join(documentsDir, "uploads_db.json");

    const data = await fs.promises.readFile(metadataDbPath, "utf-8");
    const parsed = JSON.parse(data);

    return { success: true, data: parsed };
  } catch (err) {
    console.error("Failed to read uploads_db.json:", err);
    return { success: false, error: err.message };
  }
});


const uploadFolder = path.join(app.getPath("userData"), "UploadFile");

ipcMain.on("open-upload-folder", () => {
  shell.openPath(uploadFolder);
});

// delete spreadsheet by fileId
ipcMain.handle("delete-spreadsheet", async (_, fileId) => {
  try {
    if (!fileId) throw new Error("fileId is required");

    const documentsDir = path.join(app.getPath("userData"), "Documents");
    const metadataDbPath = path.join(documentsDir, "uploads_db.json");

    // Read current metadata DB
    const data = await fs.promises.readFile(metadataDbPath, "utf-8");
    let allMetadata = JSON.parse(data);

    // Find the item to delete
    const itemIndex = allMetadata.findIndex(item => item.fileId === fileId);
    if (itemIndex === -1) {
      throw new Error("File metadata not found");
    }

    const item = allMetadata[itemIndex];

    // Delete the actual file from storedAt path
    try {
      await fs.promises.unlink(item.storedAt);
    } catch (err) {
      console.warn("File deletion error (maybe already deleted?):", err.message);
    }

    // Remove metadata from array
    allMetadata.splice(itemIndex, 1);

    // Write updated metadata back to DB file
    await fs.promises.writeFile(metadataDbPath, JSON.stringify(allMetadata, null, 2), "utf-8");

    return { success: true };
  } catch (err) {
    console.error("delete-spreadsheet error:", err);
    return { success: false, error: err.message || "Unknown error" };
  }
});



