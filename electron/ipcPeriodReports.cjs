// electron/ipcPeriodReports.cjs
const { app, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

module.exports = function () {
  const dataDir = path.join(app.getPath("userData"), "Documents");
  const periodDbPath = path.join(dataDir, "period_reports_db.json");
  const confidenceDbPath = path.join(dataDir, "confidence_data_db.json");

  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(periodDbPath)) fs.writeFileSync(periodDbPath, "[]", "utf8");

  const readDb = async (p) => {
    try { return JSON.parse(await fs.promises.readFile(p, "utf8") || "[]"); }
    catch { return []; }
  };
  const writeDbAtomic = async (p, db) => {
    const tmp = p + ".tmp";
    await fs.promises.writeFile(tmp, JSON.stringify(db, null, 2), "utf8");
    await fs.promises.rename(tmp, p);
  };

  const getPythonCmd = () => {
    if (process.platform === "win32") return { cmd: "py", args: ["-3"] };
    return { cmd: "python3", args: [] };
  };

  const makePeriodId = () => {
    const d = new Date();
    const pad = (n) => String(n).padStart(2, "0");
    return `P${d.getFullYear()}${pad(d.getMonth()+1)}${pad(d.getDate())}-${pad(d.getHours())}${pad(d.getMinutes())}${pad(d.getSeconds())}-${Math.random().toString(36).slice(2,7).toUpperCase()}`;
  };

  const resolveScript = () => {
    const base = app.isPackaged ? process.resourcesPath : path.join(__dirname, "..");
    return path.join(base, "scripts", "report_generator_period.py");
  };

  // --- Generate a period report (aggregated annual/period output) ---
  ipcMain.handle("report_generator_period", async (event, { start, end }) => {
    if (!start || !end) return { success: false, error: "Start and end are required (YYYY-MM-DD)" };
    if (!fs.existsSync(confidenceDbPath)) return { success: false, error: "confidence_data_db.json not found" };

    const scriptPath = resolveScript();
    if (!fs.existsSync(scriptPath)) return { success: false, error: `Script not found: ${scriptPath}` };

    const { cmd, args } = getPythonCmd();
    const childArgs = [...args, scriptPath, start, end, confidenceDbPath];
    const periodReportId = makePeriodId();

    try { event.sender.send("period-progress", { id: periodReportId, stage: "starting", percent: 5 }); } catch {}

    return new Promise((resolve) => {
      const child = spawn(cmd, childArgs, {
        cwd: app.isPackaged ? process.resourcesPath : path.join(__dirname, ".."),
        shell: process.platform === "win32",
        windowsHide: true,
        detached: process.platform !== "win32",
      });

      let outBuf = "", errBuf = "";
      const TIMEOUT_MS = 2 * 60 * 1000;
      const to = setTimeout(() => {
        try { process.platform !== "win32" ? process.kill(-child.pid, "SIGTERM") : child.kill("SIGTERM"); } catch {}
        resolve({ success: false, error: "Period report timed out" });
      }, TIMEOUT_MS);

      child.stdout.on("data", (d) => { outBuf += d.toString(); });
      child.stderr.on("data", (d) => { errBuf += d.toString(); });

      child.on("close", async (code) => {
        clearTimeout(to);
        if (code !== 0) return resolve({ success: false, error: errBuf.trim() || `Python exited ${code}` });

        // parse delimited JSON
        let parsed;
        try {
          const m = outBuf.match(/===RESULT===\s*([\s\S]*?)\s*===END===/);
          if (!m) throw new Error("No JSON block found");
          parsed = JSON.parse(m[1].trim());
        } catch (e) {
          return resolve({ success: false, error: `JSON parse error: ${e.message}` });
        }

        // persist with a stable id
        try {
          parsed.periodReportId = periodReportId;
          const db = await readDb(periodDbPath);
          db.push(parsed);
          await writeDbAtomic(periodDbPath, db);
          try {
            event.sender.send("period-updated", { id: periodReportId });
            event.sender.send("period-progress", { id: periodReportId, stage: "finished", percent: 100 });
          } catch {}
          resolve({ success: true, data: parsed, periodReportId });
        } catch (e) {
          resolve({ success: false, error: `DB write failed: ${e.message}` });
        }
      });
    });
  });

  // --- List saved period reports ---
  ipcMain.handle("get-period-reports", async () => {
    try { return await readDb(periodDbPath); } catch { return []; }
  });

  // --- Delete a saved period report ---
  ipcMain.handle("delete-period-report", async (event, periodReportId) => {
    try {
      const db = await readDb(periodDbPath);
      const exists = db.some(r => r.periodReportId === periodReportId);
      if (!exists) return { success: false, error: `Period report ${periodReportId} not found` };
      const remaining = db.filter(r => r.periodReportId !== periodReportId);
      await writeDbAtomic(periodDbPath, remaining);
      try { event.sender.send("period-updated", { id: periodReportId, deleted: true }); } catch {}
      return { success: true, data: { remainingCount: remaining.length } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
};
