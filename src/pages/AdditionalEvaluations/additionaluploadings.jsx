import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody, Row, Col, Form, Button, Spinner, Progress } from "reactstrap";
import { FaUpload, FaTimes } from "react-icons/fa";
import ExcelIcon from "../../assets/images/File/Excel.png";
import Swal from "sweetalert2";

/** ---- Config ---- */
const DOCUMENT_TYPES = [
  { value: "", label: "Select type" },
  { value: "SocialMedia", label: "Social Media" },
  { value: "SLOComparison", label: "SLO 1 Comparison" },
  { value: "PIFInsights", label: "PIF Insights" }, // future
];

// Extensions and common MIME types (Windows may report CSV as text/plain)
const ALLOWED_EXTS = [".xlsx", ".xls", ".csv"];
const ALLOWED_MIME = new Set([
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  "application/vnd.ms-excel",
  "text/csv",
  "application/csv",
  "text/plain", // CSV sometimes
]);

const MAX_BYTES = 10 * 1024 * 1024; // 10 MB

const formatBytes = (n) => {
  if (n == null) return "";
  const units = ["B", "KB", "MB", "GB"];
  let v = n, i = 0;
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++; }
  return `${v.toFixed(v < 10 && i > 0 ? 1 : 0)} ${units[i]}`;
};

export default function AdditionalUploadings({ onUpload }) {
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [dragOver, setDragOver] = useState(false);

  const fileInputRef = useRef(null);
  const aliveRef = useRef(true);
  const confirmingRef = useRef(false);

  const uploadDateLabel = useMemo(() => new Date().toLocaleDateString(), []);

  useEffect(() => {
    aliveRef.current = true;
    return () => { aliveRef.current = false; };
  }, []);

  // (Optional) reflect python-side progress in the UI
  useEffect(() => {
    if (!window?.electronAPI?.onAdditionalEvaluationsProgress) return;
    const off = window.electronAPI.onAdditionalEvaluationsProgress((pct) => {
      if (!aliveRef.current) return;
      // Expect 0–100; clamp just in case
      const v = Math.max(0, Math.min(100, Number(pct)));
      setProgress(v);
    });
    return () => off?.();
  }, []);

  const hasAllowedExt = (name) => {
    const lower = (name || "").toLowerCase();
    return ALLOWED_EXTS.some((ext) => lower.endsWith(ext));
  };

  const validateFile = (f) => {
    if (!f) return "Please choose a file.";
    if (!hasAllowedExt(f.name)) {
      return `Unsupported file type. Allowed: ${ALLOWED_EXTS.join(", ")}`;
    }
    // MIME can be empty in some environments; we fallback to extension
    if (f.type && !ALLOWED_MIME.has(f.type) && !hasAllowedExt(f.name)) {
      return `Unsupported file type. Allowed: ${ALLOWED_EXTS.join(", ")}`;
    }
    if (f.size > MAX_BYTES) {
      return `File is too large (${formatBytes(f.size)}). Max ${formatBytes(MAX_BYTES)}.`;
    }
    return "";
  };

  const handleChooseClick = () => {
    if (isUploading) return;
    fileInputRef.current?.click();
  };

  const handleFilePicked = (e) => {
    const f = e.target.files?.[0];
    const err = validateFile(f);
    setError(err);
    setFile(err ? null : f || null);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setDragOver(false);
    if (isUploading) return;
    const f = e.dataTransfer.files?.[0];
    const err = validateFile(f);
    setError(err);
    setFile(err ? null : f || null);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!dragOver) setDragOver(true);
  };
  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (dragOver) setDragOver(false);
  };

  const canUpload = documentType && !!file && !isUploading && !error;

  const simulateProgress = useCallback((cbDone) => {
    // Only used if we don't get real progress events
    let p = 0;
    setProgress(0);
    const id = setInterval(() => {
      p = Math.min(95, p + Math.random() * 10 + 2);
      if (aliveRef.current) setProgress(p);
    }, 180);
    const finish = () => {
      clearInterval(id);
      if (aliveRef.current) { setProgress(100); }
      cbDone?.();
    };
    return finish;
  }, []);

  const resetState = () => {
    setFile(null);
    setError("");
    setProgress(0);
    setDragOver(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleUpload = async () => {
    if (isUploading || confirmingRef.current) return;

    setError("");
    if (!documentType) return setError("Please select a document type.");
    const fv = validateFile(file);
    if (fv) return setError(fv);

    confirmingRef.current = true;
    const confirm = await Swal.fire({
      icon: "question",
      title: "Upload & Generate Report?",
      text: `Type: ${documentType} | File: ${file?.name || "—"}`,
      confirmButtonText: "Yes, upload",
      cancelButtonText: "Cancel",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonColor: "#164728",
      cancelButtonColor: "#6c757d",
    });
    confirmingRef.current = false;

    if (!confirm.isConfirmed) {
      await Swal.fire({
        icon: "info",
        title: "Cancelled",
        text: "Upload was cancelled.",
        confirmButtonColor: "#164728",
      });
      resetState();
      return;
    }

    setIsUploading(true);
    // If the electron side emits progress, great; otherwise simulate.
    const hasProgressEvents = !!window?.electronAPI?.onAdditionalEvaluationsProgress;
    const stopSim = hasProgressEvents ? () => {} : simulateProgress();

    try {
      let res;
      if (window?.electronAPI?.uploadAdditionalDataAuto) {
        res = await window.electronAPI.uploadAdditionalDataAuto(documentType, file);
        if (!res?.success) throw new Error(res?.error || "Processing failed");
        onUpload?.(res);
      } else if (window?.electronAPI?.uploadAdditionalData) {
        // Fallback that uses path (works in Electron only)
        res = await window.electronAPI.uploadAdditionalData(documentType, file.path || file.name);
        if (!res?.success) throw new Error(res?.error || "Processing failed");
        onUpload?.(res);
      } else {
        // Web/demo fallback
        await new Promise((r) => setTimeout(r, 1200));
      }

      await Swal.fire({
        icon: "success",
        title: "Upload Complete!",
        text: "File uploaded and report generated successfully.",
        confirmButtonColor: "#164728",
      });

      resetState();
      return res;
    } catch (e) {
      console.error(e);
      const msg = e?.message || "Upload failed. Please try again.";
      setError(msg);

      await Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: msg,
        confirmButtonColor: "#dc3545",
      });

      resetState();
    } finally {
      stopSim?.();
      if (aliveRef.current) setIsUploading(false);
    }
  };

  return (
    <Card>
      <CardBody>
        <Form onSubmit={(e) => e.preventDefault()}>
          <Row className="g-3">
            <h3 className="mb-3">Upload Additional Evaluation Data</h3>

            <Col md={4}>
              <h6 className="card-title">
                Select Document Type <small className="text-danger ms-1">*</small>
              </h6>
              <select
                value={documentType}
                className="form-select"
                onChange={(e) => setDocumentType(e.target.value)}
                aria-label="Select document type"
                disabled={isUploading}
                required
              >
                {DOCUMENT_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </Col>

            <Col md={4}>
              <h6 className="card-title">Upload Date</h6>
              <input
                type="text"
                className="form-control"
                value={uploadDateLabel}
                readOnly
                aria-label="Upload date"
              />
              <small className="text-muted">Auto-filled as today</small>
            </Col>

            <Col md={12} className="mt-2">
              <h6 className="card-title">
                Upload Your CSV/Excel File <small className="text-danger ms-1">*</small>
              </h6>

              <input
                ref={fileInputRef}
                type="file"
                accept={ALLOWED_EXTS.join(",")}
                onChange={handleFilePicked}
                style={{ display: "none" }}
              />

              <div
                role="button"
                tabIndex={0}
                onClick={handleChooseClick}
                onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleChooseClick()}
                onDrop={handleDrop}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                style={{
                  border: `2px dashed ${dragOver ? "#164728ff" : "#6c757d"}`,
                  borderRadius: 8,
                  padding: 30,
                  textAlign: "center",
                  cursor: isUploading ? "not-allowed" : "pointer",
                  color: "#164728ff",
                  backgroundColor: dragOver ? "#dff2e6" : "#e7f3ebff",
                  outline: "none",
                  transition: "background-color 120ms ease, border-color 120ms ease",
                }}
                title="Click or drop a spreadsheet"
                aria-label="Click or drag and drop to select a spreadsheet"
                aria-disabled={isUploading}
              >
                <div style={{ fontSize: 50, marginBottom: 10, opacity: isUploading ? 0.6 : 1 }}>
                  <FaUpload />
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>
                  {isUploading ? "Uploading…" : "Click or Drop File"}
                </div>
                <div style={{ fontSize: 12, color: "#164728ff", marginTop: 5 }}>
                  Allowed: {ALLOWED_EXTS.join(", ")} • Max {formatBytes(MAX_BYTES)}
                </div>
              </div>

              {file && (
                <div
                  className="d-flex align-items-center justify-content-between gap-2 p-2 mt-2"
                  style={{ border: "1px solid #d1e7dd", borderRadius: 8, backgroundColor: "#e7f3ebff" }}
                >
                  <div className="d-flex align-items-center gap-2">
                    <img src={ExcelIcon} alt="Spreadsheet" style={{ width: 34, height: 34 }} />
                    <div className="d-flex flex-column">
                      <span>{file.name}</span>
                      <small className="text-muted">{formatBytes(file.size)}</small>
                    </div>
                  </div>
                  <Button
                    type="button"
                    color="link"
                    className="text-danger p-0"
                    onClick={() => setFile(null)}
                    aria-label="Remove file"
                    disabled={isUploading}
                  >
                    <FaTimes size={18} />
                  </Button>
                </div>
              )}

              {error && <div className="text-danger mt-2" role="alert">{error}</div>}

              {isUploading && (
                <div className="mt-3" aria-live="polite">
                  <Progress value={progress} />
                  <small className="text-muted">Uploading… {Math.round(progress)}%</small>
                </div>
              )}

              <div className="mt-3">
                <Button
                  type="button"
                  className="btn btn-alike"
                  color="success"
                  onClick={handleUpload}
                  disabled={!canUpload}
                >
                  {isUploading ? (<><Spinner size="sm" className="me-2" /> Uploading…</>) : "Upload File & Generate Report"}
                </Button>
              </div>
            </Col>
          </Row>
        </Form>
      </CardBody>
    </Card>
  );
}
