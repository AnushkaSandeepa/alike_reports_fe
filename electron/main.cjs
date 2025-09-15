// electron/main.cjs
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// Use app.isPackaged instead of NODE_ENV checks (more reliable in builds)
const isDev = !app.isPackaged;

// Register IPC modules (unchanged)
require("./ipcHandlers.cjs")(ipcMain);
require("./ipcReportGenerate.cjs")(ipcMain);
require("./ipcPeriodReports.cjs")(ipcMain);
require("./ipcAdditionalEvaluations.cjs")();

function getIndexHtmlPath() {
  // Support both build layouts:
  const candidates = [
    path.join(__dirname, "../dist/index.html"),
    path.join(__dirname, "../dist/renderer/index.html"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error(
    "Renderer build not found. Did you run `npm run build:renderer`?"
  );
}


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
    const devUrl = process.env.VITE_DEV_SERVER_URL || "http://localhost:5173";
    win.loadURL(devUrl);
    win.webContents.openDevTools();
  } else {
    win.loadFile(getIndexHtmlPath());
    win.webContents.on("did-fail-load", (_e, code, desc, url) => {
      console.error("did-fail-load", code, desc, url);
    });
    win.webContents.on("console-message", (_e, level, message) => {
      console.log("renderer:", message);
    });
    win.webContents.openDevTools(); // remove after it’s fixed

  }
}

const gotLock = app.requestSingleInstanceLock();
if (!gotLock) {
  app.quit();
} else {
  app.on("second-instance", () => {
    const [win] = BrowserWindow.getAllWindows();
    if (win) {
      if (win.isMinimized()) win.restore();
      win.focus();
    }
  });

  app.whenReady().then(() => {
    // Windows notifications & jump list identity
    try { app.setAppUserModelId("com.alike.reports"); } catch {}
    createWindow();
    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
