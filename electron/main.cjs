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
      if (!sourcePath) {
        throw new Error("sourcePath is required");
      }

      const allowedExts = [".csv", ".xls", ".xlsx"];
      const resolvedSource = path.resolve(sourcePath);

      // Ensure source exists and is a file
      let stat;
      try {
        stat = await fs.promises.stat(resolvedSource);
      } catch (e) {
        throw new Error(`Source file not found or inaccessible: ${e.message}`);
      }
      if (!stat.isFile()) {
        throw new Error("Source path is not a file.");
      }

      // Validate extension
      const ext = path.extname(resolvedSource).toLowerCase();
      if (!allowedExts.includes(ext)) {
        throw new Error(
          `Unsupported file type "${ext}". Only CSV and Excel files are allowed.`
        );
      }

      // Destination base: "uploadings" folder under userData
      const baseDir = path.join(app.getPath("userData"), "uploadings");
      await fs.promises.mkdir(baseDir, { recursive: true });

      // Sanitizer
      const sanitize = (name) =>
        name.replace(/[<>:"/\\|?*\x00-\x1F]/g, "_").trim();

      // Build safe filename
      const originalName = path.basename(resolvedSource, ext);
      const safeOriginal = sanitize(originalName);
      const safeProgramType = sanitize(String(programType || "general"));
      const safeProgramDate = sanitize(String(programDate || ""));
      let fileName = `${safeProgramType}_${safeProgramDate}_${safeOriginal}${ext}`;
      let destFilePath = path.join(baseDir, fileName);

      // If exists, append timestamp
      try {
        await fs.promises.access(destFilePath);
        const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
        fileName = `${safeProgramType}_${safeProgramDate}_${safeOriginal}_${timestamp}${ext}`;
        destFilePath = path.join(baseDir, fileName);
      } catch {
        // doesn't exist, OK
      }

      // Copy file
      await fs.promises.copyFile(resolvedSource, destFilePath);

      // Metadata sidecar
      const metadata = {
        originalPath: resolvedSource,
        storedAt: destFilePath,
        programType,
        programDate,
        savedOn: new Date().toISOString(),
      };
      const metadataPath = `${destFilePath}.metadata.json`;

      try {
        await fs.promises.writeFile(
          metadataPath,
          JSON.stringify(metadata, null, 2),
          "utf-8"
        );
      } catch (e) {
        // rollback copied file if metadata fails
        try {
          await fs.promises.unlink(destFilePath);
        } catch {}
        throw new Error(`Failed to write metadata: ${e.message}`);
      }

      return { success: true, metadata };
    } catch (err) {
      console.error("store-spreadsheet error:", err);
      return { success: false, error: err.message || "Unknown error" };
    }
  }
);
