// electron/ipcAdditionalEvaluations.cjs
const { app, ipcMain, BrowserWindow, dialog } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

module.exports = function registerAdditionalEvaluationsIPC() {
  // ===== Directories =====
  const dataDir = path.join(app.getPath("userData"), "Documents");              // JSON + WebsiteDownloads DB
  const uploadSolDir = path.join(app.getPath("userData"), "UploadFile", "SOL"); // keep only ONE SLO file here
  const uploadSmDir  = path.join(app.getPath("userData"), "UploadFile", "SocialMedia"); // Social media uploads
  const socialMediaDir = path.join(dataDir, "social_media"); // Where Social Media JSONs will live
  const wdDbPath = path.join(dataDir, "website_downloads_db.json");
  const analyticsPath = path.join(dataDir, "analytics.json");

  // Ensure base dirs exist at startup
  for (const p of [dataDir, uploadSolDir, uploadSmDir, socialMediaDir]) {
    if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
  }
  if (!fs.existsSync(wdDbPath)) fs.writeFileSync(wdDbPath, "[]", "utf8");

  // ===== Utils =====
  const ensureDir = (p) => fs.promises.mkdir(p, { recursive: true });

  const readJson = async (p, fallback = []) => {
    try { return JSON.parse(await fs.promises.readFile(p, "utf8") || "[]"); }
    catch { return fallback; }
  };

  const writeJsonAtomic = async (p, obj) => {
    const tmp = p + ".tmp";
    await fs.promises.writeFile(tmp, JSON.stringify(obj, null, 2), "utf8");
    await fs.promises.rename(tmp, p);
  };

  const makeId = (prefix = "WD") => prefix + Math.random().toString(36).slice(2, 8).toUpperCase();
  const nowIso = () => new Date().toISOString();

  const broadcast = (channel, payload) => {
    for (const win of BrowserWindow.getAllWindows()) {
      try { win.webContents.send(channel, payload); } catch {}
    }
  };

  const sendProgress = (step, message, meta = {}) =>
    broadcast("AdditionalEvaluations:progress", { step, message, ...meta });

  // Clear a dir, but first make sure it exists so readdir never throws for missing path
  const clearDir = async (dir) => {
    await ensureDir(dir);
    try {
      const items = await fs.promises.readdir(dir, { withFileTypes: true });
      await Promise.all(items.map((it) =>
        fs.promises.rm(path.join(dir, it.name), { recursive: true, force: true })
      ));
    } catch (_) {}
  };

  // ===== CSV helpers (with totals row support) =====
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

  // =========================================================================================
  // WebsiteDownloads namespace
  // =========================================================================================
  ipcMain.handle("WebsiteDownloads:get-all", async () => {
    return await readJson(wdDbPath);
  });

  ipcMain.handle("WebsiteDownloads:add", async (_event, item) => {
    try {
      const name = (item?.name || "").trim();
      const n = Number(item?.downloads);
      if (!name) return { success: false, error: "name is required" };
      if (!Number.isFinite(n) || n < 0) return { success: false, error: "downloads must be a non-negative number" };

      const now = nowIso();
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
      db[i].updated_at = nowIso();

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

  // =========================================================================================
  // AdditionalEvaluations — SLO upload + SocialMedia upload
  // =========================================================================================
  const getPythonExe = () => {
    if (process.env.PYTHON_PATH && fs.existsSync(process.env.PYTHON_PATH)) return process.env.PYTHON_PATH;
    return process.platform === "win32" ? "py" : "python3";
  };

  const runPython = ({ scriptPath, args = [], onStdout, onStderr }) =>
    new Promise((resolve, reject) => {
      const exe = getPythonExe();
      let outBuf = "";
      let errBuf = "";
      const child = spawn(exe, [scriptPath, ...args], { shell: process.platform === "win32" });

      child.stdout.on("data", (d) => {
        const s = d.toString();
        outBuf += s;
        onStdout?.(s);
      });
      child.stderr.on("data", (d) => {
        const s = d.toString();
        errBuf += s;
        onStderr?.(s);
      });
      child.on("error", reject);
      child.on("close", (code) => {
        if (code === 0) resolve({ out: outBuf, err: errBuf });
        else reject(new Error(`python exited ${code}\nSTDERR:\n${errBuf}\nSTDOUT:\n${outBuf}`));
      });
    });

  ipcMain.handle("AdditionalEvaluations:upload", async (_evt, payload = {}) => {
    try {
      const documentType = (payload.documentType || "").trim();
      const filePath = payload.filePath;               // optional absolute path
      const originalName = payload.originalName || ""; // used when fileBytes provided
      const fileBytes = payload.fileBytes;             // optional Uint8Array/ArrayBuffer/array

      if (!documentType) return { success: false, error: "documentType is required" };

      // ---- helper to coerce bytes ----
      const resolveBuffer = (bytes) => {
        if (Buffer.isBuffer(bytes)) return bytes;
        if (bytes?.type === "Buffer" && Array.isArray(bytes.data)) return Buffer.from(bytes.data);
        if (bytes instanceof Uint8Array) return Buffer.from(bytes);
        if (ArrayBuffer.isView(bytes)) return Buffer.from(bytes.buffer);
        if (bytes instanceof ArrayBuffer) return Buffer.from(bytes);
        if (Array.isArray(bytes)) return Buffer.from(bytes);
        throw new Error("Unsupported fileBytes payload");
      };

      // ---- SLO path ----
      if (documentType === "SLOComparison") {
        sendProgress("prepare", "Preparing upload location…");
        await clearDir(uploadSolDir); // ensures dir exists & cleared

        let destPath = null;
        if (filePath && fs.existsSync(filePath)) {
          const ext = path.extname(filePath) || ".bin";
          destPath = path.join(uploadSolDir, `SLO_Current${ext}`);
          sendProgress("copy", "Copying file…");
          await fs.promises.copyFile(filePath, destPath);
        } else if (fileBytes && originalName) {
          const ext = path.extname(originalName) || ".bin";
          destPath = path.join(uploadSolDir, `SLO_Current${ext}`);
          sendProgress("write", "Writing uploaded file…");
          await fs.promises.writeFile(destPath, resolveBuffer(fileBytes));
        } else {
          return { success: false, error: "filePath is invalid and no fileBytes provided" };
        }

        sendProgress("process", "Running SLO processor…");
        const appRoot = app.isPackaged ? process.resourcesPath : app.getAppPath();
        const scriptPath = path.join(appRoot, "scripts", "slo_file_processor.py");

        const args = ["--input", destPath, "--outdir", dataDir];
        await runPython({
          scriptPath,
          args,
          onStdout: (s) => sendProgress("python", s.trim()),
          onStderr: (s) => sendProgress("python-stderr", s.trim())
        });

        const outJsonPath = path.join(dataDir, "analytics.json");
        if (!fs.existsSync(outJsonPath)) {
          return { success: false, error: "SLO processor did not produce analytics.json" };
        }

        const data = await readJson(outJsonPath, {});
        sendProgress("done", "Completed.", { uploaded: destPath, json: outJsonPath });

        return {
          success: true,
          documentType,
          uploadedPath: destPath,   // userData/UploadFile/SOL/SLO_Current.<ext>
          jsonPath: outJsonPath,    // userData/Documents/analytics.json
          data,
          meta: { updated_at: nowIso() }
        };
      }

      // ---- Social Media path ----
      if (documentType === "SocialMedia") {
        sendProgress("prepare", "Preparing Social Media upload…");
        // Make sure both dirs exist even if removed mid-session
        await ensureDir(uploadSmDir);
        await ensureDir(socialMediaDir);
        await clearDir(uploadSmDir); // leaves dir present, empties files

        let destPath = null;
        if (filePath && fs.existsSync(filePath)) {
          const ext = path.extname(filePath) || ".xlsx";
          destPath = path.join(uploadSmDir, `SocialMedia_Current${ext}`);
          sendProgress("copy", "Copying file…");
          await fs.promises.copyFile(filePath, destPath);
        } else if (fileBytes && originalName) {
          const ext = path.extname(originalName) || ".xlsx";
          destPath = path.join(uploadSmDir, `SocialMedia_Current${ext}`);
          sendProgress("write", "Writing uploaded file…");
          await fs.promises.writeFile(destPath, resolveBuffer(fileBytes));
        } else {
          return { success: false, error: "filePath is invalid and no fileBytes provided" };
        }

        // Run Python: parse ALL months on first upload; merge on subsequent uploads.
        sendProgress("process", "Processing Social Media workbook…");
        const appRoot   = app.isPackaged ? process.resourcesPath : app.getAppPath();
        const scriptPath = path.join(appRoot, "scripts", "social_media_store.py");
        const args = ["--input", destPath, "--outdir", socialMediaDir, "--platform", "all", "--mode", "merge"];
        await runPython({
          scriptPath,
          args,
          onStdout: s => sendProgress("python", s.trim()),
          onStderr: s => sendProgress("python-stderr", s.trim())
        });

        // Read all outputs if present
        const out = (name) => path.join(socialMediaDir, `${name}_all.json`);
        const fbData = fs.existsSync(out("facebook"))   ? JSON.parse(await fs.promises.readFile(out("facebook"),   "utf8")) : [];
        const igData = fs.existsSync(out("instagram"))  ? JSON.parse(await fs.promises.readFile(out("instagram"),  "utf8")) : [];
        const liData = fs.existsSync(out("linkedin"))   ? JSON.parse(await fs.promises.readFile(out("linkedin"),   "utf8")) : [];
        const nlData = fs.existsSync(out("newsletter")) ? JSON.parse(await fs.promises.readFile(out("newsletter"), "utf8")) : [];
        const pbData = fs.existsSync(out("podbean"))    ? JSON.parse(await fs.promises.readFile(out("podbean"),    "utf8")) : [];

        return {
          success: true,
          documentType,
          uploadedPath: destPath,
          outputs: {
            facebook: out("facebook"),
            instagram: out("instagram"),
            linkedin:  out("linkedin"),
            newsletter:out("newsletter"),
            podbean:   out("podbean"),
          },
          data: { facebook: fbData, instagram: igData, linkedin: liData, newsletter: nlData, podbean: pbData },
          meta: { updated_at: nowIso() }
        };
      }

      return { success: false, error: `Unsupported documentType: ${documentType}` };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ============================
  // Social Media READ APIs
  // ============================
  const PLATFORM_FILES = {
    facebook:   "facebook_all.json",
    instagram:  "instagram_all.json",
    linkedin:   "linkedin_all.json",
    newsletter: "newsletter_all.json",
    podbean:    "podbean_all.json",
  };

  const loadPlatformData = async (platform) => {
    const file = PLATFORM_FILES[platform];
    if (!file) return [];
    const p = path.join(socialMediaDir, file);
    try {
      const txt = await fs.promises.readFile(p, "utf8");
      return JSON.parse(txt); // array of normalized records
    } catch (_) {
      return [];
    }
  };

  const loadAllData = async () => {
    const entries = await Promise.all(
      Object.keys(PLATFORM_FILES).map(async (pl) => [pl, await loadPlatformData(pl)])
    );
    return Object.fromEntries(entries);
  };

  // Get distinct years/months/metrics for a platform (for checkbox filters)
  ipcMain.handle("SocialMedia:get-filters", async (_evt, { platform }) => {
    const rows = await loadPlatformData(platform);
    const years  = Array.from(new Set(rows.map(r => r.year))).sort((a,b)=>a-b);
    const months = Array.from(new Set(rows.map(r => r.month_num))).sort((a,b)=>a-b);
    const metrics = Array.from(new Set(rows.map(r => r.metric))).sort();
    return { success: true, platform, years, months, metrics };
  });

  // Get data with optional filters (platform required)
  ipcMain.handle("SocialMedia:get-data", async (_evt, { platform, metrics, years, months }) => {
    const rows = await loadPlatformData(platform);
    const mset = metrics && metrics.length ? new Set(metrics) : null;
    const yset = years && years.length ? new Set(years) : null;
    const moset = months && months.length ? new Set(months) : null;

    const filtered = rows.filter(r =>
      (!mset || mset.has(r.metric)) &&
      (!yset || yset.has(r.year)) &&
      (!moset || moset.has(r.month_num))
    );

    // Sort by (year, month_num, metric) for predictable charting
    filtered.sort((a,b) => (a.year - b.year) || (a.month_num - b.month_num) || String(a.metric).localeCompare(b.metric));
    return { success: true, platform, rows: filtered };
  });

  // Convenience: list platforms & metrics available across all files
  ipcMain.handle("SocialMedia:list-platforms", async () => {
    const data = await loadAllData();
    const platforms = Object.keys(data).filter(k => (data[k] || []).length);
    const metricsByPlatform = {};
    for (const pl of platforms) {
      metricsByPlatform[pl] = Array.from(new Set(data[pl].map(r => r.metric))).sort();
    }
    return { success: true, platforms, metricsByPlatform };
  });

  // Social Posts store (optional)
  const postsPath = path.join(socialMediaDir, "social_posts.json");

  ipcMain.handle("SocialPosts:get", async (_evt, filters = {}) => {
    try {
      const rows = fs.existsSync(postsPath)
        ? JSON.parse(await fs.promises.readFile(postsPath, "utf8"))
        : [];

      const { platforms, types, from, to } = filters;
      const inRange = (iso) => {
        if (!from && !to) return true;
        const t = new Date(iso).getTime();
        return (!from || t >= new Date(from).getTime()) &&
               (!to   || t <= new Date(to).getTime());
      };

      const out = rows.filter(r =>
        (!platforms || platforms.includes(r.platform)) &&
        (!types || types.includes(r.type)) &&
        inRange(r.posted_at)
      );

      return { success: true, rows: out };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // ============================
  // Analytics.json read + watch
  // ============================
  ipcMain.handle("Additional:read-analytics", async () => {
    try {
      const txt = await fs.promises.readFile(analyticsPath, "utf8");
      const json = JSON.parse(txt);
      return { success: true, data: json, path: analyticsPath };
    } catch (e) {
      return { success: false, error: e.message, path: analyticsPath };
    }
  });

  // Watch for social_media JSON changes too (optional)
  try {
    fs.watch(socialMediaDir, { persistent: false }, (_evt, filename) => {
      if (filename && filename.endsWith(".json")) {
        for (const win of BrowserWindow.getAllWindows()) {
          win.webContents.send("Additional:analytics-updated");
        }
      }
    });
  } catch {}

  // Existing watcher for analytics.json
  try {
    fs.watch(dataDir, { persistent: false }, (_eventType, filename) => {
      if (filename === "analytics.json") {
        for (const win of BrowserWindow.getAllWindows()) {
          win.webContents.send("Additional:analytics-updated");
        }
      }
    });
  } catch {}
};
