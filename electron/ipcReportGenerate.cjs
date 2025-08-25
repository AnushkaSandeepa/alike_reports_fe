const { app, BrowserWindow, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const { spawn } = require("child_process");

module.exports = function (ipcMain) {

    const uploadsDir = path.join(app.getPath("userData"), "Documents");
  const reportsDbPath = path.join(uploadsDir, "confidence_data_db.json");
  // Ensure folder exists
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
      console.log("Generating report with:", { programType });
      let scriptPath; // declare outside if/else
      if (programType !== "networking_events") {
        scriptPath = path.join(__dirname, "..", "scripts", "report_generator_workshop.py");
      } else {
        scriptPath = path.join(__dirname, "..", "scripts", "report_generator_networking.py");
      }

      const py = spawn(pythonPath, [scriptPath, spreadsheetPath, spreadsheetId, programType], {
        cwd: __dirname,
        shell: false
      });

      let dataString = "";
      let errorString = "";

      py.stdout.on("data", (data) => {
        dataString += data.toString();
      });

      py.stderr.on("data", (data) => {
        errorString += data.toString();
      });

      py.on("close", (code) => {
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

  

  // Make sure folder exists
  if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
  }

  // Make sure DB file exists
  if (!fs.existsSync(reportsDbPath)) {
    fs.writeFileSync(reportsDbPath, JSON.stringify([]), "utf-8");
  }

  // 📂 Get list of reports
  ipcMain.handle("get-reports", async () => {
    try {
      const rawData = await fs.promises.readFile(reportsDbPath, "utf8");
      return JSON.parse(rawData);
      console.log("📂 Read reports list:", rawData) ;
    } catch (err) {
      console.error("❌ Error reading reports list:", err);
      return [];
    }
  });
};
