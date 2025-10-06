// electron/ipcPeriodReports.cjs
const { app, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

module.exports = function () {
  const dataDir = path.join(app.getPath("userData"), "Documents");
  const periodDbPath = path.join(dataDir, "period_reports_db.json");
  const confidenceDbPath = path.join(dataDir, "confidence_data_db.json");
  const contributionDbPath = path.join(dataDir, "periodreport_contribution.json");

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(periodDbPath)) fs.writeFileSync(periodDbPath, "[]", "utf8");
  if (!fs.existsSync(contributionDbPath)) fs.writeFileSync(contributionDbPath, "[]", "utf8");

  const readDb = async (p) => {
    try {
      const raw = await fs.promises.readFile(p, "utf8");
      return JSON.parse(raw || "[]");
    } catch {
      return [];
    }
  };

  const writeDbAtomic = async (p, db) => {
    const tmp = p + ".tmp";
    await fs.promises.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.promises.rename(tmp, p);
  };

  const scriptsRoot = app.isPackaged
    ? path.join(process.resourcesPath, "scripts")
    : path.join(__dirname, "..", "scripts");

  const getPythonCmd = () => {
    if (process.platform === "win32") return { cmd: "py", args: ["-3"] };
    return { cmd: "python3", args: [] };
  };

  const makePeriodId = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `P${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${Math.random().toString(36).slice(2, 7).toUpperCase()}`;
  };

  const resolveScript = () => path.join(scriptsRoot, "report_generator_period.py");

  // ---------- filename enrichment helpers ----------
  const preferFileKeys = [
    "file_name",
    "filename",
    "spreadsheet_name",
    "upload_name",
    "source_file",
    "source_filename",
    "source_path",
    "file_path",
    "filePath",
    "path",
  ];

  const extractFileName = (row) => {
    if (!row || typeof row !== "object") return "";
    for (const k of preferFileKeys) {
      if (row[k]) {
        try {
          const v = String(row[k]);
          if (v.includes("/") || v.includes("\\")) return path.basename(v);
          return v;
        } catch {}
      }
    }
    return "";
  };

  // --- Generate period report (and save contributions sidecar) ---
  ipcMain.handle("report_generator_period", async (event, { start, end, fundingBody }) => {
    if (!start || !end) return { success: false, error: "Start and end are required (YYYY-MM-DD)" };
    const scriptPath = resolveScript();
    if (!fs.existsSync(scriptPath)) return { success: false, error: `Script not found: ${scriptPath}` };
    if (!fs.existsSync(confidenceDbPath)) return { success: false, error: "confidence_data_db.json not found" };

    const { cmd, args } = getPythonCmd();

    // Prefilter the confidence DB by fundingBody (if provided)
    let dbPathToUse = confidenceDbPath;
    let tmpPath = null;
    try {
      if (typeof fundingBody === "string" && fundingBody.trim() !== "") {
        const all = await readDb(confidenceDbPath);
        const fb = fundingBody.trim().toLowerCase();
        const filtered = all.filter((r) => String(r.fundingBody || "").toLowerCase() === fb);
        tmpPath = path.join(dataDir, `confidence_data_fb_${fb}_${Date.now()}.json`);
        await fs.promises.writeFile(tmpPath, JSON.stringify(filtered, null, 2), "utf8");
        dbPathToUse = tmpPath;
      }
    } catch (e) {
      return { success: false, error: `Failed to prefilter by funding body: ${e.message}` };
    }

    const childArgs = [...args, scriptPath, start, end, dbPathToUse];
    const periodReportId = makePeriodId();

    try {
      event.sender.send("period-progress", { id: periodReportId, stage: "starting", percent: 5 });
    } catch {}

    return new Promise((resolve) => {
      const spawnOpts = {
        cwd: scriptsRoot,
        windowsHide: true,
        shell: false,
        detached: process.platform !== "win32",
        env: {                       // <--- add this block
          ...process.env,
          PYTHONIOENCODING: "utf-8",
          PYTHONUTF8: "1",
        },
      };


      let outBuf = "", errBuf = "";
      const TIMEOUT_MS = 2 * 60 * 1000;

      const killChildTree = (child) => {
        try {
          if (process.platform !== "win32") process.kill(-child.pid, "SIGTERM");
          else child.kill("SIGTERM");
        } catch {}
      };

      const cleanupTmp = async () => {
        if (tmpPath) {
          try { await fs.promises.unlink(tmpPath); } catch {}
        }
      };

      const handleClose = async (code, stdout, stderr) => {
        clearTimeout(to);
        await cleanupTmp();

        if (code !== 0) {
          return resolve({ success: false, error: (stderr || `Python exited ${code}`).trim() });
        }

        // parse primary result
        let parsed;
        try {
          const m = stdout.match(/===RESULT===\s*([\s\S]*?)\s*===END===/);
          if (!m) throw new Error("No JSON block found");
          parsed = JSON.parse(m[1].trim());
        } catch (e) {
          return resolve({ success: false, error: `JSON parse error: ${e.message}` });
        }

        // parse contributions (optional)
        let contrib = null;
        try {
          const mc = stdout.match(/===CONTRIBUTIONS===\s*([\s\S]*?)\s*===END===/);
          if (mc) contrib = JSON.parse(mc[1].trim());
        } catch {}

        try {
          // augment parsed with id + filters and save to period DB
          parsed.periodReportId = periodReportId;
          parsed.filters = { ...(parsed.filters || {}), fundingBody: fundingBody || "" };

          const db = await readDb(periodDbPath);
          db.push(parsed);
          await writeDbAtomic(periodDbPath, db);

          // save contributions sidecar (with filename enrichment)
          if (contrib && Array.isArray(contrib.items)) {
            // Load full (unfiltered) DB to maximize filename lookup chance
            let fullDb = [];
            try { fullDb = await readDb(confidenceDbPath); } catch {}

            const byId = new Map();
            for (const r of fullDb) {
              const rid = r?.reportId;
              if (rid) byId.set(rid, r);
            }

            const enrichedItems = contrib.items.map((it) => {
              const src = it?.reportId ? byId.get(it.reportId) : null;
              const fname = extractFileName(src) || extractFileName(it) || "";
              return { ...it, file_name: fname };
            });

            const side = await readDb(contributionDbPath);
            side.push({
              periodReportId,
              start_date: parsed.start_date,
              end_date: parsed.end_date,
              generated_date: parsed.generated_date,
              filters: { fundingBody: fundingBody || "" },
              contributions: enrichedItems,
            });
            await writeDbAtomic(contributionDbPath, side);
          }

          try {
            event.sender.send("period-updated", { id: periodReportId });
            event.sender.send("period-progress", { id: periodReportId, stage: "finished", percent: 100 });
          } catch {}

          resolve({ success: true, data: parsed, periodReportId });
        } catch (e) {
          resolve({ success: false, error: `DB write failed: ${e.message}` });
        }
      };

      const to = setTimeout(async () => {
        killChildTree(child);
        await cleanupTmp();
        resolve({ success: false, error: "Period report timed out" });
      }, TIMEOUT_MS);

      let child = spawn(cmd, childArgs, spawnOpts);
      child.stdout.on("data", (d) => { outBuf += d.toString(); });
      child.stderr.on("data", (d) => { errBuf += d.toString(); });

      child.on("error", (err) => {
        if (process.platform === "win32" && cmd === "py") {
          outBuf = ""; errBuf = "";
          const fallback = spawn("python", [scriptPath, start, end, dbPathToUse], spawnOpts);
          fallback.stdout.on("data", (d) => { outBuf += d.toString(); });
          fallback.stderr.on("data", (d) => { errBuf += d.toString(); });
          fallback.on("close", (code) => handleClose(code, outBuf, errBuf));
        } else {
          clearTimeout(to);
          cleanupTmp().finally(() => {
            resolve({ success: false, error: err.message || "Failed to start Python" });
          });
        }
      });

      child.on("close", (code) => handleClose(code, outBuf, errBuf));
    });
  });

  // --- List saved period reports ---
  ipcMain.handle("get-period-reports", async () => {
    try { return await readDb(periodDbPath); } catch { return []; }
  });

  // --- Delete a period report (and its sidecar) ---
  ipcMain.handle("delete-period-report", async (_event, periodReportId) => {
    try {
      const db = await readDb(periodDbPath);
      const exists = db.some((r) => r.periodReportId === periodReportId);
      if (!exists) return { success: false, error: `Period report ${periodReportId} not found` };

      const remaining = db.filter((r) => r.periodReportId !== periodReportId);
      await writeDbAtomic(periodDbPath, remaining);

      try {
        const side = await readDb(contributionDbPath);
        const sideRemain = side.filter((x) => x.periodReportId !== periodReportId);
        await writeDbAtomic(contributionDbPath, sideRemain);
      } catch {}

      return { success: true, data: { remainingCount: remaining.length } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });

  // --- Contributions APIs (safe) ---
  ipcMain.handle("get-period-contributions", async () => {
    try {
      const all = await readDb(contributionDbPath);
      return { success: true, data: all };
    } catch (e) {
      return { success: false, error: e.message || "Failed to read contributions DB" };
    }
  });

  ipcMain.handle("get-period-contribution-by-id", async (_evt, periodReportId) => {
    try {
      if (!periodReportId) return { success: false, error: "Missing periodReportId" };
      const all = await readDb(contributionDbPath);
      const one = all.find((x) => x.periodReportId === periodReportId) || null;
      if (!one) return { success: false, error: `No contribution entry for ${periodReportId}` };
      return { success: true, data: one };
    } catch (e) {
      return { success: false, error: e.message || "Failed to load contribution" };
    }
  });
};
