// electron/ensureSeeds.cjs
const { app } = require("electron");
const fs = require("fs");
const path = require("path");

module.exports = function ensureSeeds() {
  // Your IPC module uses: <userData>/Documents/website_downloads_db.json
  const dataDir = path.join(app.getPath("userData"), "Documents");
  const destPath = path.join(dataDir, "website_downloads_db.json");

  // Where the packaged seed lives
  const seedsRoot = app.isPackaged
    ? path.join(process.resourcesPath, "seeds")
    : path.join(__dirname, "..", "seeds");
  const seedPath = path.join(seedsRoot, "website_downloads_db.json");

  fs.mkdirSync(dataDir, { recursive: true });

  // Only copy if it doesn't exist yet
  if (!fs.existsSync(destPath)) {
    if (fs.existsSync(seedPath)) {
      fs.copyFileSync(seedPath, destPath);
      console.log("[seeds] Copied website_downloads_db.json to", destPath);
    } else {
      // Fallback to empty if the seed is missing in dev
      fs.writeFileSync(destPath, "[]", "utf8");
      console.warn("[seeds] Seed missing; wrote empty website_downloads_db.json");
    }
  }
};
