// electron/ipcAdditionalEvaluations.cjs
const { app, ipcMain, BrowserWindow, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

module.exports = function registerAdditionalEvaluationsIPC() {
  const dataDir = path.join(app.getPath("userData"), "Documents");
  const wdDbPath = path.join(dataDir, "website_downloads_db.json");

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(wdDbPath)) fs.writeFileSync(wdDbPath, "[]", "utf8");

  const readJson = async (p) => {
    try { return JSON.parse(await fs.promises.readFile(p, "utf8") || "[]"); }
    catch { return []; }
  };
  const writeJsonAtomic = async (p, db) => {
    const tmp = p + ".tmp";
    await fs.promises.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.promises.rename(tmp, p);
  };
  const makeId = () => "WD" + Math.random().toString(36).slice(2, 8).toUpperCase();

  const broadcast = (channel, payload) => {
    for (const win of BrowserWindow.getAllWindows()) {
      try { win.webContents.send(channel, payload); } catch {}
    }
  };

  // --- CSV helpers (with totals row support) ---
  const csvEscape = (v) => {
    if (v == null) return "";
    const s = String(v);
    return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
  };
  const toCSV = (rows, { includeTotals = true } = {}) => {
    const headers = ["id","name","downloads","created_at","updated_at"];
    const head = headers.join(",");
    const body = (rows || []).map(r =>
      [r.id, r.name, r.downloads, r.created_at, r.updated_at].map(csvEscape).join(",")
    ).join("\n");
    let csv = head + "\n" + body;
    if (includeTotals) {
      const total = (rows || []).reduce((s, r) => s + Number(r.downloads || 0), 0);
      const totalLine = ["", "TOTAL DOWNLOADS", total, "", ""].map(csvEscape).join(",");
      csv += "\n" + totalLine;
    }
    return csv + "\n";
  };

  // ========= WebsiteDownloads namespace =========
  ipcMain.handle("WebsiteDownloads:get-all", async () => {
    return await readJson(wdDbPath);
  });

  ipcMain.handle("WebsiteDownloads:add", async (_event, item) => {
    try {
      const name = (item?.name || "").trim();
      const n = Number(item?.downloads);
      if (!name) return { success: false, error: "name is required" };
      if (!Number.isFinite(n) || n < 0) return { success: false, error: "downloads must be a non-negative number" };

      const now = new Date().toISOString();
      const db = await readJson(wdDbPath);
      const rec = { id: makeId(), name, downloads: n, created_at: now, updated_at: now };
      db.push(rec);
      await writeJsonAtomic(wdDbPath, db);

      broadcast("WebsiteDownloads:updated", { type: "add", id: rec.id });
      return { success: true, data: rec };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle("WebsiteDownloads:update", async (_event, { id, name, downloads }) => {
    try {
      const db = await readJson(wdDbPath);
      const i = db.findIndex(r => r.id === id);
      if (i === -1) return { success: false, error: "record not found" };

      if (typeof name === "string") db[i].name = name.trim();
      if (downloads != null) {
        const n = Number(downloads);
        if (!Number.isFinite(n) || n < 0) return { success: false, error: "downloads must be a non-negative number" };
        db[i].downloads = n;
      }
      db[i].updated_at = new Date().toISOString();

      await writeJsonAtomic(wdDbPath, db);
      broadcast("WebsiteDownloads:updated", { type: "update", id });
      return { success: true, data: db[i] };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  ipcMain.handle("WebsiteDownloads:delete", async (_event, id) => {
    try {
      const db = await readJson(wdDbPath);
      const remaining = db.filter(r => r.id !== id);
      if (remaining.length === db.length) return { success: false, error: "record not found" };

      await writeJsonAtomic(wdDbPath, remaining);
      broadcast("WebsiteDownloads:updated", { type: "delete", id });
      return { success: true };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // Export CSV (includes header + TOTAL row; writes with UTF-8 BOM for Excel)
  ipcMain.handle("WebsiteDownloads:export-csv", async (_event, payload = {}) => {
    try {
      const rows = Array.isArray(payload.rows) && payload.rows.length
        ? payload.rows
        : await readJson(wdDbPath);

      const defaultName = `website_downloads_${new Date().toISOString().slice(0,10)}.csv`;
      const { canceled, filePath } = await dialog.showSaveDialog({
        title: "Save Website Downloads as CSV",
        defaultPath: defaultName,
        filters: [{ name: "CSV", extensions: ["csv"] }],
      });
      if (canceled || !filePath) return { success: false, canceled: true };

      const BOM = "\uFEFF";
      const csv = toCSV(rows, { includeTotals: payload.includeTotals !== false });
      await fs.promises.writeFile(filePath, BOM + csv, "utf8");
      return { success: true, path: filePath };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
};
