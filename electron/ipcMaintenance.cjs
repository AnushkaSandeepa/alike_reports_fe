// electron/ipcMaintenance.cjs
const { app, ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const os = require("os");

const OVERRIDE_FILE = "onedrive_override.json";

function loadOverride() {
  try {
    const p = path.join(app.getPath("userData"), OVERRIDE_FILE);
    if (fs.existsSync(p)) {
      const j = JSON.parse(fs.readFileSync(p, "utf8"));
      if (j && typeof j.path === "string" && fs.existsSync(j.path)) return j.path;
    }
  } catch {}
  return null;
}
function saveOverride(dir) {
  try {
    const p = path.join(app.getPath("userData"), OVERRIDE_FILE);
    fs.writeFileSync(p, JSON.stringify({ path: dir }, null, 2), "utf8");
  } catch {}
}
function isDir(p) { try { return fs.existsSync(p) && fs.statSync(p).isDirectory(); } catch { return false; } }

function autoDetectOneDrive() {
  const candidates = [
    process.env.OneDrive,
    process.env.OneDriveConsumer,
    process.env.OneDriveCommercial,
  ].filter(Boolean);

  const home = os.homedir();
  candidates.push(path.join(home, "OneDrive"));
  try {
    for (const e of fs.readdirSync(home, { withFileTypes: true })) {
      if (e.isDirectory() && /^OneDrive( - .+)?$/i.test(e.name)) {
        candidates.push(path.join(home, e.name));
      }
    }
  } catch {}

  for (const c of candidates) if (c && isDir(c)) return c;
  return null;
}

async function ensureDir(p) { await fs.promises.mkdir(p, { recursive: true }); }

async function copyDir(src, dest) {
  const entries = await fs.promises.readdir(src, { withFileTypes: true });
  let count = 0;
  for (const e of entries) {
    const s = path.join(src, e.name);
    const d = path.join(dest, e.name);
    if (e.isDirectory()) {
      await ensureDir(d);
      count += await copyDir(s, d);
    } else if (e.isFile()) {
      await fs.promises.copyFile(s, d);
      count++;
    }
  }
  return count;
}

module.exports = function registerMaintenanceIPC() {
  ipcMain.handle("maintenance.get-onedrive-path", async () => {
    return loadOverride() || autoDetectOneDrive();
  });

  ipcMain.handle("maintenance.push-uploads-to-onedrive", async (_evt, opts = {}) => {
    try {
      const includeDocs = !!opts.includeDocs;

      // --- Resolve sources ---
      const userData = app.getPath("userData");

      // UploadFile (two historical layouts supported)
      const srcUploadA = path.join(userData, "alike-reports", "UploadFile");
      const srcUploadB = path.join(userData, "UploadFile");
      const srcUpload  = isDir(srcUploadA) ? srcUploadA : (isDir(srcUploadB) ? srcUploadB : null);
      if (!srcUpload) return { ok: false, error: `No UploadFile folder found under ${userData}` };

      // Documents (your app’s data dir)
      const srcDocs = path.join(userData, "Documents");
      const hasDocs = includeDocs && isDir(srcDocs);

      // --- Resolve OneDrive root ---
      let oneDriveRoot = loadOverride() || autoDetectOneDrive();
      if (!oneDriveRoot) {
        const pick = await dialog.showOpenDialog({
          title: "Select your OneDrive folder",
          properties: ["openDirectory", "createDirectory"]
        });
        if (pick.canceled || !pick.filePaths?.[0]) return { ok: false, error: "OneDrive folder not selected." };
        const chosen = pick.filePaths[0];
        if (!isDir(chosen)) return { ok: false, error: "Selected path is not a folder." };
        oneDriveRoot = chosen;
        saveOverride(oneDriveRoot);
      }

      // --- Destinations ---
      const destRoot = path.join(oneDriveRoot, "alike-reports");
      const destUpload = path.join(destRoot, "UploadFile");
      const destDocs   = path.join(destRoot, "Documents");

      await ensureDir(destUpload);
      if (hasDocs) await ensureDir(destDocs);

      // --- Copy ---
      const counts = {};
      counts.UploadFile = await copyDir(srcUpload, destUpload);
      if (hasDocs) counts.Documents = await copyDir(srcDocs, destDocs);
      else counts.Documents = 0;

      return { ok: true, destRoot, counts, oneDriveRoot };
    } catch (err) {
      return { ok: false, error: String(err) };
    }
  });
};
