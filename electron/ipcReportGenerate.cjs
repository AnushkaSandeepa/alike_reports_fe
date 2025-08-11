const path = require("path");
const fs = require("fs");
const { spawn } = require("child_process");
const { app } = require("electron");

module.exports = function (ipcMain) {
  const uploadsDir = path.join(app.getPath("documents"), "MyReports");
  const reportsDbPath = path.join(uploadsDir, "reports_db.json");

  // Ensure uploads folder exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Ensure DB file exists
  if (!fs.existsSync(reportsDbPath)) {
    fs.writeFileSync(reportsDbPath, JSON.stringify([]));
  }

  ipcMain.handle("generate-report", async (event, { spreadsheetId, spreadsheetPath, programType }) => {
    return new Promise((resolve, reject) => {
      const pythonPath = process.platform === "win32" ? "python" : "python3";
      const scriptPath = path.join(__dirname, "..", "scripts", "report_generator.py");

      console.log("🔍 Running Python script:", scriptPath);
      console.log("📂 Spreadsheet path:", spreadsheetPath);
      console.log("🆔 Spreadsheet ID:", spreadsheetId);
      console.log("📌 Program type:", programType);

      // Pass spreadsheet path, spreadsheetId, and programType to Python
      const py = spawn(pythonPath, [scriptPath, spreadsheetPath, spreadsheetId, programType], {
        cwd: __dirname,
        shell: false
      });

      let dataString = "";
      let errorString = "";

      py.stdout.on("data", (data) => {
        const text = data.toString();
        console.log(`🐍 Python stdout: ${text}`);
        dataString += text;
      });

      py.stderr.on("data", (data) => {
        const text = data.toString();
        console.error(`🐍 Python stderr: ${text}`);
        errorString += text;
      });

      py.on("error", (err) => {
        console.error("❌ Failed to start Python process:", err);
        reject(err);
      });

      py.on("close", (code) => {
        console.log(`🐍 Python process exited with code ${code}`);

        if (code !== 0) {
          return reject(new Error(errorString || `Python exited with code ${code}`));
        }

        try {
          const resultJson = JSON.parse(dataString);
          const db = JSON.parse(fs.readFileSync(reportsDbPath, "utf-8"));

          db.push({
            spreadsheetId,
            spreadsheetName: path.basename(spreadsheetPath),
            programType,
            generatedData: resultJson,
            generatedAt: new Date().toISOString()
          });

          fs.writeFileSync(reportsDbPath, JSON.stringify(db, null, 2), "utf-8");
          resolve({ success: true, data: resultJson });

        } catch (err) {
          reject(err);
        }
      });
    }).catch(err => ({
      success: false,
      error: err.message
    }));
  });
};
