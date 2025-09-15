// electron/ipcReportGenerate.cjs
const { app, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

module.exports = function () {
  // Where reports DB & IDs live
  const dataDir = path.join(app.getPath("userData"), "Documents");
  const reportsDbPath = path.join(dataDir, "confidence_data_db.json");
  const lastReportIdPath = path.join(dataDir, "last_report_id.json");

  // Where Python scripts live (dev vs packaged)
  const scriptsRoot = app.isPackaged
    ? path.join(process.resourcesPath, "scripts")
    : path.join(__dirname, "..", "scripts");

  // Ensure folders/files
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(reportsDbPath)) fs.writeFileSync(reportsDbPath, "[]", "utf-8");
  if (!fs.existsSync(lastReportIdPath)) fs.writeFileSync(lastReportIdPath, JSON.stringify({ lastId: 0 }), "utf-8");

  const getLastReportId = () => {
    try { return JSON.parse(fs.readFileSync(lastReportIdPath, "utf-8")).lastId || 0; }
    catch { return 0; }
  };
  const saveLastReportId = (n) => fs.writeFileSync(lastReportIdPath, JSON.stringify({ lastId: n }), "utf-8");

  const asYMD = (v) => (v ? String(v).slice(0, 10) : "");

  function getPythonCmdAndArgs(scriptPath, argv) {
    if (process.platform === "win32") return ["py", ["-3", scriptPath, ...argv]];
    return ["python3", [scriptPath, ...argv]];
  }

  ipcMain.handle("generate-report", async (_event, {
    spreadsheetId,
    spreadsheetPath,
    programType,
    evaluationStartDate,
    evaluationEndDate,
  }) => {
    return new Promise((resolve) => {
      try {
        // Pick script by program type
        const scriptName = programType !== "networking_events"
          ? "report_generator_workshop.py"
          : "report_generator_networking.py";
        const scriptPath = path.join(scriptsRoot, scriptName);

        if (!fs.existsSync(scriptPath)) {
          return resolve({
            success: false,
            error: `Python script not found at ${scriptPath}. Ensure electron-builder.yml 'extraResources' includes scripts/**`,
          });
        }

        // Block duplicates (same spreadsheet + exact same date range)
        let existingDb = [];
        try { existingDb = JSON.parse(fs.readFileSync(reportsDbPath, "utf-8") || "[]"); } catch {}
        const wantStart = asYMD(evaluationStartDate);
        const wantEnd   = asYMD(evaluationEndDate);

        if (wantStart && wantEnd) {
          const isSameRange = (rec) => {
            if (!rec || rec.spreadsheet_id !== spreadsheetId) return false;
            const rStart = asYMD(rec.evaluation_start || rec.evaluationStart);
            const rEnd   = asYMD(rec.evaluation_end   || rec.evaluationEnd);
            return rStart === wantStart && rEnd === wantEnd;
          };
          if (existingDb.some(isSameRange)) {
            return resolve({
              success: false,
              error: "You have already generated a report for this spreadsheet with the same date range. Delete the existing report or choose a different date range.",
            });
          }
        }

        // Prepare report id (only persist after success)
        const nextNum = getLastReportId() + 1;
        const reportId = `R${String(nextNum).padStart(4, "0")}`;

        // Script args (positional first, then flags)
        const positional = [spreadsheetPath, spreadsheetId, programType, reportId];
        if (evaluationStartDate && evaluationEndDate) {
          positional.push("--evaluationStart", evaluationStartDate, "--evaluationEnd", evaluationEndDate);
        }

        const [cmd, args] = getPythonCmdAndArgs(scriptPath, positional);

        const child = spawn(cmd, args, {
          cwd: scriptsRoot,
          windowsHide: true,
          shell: false,
        });

        let outBuf = "";
        let errBuf = "";

        child.stdout.on("data", (d) => (outBuf += d.toString()));
        child.stderr.on("data", (d) => (errBuf += d.toString()));

        child.on("error", (err) => {
          // Windows fallback if 'py' launcher missing
          if (process.platform === "win32" && cmd === "py") {
            const fb = spawn("python", [scriptPath, ...positional], {
              cwd: scriptsRoot,
              windowsHide: true,
              shell: false,
            });
            let fOut = "", fErr = "";
            fb.stdout.on("data", (d) => (fOut += d.toString()));
            fb.stderr.on("data", (d) => (fErr += d.toString()));
            fb.on("close", (code) => handleClose(code, fOut, fErr));
          } else {
            resolve({ success: false, error: err.message || "Failed to start Python" });
          }
        });

        child.on("close", (code) => handleClose(code, outBuf, errBuf));

        function handleClose(code, stdout, stderr) {
          if (code !== 0) {
            return resolve({ success: false, error: (stderr || `Python exited ${code}`).trim() });
          }

          try {
            // Parse the last JSON-looking line from Python
            const lines = stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
            if (!lines.length) throw new Error("No output from Python");
            let parsed = null;
            for (let i = lines.length - 1; i >= 0; i--) {
              const line = lines[i];
              const looksJson = (line.startsWith("{") && line.endsWith("}")) || (line.startsWith("[") && line.endsWith("]"));
              if (looksJson) { try { parsed = JSON.parse(line); break; } catch {} }
            }
            if (!parsed) parsed = JSON.parse(lines[lines.length - 1]);

            // Python may signal a logical failure (e.g., empty range)
            if (parsed && parsed.success === false) {
              return resolve({ success: false, error: parsed.error || "Report generation failed." });
            }

            // Normalize & persist
            if (parsed && !parsed.reportId) parsed.reportId = reportId;
            parsed.reportStatus = parsed.reportStatus || "Active";

            saveLastReportId(nextNum);

            const db = Array.isArray(existingDb) ? existingDb : [];
            db.push(parsed);
            fs.writeFileSync(reportsDbPath, JSON.stringify(db, null, 2), "utf-8");

            resolve({ success: true, data: parsed, reportId: parsed.reportId });
          } catch (e) {
            resolve({ success: false, error: "JSON parse error: " + e.message });
          }
        }
      } catch (e) {
        resolve({ success: false, error: e.message || "Unexpected error in generate-report" });
      }
    });
  });

  ipcMain.handle("get-reports", async () => {
    try {
      const raw = await fs.promises.readFile(reportsDbPath, "utf-8");
      return JSON.parse(raw || "[]");
    } catch {
      return [];
    }
  });

  ipcMain.handle("delete-report", async (_event, reportId) => {
    try {
      const raw = await fs.promises.readFile(reportsDbPath, "utf-8");
      const db = JSON.parse(raw || "[]");
      const exists = db.some((r) => r.reportId === reportId);
      if (!exists) return { success: false, error: `Report ${reportId} not found` };

      const remaining = db.filter((r) => r.reportId !== reportId);
      const tmp = reportsDbPath + ".tmp";
      await fs.promises.writeFile(tmp, JSON.stringify(remaining, null, 2), "utf-8");
      await fs.promises.rename(tmp, reportsDbPath);

      return { success: true, remaining };
    } catch (err) {
      return { success: false, error: err.message };
    }
  });

  ipcMain.handle("update-report-status", async (event, { reportId, status }) => {
    try {
      if (!reportId) throw new Error("reportId is required");
      if (!["Active", "Inactive"].includes(status)) throw new Error("status must be 'Active' or 'Inactive'");

      const raw = await fs.promises.readFile(reportsDbPath, "utf-8");
      const db = JSON.parse(raw || "[]");
      const idx = db.findIndex((r) => r.reportId === reportId);
      if (idx === -1) return { success: false, error: `Report ${reportId} not found` };

      db[idx].reportStatus = status;
      db[idx].statusUpdatedOn = new Date().toISOString();

      const tmp = reportsDbPath + ".tmp";
      await fs.promises.writeFile(tmp, JSON.stringify(db, null, 2), "utf-8");
      await fs.promises.rename(tmp, reportsDbPath);

      try { event.sender.send("report-updated", { reportId, reportStatus: status }); } catch {}
      return { success: true, data: { reportId, reportStatus: status } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
};
