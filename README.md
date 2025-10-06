# 🧩 Alike Reports Application  
### _Automated Evaluation & Analytics Platform for Alike WA_

**Version:** 2.1.0  **Last Updated:** October 2025  
**Developer:** Anushka Sandeepa Dissanayaka  
**GitHub:** [Alike Reports Repository](https://github.com/AnushkaSandeepa/alike_reports_fe)  
**LinkedIn:** [linkedin.com/in/dmasandeepa](https://linkedin.com/in/dmasandeepa)

---

## 📘 Overview
The **Alike Reports Application** is a desktop analytics system developed for **Alike WA** under the *McCusker Centre Internship Program (UWA)*.  
It automates the evaluation, analysis, and reporting of community workshop and networking event data funded by DOC and DOH.

The system integrates spreadsheet uploads, confidence/satisfaction metrics, and social-media performance analytics to produce dynamic visual insights and reports.

---

## ⚙️ Key Features

- 📊 **Automated Reporting:** Confidence and satisfaction reports from Excel evaluation sheets.  
- 📅 **Program & Annual Reports:** Aggregated results by funding body (DOC/DOH).  
- 🌐 **Social Media Analysis:** Import and visualize engagement metrics from Facebook, Instagram, and LinkedIn.  
- 🔄 **OneDrive Migration:** Secure backup and restore between machines.  
- 🧮 **SOL Comparisons:** Benchmark across SOL 1–4 data levels.  
- 💻 **Offline Functionality:** Works without internet once installed.

---

## 🧠 System Architecture

```
[User Uploads Spreadsheet]
      ↓
[Node.js IPC] → [Python Script Processing]
      ↓
[JSON Output]
      ↓
[React UI Visualization]
      ↓
[Annual Aggregation + OneDrive Sync]
```

**Tech Stack:**  
React • Electron • Node.js • Python (pandas, openpyxl) • ApexCharts • Bootstrap

---

## 🧰 Folder Structure

```
alike_reports_fe/
├── electron/
│   ├── main.cjs
│   ├── ipcHandlers.cjs
│   ├── ipcReportGenerate.cjs
│   ├── ipcPeriodReports.cjs
│   ├── ipcMaintenance.cjs
│   ├── preload.cjs
│   └── assets/icons/
├── scripts/
│   ├── report_generator_confidence.py
│   ├── report_generator_period.py
│   ├── report_generator_social.py
│   └── utils.py
├── src/
│   ├── components/
│   ├── assets/
│   ├── App.jsx
│   ├── main.jsx
│   └── index.less
├── seeds/
│   └── website_downloads_db.json
├── package.json
├── electron-builder.yml
└── README.md
```

---

## 💻 Installation Guide

### 1️⃣ Clone Repository
```bash
git clone https://github.com/AnushkaSandeepa/alike_reports_fe.git
cd alike_reports_fe
```

### 2️⃣ Install Dependencies
```bash
npm install
```

### 3️⃣ Install Python Libraries
Ensure Python 3.11+ is installed and added to PATH.
```bash
py -m pip install --upgrade pip
py -m pip install pandas openpyxl xlrd==1.2.0
```

### 4️⃣ Run Application
#### Development Mode:
```bash
npm run dev
```

#### Production Build:
```bash
npm run dist
```

#### Wrap up Application:
```bash
npm run dist:win     
```

Installer output → `dist_electron/Alike Reports betaV-<version>-win-x64.exe`

---

## 🔁 OneDrive Migration

1. Open the **Maintenance** tab.  
2. Click **“Push to OneDrive”** to upload your Documents and UploadFile folders.  
3. Install the app on another machine.  
4. Retrieve folders from OneDrive and upload them through the Spreadsheet tab.  

This ensures data continuity across systems.

---

## 🧩 Troubleshooting

| Issue | Cause | Solution |
|-------|--------|-----------|
| Python not found | PATH not set | Reinstall Python with “Add to PATH” ticked |
| No JSON output | Script error / invalid Excel columns | Verify spreadsheet format |
| Upload error | Missing Event Date or Feedback Type | Check Excel headers |
| Icon missing | Incorrect path or missing `icon.ico` | Add to `electron/assets/icons/` |
| Reports not generated | Old pandas/openpyxl versions | Reinstall dependencies |

---

## 🚀 Future Roadmap
- Transition from JSON to SQLite / IndexedDB  
- Implement user authentication  
- Integrate Power BI dashboards  
- Enable automated PDF exports  
- Migrate to a cloud-hosted version  

---

## 🧑‍💻 Developer Notes
Main Electron Entry → `electron/main.cjs`  
Frontend Entry → `src/main.jsx`  
Build Config → `electron-builder.yml`

Packaged assets (icons, scripts) are embedded into the app’s `/resources` directory for runtime access.

---

## 🏛️ License
© 2025 Alike WA & D.M. Anushka Sandeepa Dissanayaka Mudiyanselage  
Developed under the McCusker Centre for Citizenship Internship Program (UWA).  
Reproduction or redistribution requires written permission.

---

## 🌐 References
- 📘 [Alike_Reports_Technical_Delivery_Report.pdf](./Alike_Reports_Technical_Delivery_Report.pdf)  
- 📗 [Alike_Reports_User_Manual.pdf](./Alike_Reports_User_Manual.pdf)  
- ☁️ [MigrationGuid.pdf](./MigrationGuid.pdf)

---

> _Developed with ❤️ for Alike WA – empowering peer support communities across Western Australia._
