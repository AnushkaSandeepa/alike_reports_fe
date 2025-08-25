const { app, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

module.exports = function () {
  const uploadsDir = path.join(app.getPath("userData"), "Documents");
  const reportsDbPath = path.join(uploadsDir, "confidence_data_db.json");
  const lastReportIdPath = path.join(uploadsDir, "last_report_id.json");

  if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
  if (!fs.existsSync(reportsDbPath)) fs.writeFileSync(reportsDbPath, JSON.stringify([]));
  if (!fs.existsSync(lastReportIdPath)) fs.writeFileSync(lastReportIdPath, JSON.stringify({ lastId: 0 }));

  function getLastReportId() {
    try {
      const lastIdData = JSON.parse(fs.readFileSync(lastReportIdPath, "utf-8"));
      return lastIdData.lastId || 0;
    } catch {
      return 0;
    }
  }

  function saveLastReportId(num) {
    fs.writeFileSync(lastReportIdPath, JSON.stringify({ lastId: num }), "utf-8");
  }

  ipcMain.handle("generate-report", async (event, { spreadsheetId, spreadsheetPath, programType }) => {
    return new Promise(resolve => {
      const pythonPath = process.platform === "win32" ? "python" : "python3";
      const scriptPath = programType !== "networking_events"
        ? path.join(__dirname, "..", "scripts", "report_generator_workshop.py")
        : path.join(__dirname, "..", "scripts", "report_generator_networking.py");

      const lastId = getLastReportId();
      const reportNumber = lastId + 1;
      const reportId = `R${reportNumber.toString().padStart(4, "0")}`;
      saveLastReportId(reportNumber);

      const py = spawn(pythonPath, [scriptPath, spreadsheetPath, spreadsheetId, programType, reportId], { cwd: __dirname });

      let dataString = "", errorString = "";

      py.stdout.on("data", (data) => dataString += data.toString());
      py.stderr.on("data", (data) => errorString += data.toString());

      py.on("close", (code) => {
        if (code !== 0) return resolve({ success: false, error: errorString || `Python exited ${code}` });

        try {
          const cleanDataString = dataString.split("\n").filter(line => line.trim()).pop();
          const resultJson = JSON.parse(cleanDataString);

          const db = JSON.parse(fs.readFileSync(reportsDbPath, "utf-8")) || [];
          db.push(resultJson);
          fs.writeFileSync(reportsDbPath, JSON.stringify(db, null, 2), "utf-8");

          resolve({ success: true, data: resultJson, reportId });
        } catch (err) {
          resolve({ success: false, error: "JSON parse error: " + err.message });
        }
      });
    });
  });

  ipcMain.handle("get-reports", async () => {
    try {
      const rawData = await fs.promises.readFile(reportsDbPath, "utf8");
      return JSON.parse(rawData);
    } catch {
      return [];
    }
  });
};
