// ipcReportGenerate.cjs
const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { app } = require("electron");

module.exports = function (ipcMain) {
  const uploadsDir = path.join(app.getPath("userData"), "Documents");
  const reportsDbPath = path.join(uploadsDir, "reports_db.json");

  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }
  if (!fs.existsSync(reportsDbPath)) {
    fs.writeFileSync(reportsDbPath, JSON.stringify([]));
  }

  ipcMain.handle("generate-report", async (event, { spreadsheetId, spreadsheetPath, programType }) => {
    return new Promise((resolve, reject) => {
      const py = spawn("python", [
        path.join(__dirname, "report_generator.py"),
        spreadsheetPath
      ]);

      let dataString = "";
      let errorString = "";

      py.stdout.on("data", (data) => (dataString += data.toString()));
      py.stderr.on("data", (data) => (errorString += data.toString()));

      py.on("close", (code) => {
        if (code !== 0) return reject(new Error(errorString));
        try {
          const resultJson = JSON.parse(dataString);
          const db = JSON.parse(fs.readFileSync(reportsDbPath));
          db.push({
            spreadsheetId,
            spreadsheetName: path.basename(spreadsheetPath),
            programType,
            generatedData: resultJson,
          });
          fs.writeFileSync(reportsDbPath, JSON.stringify(db, null, 2));
          resolve({ success: true, data: resultJson });
        } catch (err) {
          reject(err);
        }
      });
    }).catch(err => ({ success: false, error: err.message }));
  });
};
