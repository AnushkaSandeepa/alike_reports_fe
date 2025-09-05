// electron/ipReportGenerate.cjs
const { app, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

module.exports = function () {
  const uploadsDir = path.join(app.getPath("userData"), "Documents");
  const reportsDbPath = path.join(uploadsDir, "confidence_data_db.json");
  const lastReportIdPath = path.join(uploadsDir, "last_report_id.json");

  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(reportsDbPath)) fs.writeFileSync(reportsDbPath, "[]", "utf-8");
  if (!fs.existsSync(lastReportIdPath)) fs.writeFileSync(lastReportIdPath, JSON.stringify({ lastId: 0 }), "utf-8");

  const getLastReportId = () => {
    try {
      const x = JSON.parse(fs.readFileSync(lastReportIdPath, "utf-8"));
      return x.lastId || 0;
    } catch { return 0; }
  };
  const saveLastReportId = (n) => fs.writeFileSync(lastReportIdPath, JSON.stringify({ lastId: n }), "utf-8");

  // Prefer py -3 on Windows, otherwise python/python3; never run with a shell.
  function getPythonCmdAndArgs(scriptPath, argv) {
    if (process.platform === "win32") {
      return [
        "py",
        ["-3", scriptPath, ...argv],
      ];
    }
    // macOS/Linux
    return [
      "python3",
      [scriptPath, ...argv],
    ];
  }

  ipcMain.handle("generate-report", async (_event, {
    spreadsheetId,
    spreadsheetPath,
    programType,
    evaluationStartDate,
    evaluationEndDate,
  }) => {
    return new Promise((resolve) => {
      const scriptPath = programType !== "networking_events"
        ? path.join(__dirname, "..", "scripts", "report_generator_workshop.py")
        : path.join(__dirname, "..", "scripts", "report_generator_networking.py");

      // Prepare a candidate reportId, but do NOT persist until Python succeeds.
      const nextNum = getLastReportId() + 1;
      const reportId = `R${String(nextNum).padStart(4, "0")}`;

      // REQUIRED positional order for your script:
      // spreadsheet_path spreadsheet_id program_type report_id
      const positional = [
        spreadsheetPath,
        spreadsheetId,
        programType,
        reportId,
      ];

      // Optional date-range flags
      if (evaluationStartDate && evaluationEndDate) {
        positional.push("--evaluationStart", evaluationStartDate, "--evaluationEnd", evaluationEndDate);
      }

      const [cmd, args] = getPythonCmdAndArgs(scriptPath, positional);

      const child = spawn(cmd, args, {
        cwd: __dirname,
        windowsHide: true,
        shell: false, // IMPORTANT
      });

      let outBuf = "";
      let errBuf = "";

      child.stdout.on("data", (d) => (outBuf += d.toString()));
      child.stderr.on("data", (d) => (errBuf += d.toString()));

      child.on("error", (err) => {
        // If 'py' is not found on Windows, retry with 'python'
        if (process.platform === "win32" && cmd === "py") {
          const fallbackChild = spawn("python", [scriptPath, ...positional], {
            cwd: __dirname,
            windowsHide: true,
            shell: false,
          });
          let fOut = "", fErr = "";
          fallbackChild.stdout.on("data", (d) => (fOut += d.toString()));
          fallbackChild.stderr.on("data", (d) => (fErr += d.toString()));
          fallbackChild.on("close", (code) => {
            handleClose(code, fOut, fErr);
          });
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
          // Parse the last JSON-looking line
          const lines = stdout.split(/\r?\n/).map((l) => l.trim()).filter(Boolean);
          if (!lines.length) throw new Error("No output from Python");
          let parsed = null;
          for (let i = lines.length - 1; i >= 0; i--) {
            const line = lines[i];
            if ((line.startsWith("{") && line.endsWith("}")) || (line.startsWith("[") && line.endsWith("]"))) {
              try { parsed = JSON.parse(line); break; } catch {}
            }
          }
          if (!parsed) parsed = JSON.parse(lines[lines.length - 1]);

          // If Python explicitly signals failure (e.g., empty range)
          if (parsed && parsed.success === false) {
            return resolve({ success: false, error: parsed.error || "Report generation failed." });
          }

          if (parsed && !parsed.reportId) parsed.reportId = reportId;

          parsed.reportStatus = parsed.reportStatus || "Active"; 
          // Only now persist the incremented id
          saveLastReportId(nextNum);

          // Save to DB
          const db = JSON.parse(fs.readFileSync(reportsDbPath, "utf-8") || "[]");
          db.push(parsed);
          fs.writeFileSync(reportsDbPath, JSON.stringify(db, null, 2), "utf-8");

          resolve({ success: true, data: parsed, reportId: parsed.reportId });
        } catch (e) {
          resolve({ success: false, error: "JSON parse error: " + e.message });
        }
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

  ipcMain.handle("update-report-status", async (_event, { reportId, status }) => {
    try {
      if (!reportId) throw new Error("reportId is required");
      if (!["Active", "Inactive"].includes(status)) {
        throw new Error("status must be 'Active' or 'Inactive'");
      }

      const raw = await fs.promises.readFile(reportsDbPath, "utf-8");
      const db = JSON.parse(raw || "[]");

      const idx = db.findIndex((r) => r.reportId === reportId);
      if (idx === -1) {
        return { success: false, error: `Report ${reportId} not found` };
      }

      db[idx].reportStatus = status;
      // optional: audit trail
      db[idx].statusUpdatedOn = new Date().toISOString();

      const tmp = reportsDbPath + ".tmp";
      await fs.promises.writeFile(tmp, JSON.stringify(db, null, 2), "utf-8");
      await fs.promises.rename(tmp, reportsDbPath);

      return { success: true, data: { reportId, reportStatus: status } };
    } catch (e) {
      return { success: false, error: e.message };
    }
  });
};
