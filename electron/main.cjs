// electron/main.cjs
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const fs = require("fs");

// More reliable than NODE_ENV for packaged apps
const isDev = !app.isPackaged;

// Lazy-require so we can call after ready
const ensureSeeds = require("./ensureSeeds.cjs");

// If your module exports a function(ipcMain) keep it, else call with ()
const registerIpcHandlers      = require("./ipcHandlers.cjs");
const registerReportGenerate   = require("./ipcReportGenerate.cjs");   // exports function ()
const registerPeriodReports    = require("./ipcPeriodReports.cjs");
const registerAdditionalEvals  = require("./ipcAdditionalEvaluations.cjs"); // exports function ()

function getIndexHtmlPath() {
  const candidates = [
    path.join(__dirname, "../dist/index.html"),
    path.join(__dirname, "../dist/renderer/index.html"),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  throw new Error("Renderer build not found. Did you run `npm run build:ui`?");
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
    win.webContents.openDevTools(); // dev only
  } else {
    win.loadFile(getIndexHtmlPath());
    win.webContents.on("did-fail-load", (_e, code, desc, url) => {
      console.error("did-fail-load", code, desc, url);
    });
    win.webContents.on("console-message", (_e, level, message) => {
      console.log("renderer:", message);
    });
    // win.webContents.openDevTools(); // ← keep disabled in prod
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
    try { app.setAppUserModelId("com.alike.reports"); } catch {}

    // 1) Seed after ready (safe app.getPath)
    ensureSeeds();

    // 2) Register IPCs
    registerIpcHandlers(ipcMain);
    try { registerReportGenerate(); } catch { registerReportGenerate(ipcMain); }
    registerPeriodReports(ipcMain);
    registerAdditionalEvals(); // zero-arg

    // 3) Create window
    createWindow();

    app.on("activate", () => {
      if (BrowserWindow.getAllWindows().length === 0) createWindow();
    });
  });

  app.on("window-all-closed", () => {
    if (process.platform !== "darwin") app.quit();
  });
}
