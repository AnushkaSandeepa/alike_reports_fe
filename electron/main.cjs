// electron/main.cjs
const { app, BrowserWindow, ipcMain, dialog } = require('electron');
const path = require('path');
const fs = require('fs');

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

