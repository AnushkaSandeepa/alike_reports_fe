// src/pages/Maintenance.jsx
import React, { useEffect, useState } from "react";
import migrationPdf from "../../assets/uility/migration_guide.pdf";

export default function Maintenance() {
  const [status, setStatus] = useState("");
  const [oneDrivePath, setOneDrivePath] = useState("");
  const [includeDocs, setIncludeDocs] = useState(true); // NEW

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const p = await window.electronAPI.getOneDrivePath();
        if (mounted && p) setOneDrivePath(p);
      } catch {}
    })();
    return () => { mounted = false; };
  }, []);

  const handlePushToOneDrive = async () => {
    setStatus("Copying to OneDrive...");
    try {
      const res = await window.electronAPI.pushUploadsToOneDrive({ includeDocs }); // pass flag
      if (res?.ok) {
        const lines = [
          `✅ Copied to: ${res.destRoot}`,
          `• UploadFile: ${res.counts?.UploadFile ?? 0} item(s)`,
          `• Documents: ${res.counts?.Documents ?? 0} item(s)`
        ];
        setStatus(lines.join("  "));
        setOneDrivePath(res.oneDriveRoot || oneDrivePath);
      } else {
        setStatus(`❌ Copy failed${res?.error ? `: ${res.error}` : ""}`);
      }
    } catch (err) {
      setStatus(`❌ Copy failed: ${String(err)}`);
    }
  };

  return (
    <div style={{ padding: 16, display: "grid", gap: 16 }}>
      <h2>Maintenance & Migration Guide</h2>

      <div style={{ width: "100%", height: "70vh", border: "1px solid #e5e7eb", borderRadius: 8, overflow: "hidden" }}>
        <object data={migrationPdf} type="application/pdf" width="100%" height="100%">
          <p>PDF couldn’t be displayed. <a href={migrationPdf} target="_blank" rel="noreferrer">Open in a new tab</a>.</p>
        </object>
      </div>

      <label style={{ display: "flex", alignItems: "center", gap: 8 }}>
        <input type="checkbox" checked={includeDocs} onChange={e => setIncludeDocs(e.target.checked)} />
        Send <code>Documents and Files into One Drive</code> folder
      </label>

      <div style={{ display: "flex", gap: 12, alignItems: "center", flexWrap: "wrap" }}>
        <button
          onClick={handlePushToOneDrive}
          style={{ padding: "10px 16px", borderRadius: 8, border: "none", cursor: "pointer", background: "#2563eb", color: "white", fontWeight: 600 }}
        >
          Push to OneDrive
        </button>
        {status && <span>{status}</span>}
      </div>

      <small style={{ color: "#6b7280" }}>
        OneDrive target{oneDrivePath ? ":" : ""} {oneDrivePath && <code>{oneDrivePath}</code>}
      </small>
    </div>
  );
}
