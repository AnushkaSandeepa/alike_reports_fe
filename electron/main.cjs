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
      preload: path.join(__dirname, 'preload.cjs'),
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

// Store spreadsheet with metadata
ipcMain.handle('store-spreadsheet', async (event, { sourcePath, programType, programDate }) => {
  try {
    const baseDir = path.join(app.getPath('userData'), 'uploads');
    if (!fs.existsSync(baseDir)) fs.mkdirSync(baseDir, { recursive: true });

    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const safeProgramType = programType.replace(/[^a-zA-Z0-9_-]/g, '_');
    const safeProgramDate = programDate.replace(/[^0-9-]/g, '');
    const destFolder = path.join(baseDir, `${safeProgramType}_${safeProgramDate}_${timestamp}`);
    fs.mkdirSync(destFolder, { recursive: true });

    const fileName = path.basename(sourcePath);
    const destFilePath = path.join(destFolder, fileName);
    fs.copyFileSync(sourcePath, destFilePath);

    const metadata = {
      originalPath: sourcePath,
      storedAt: destFilePath,
      programType,
      programDate,
      savedOn: new Date().toISOString(),
    };
    fs.writeFileSync(
      path.join(destFolder, 'metadata.json'),
      JSON.stringify(metadata, null, 2),
      'utf-8'
    );

    return { success: true, metadata };
  } catch (err) {
    return { success: false, error: err.message };
  }
});
