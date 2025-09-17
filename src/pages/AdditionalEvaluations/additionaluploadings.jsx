import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Card, CardBody, Row, Col, Form, Button, Spinner, Progress } from "reactstrap";
import { FaUpload, FaTimes } from "react-icons/fa";
import ExcelIcon from "../../assets/images/File/Excel.png";
import Swal from "sweetalert2";


const DOCUMENT_TYPES = [
  { value: "", label: "Select type" },
  { value: "SLOComparison", label: "SLO 1 Comparison" },
  { value: "PIFInsights", label: "PIF Insights" }, // (future)
];

const ALLOWED_EXTS = [".xlsx", ".xls", ".csv"]; // extend to .pdf/.docx if needed
const MAX_BYTES = 10 * 1024 * 1024;

const formatBytes = (n) => {
  if (n == null) return "";
  const units = ["B","KB","MB","GB"];
  let v = n, i = 0;
  while (v >= 1024 && i < units.length-1) { v/=1024; i++; }
  return `${v.toFixed(v < 10 && i>0 ? 1 : 0)} ${units[i]}`;
};

export default function AdditionalUploadings({ onUpload }) {
  const [documentType, setDocumentType] = useState("");
  const [file, setFile] = useState(null);
  const [error, setError] = useState("");
  const [isUploading, setIsUploading] = useState(false);
  const [progress, setProgress] = useState(0);

  const fileInputRef = useRef(null);
  const uploadDateLabel = useMemo(() => new Date().toLocaleDateString(), []);

  useEffect(() => {
    if (!window?.electronAPI?.onAdditionalEvaluationsProgress) return;
    const off = window.electronAPI.onAdditionalEvaluationsProgress((p) => {
      // Optionally reflect python/progress to UI
      // console.log("AE:", p);
    });
    return () => off?.();
  }, []);

  const validateFile = (f) => {
    if (!f) return "Please choose a file.";
    const name = f.name.toLowerCase();
    const okExt = ALLOWED_EXTS.some((ext) => name.endsWith(ext));
    if (!okExt) return `Unsupported file type. Allowed: ${ALLOWED_EXTS.join(", ")}`;
    if (f.size > MAX_BYTES) return `File is too large (${formatBytes(f.size)}). Max ${formatBytes(MAX_BYTES)}.`;
    return "";
  };

  const handleChooseClick = () => fileInputRef.current?.click();
  const handleFilePicked = (e) => {
    const f = e.target.files?.[0];
    const err = validateFile(f);
    setError(err);
    setFile(err ? null : f || null);
  };
  const handleDrop = (e) => {
    e.preventDefault(); e.stopPropagation();
    const f = e.dataTransfer.files?.[0];
    const err = validateFile(f);
    setError(err);
    setFile(err ? null : f || null);
  };
  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };

  const canUpload = documentType && file && !isUploading && !error;

  const simulateProgress = useCallback((cbDone) => {
    setProgress(0);
    let p = 0;
    const id = setInterval(() => { p = Math.min(95, p + Math.random()*12); setProgress(p); }, 150);
    const finish = () => { clearInterval(id); setProgress(100); cbDone?.(); };
    return finish;
  }, []);

  const resetState = () => {
    setFile(null);
    setError("");
    setProgress(0);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };


  const handleUpload = async () => {
    // basic validation up-front
    setError("");
    if (!documentType) return setError("Please select a document type.");
    const fv = validateFile(file);
    if (fv) return setError(fv);

    // 1) Ask for confirmation BEFORE we start uploading/progress
    const confirm = await Swal.fire({
      icon: "question",
      title: "Upload & Generate Report?",
      html: `
        <div style="text-align:left">
          <b>Type:</b> ${documentType}<br/>
          <b>File:</b> ${file?.name || "—"}
        </div>
      `,
      confirmButtonText: "Yes, upload",
      cancelButtonText: "Cancel",
      showCancelButton: true,
      focusCancel: true,
      confirmButtonColor: "#164728",
      cancelButtonColor: "#6c757d",
    });

    if (!confirm.isConfirmed) {
      // user cancelled -> optional notice, then reset the fields
      await Swal.fire({
        icon: "info",
        title: "Cancelled",
        text: "Upload was cancelled.",
        confirmButtonColor: "#164728",
      });
      resetState(); // <-- reset everything after user clicks the modal
      return;
    }

    // 2) Proceed with upload
    setIsUploading(true);
    const stopSim = simulateProgress();
    let res;

    try {
      if (window?.electronAPI?.uploadAdditionalDataAuto) {
        res = await window.electronAPI.uploadAdditionalDataAuto(documentType, file);
        if (!res?.success) throw new Error(res?.error || "Processing failed");
        onUpload?.(res);
      } else if (window?.electronAPI?.uploadAdditionalData) {
        res = await window.electronAPI.uploadAdditionalData(documentType, file.path || file.name);
        if (!res?.success) throw new Error(res?.error || "Processing failed");
        onUpload?.(res);
      } else {
        // web/demo fallback
        await new Promise((r) => setTimeout(r, 1200));
      }

      // 3) Success modal; reset after user clicks OK
      await Swal.fire({
        icon: "success",
        title: "Upload Complete!",
        text: "File uploaded and report generated successfully.",
        confirmButtonColor: "#164728",
      });

      resetState(); // <-- reset all fields after clicking the success modal
      return res;   // optional
    } catch (e) {
      console.error(e);
      setError(e.message || "Upload failed. Please try again.");

      // Error modal; also reset after they dismiss it (your call)
      await Swal.fire({
        icon: "error",
        title: "Upload Failed",
        text: e.message || "Something went wrong. Please try again.",
        confirmButtonColor: "#dc3545",
      });

      resetState(); // optional: reset on error too
    } finally {
      stopSim();
      setIsUploading(false);
    }
  }
  

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
                required
              >
                {DOCUMENT_TYPES.map((pt) => (
                  <option key={pt.value} value={pt.value}>{pt.label}</option>
                ))}
              </select>
            </Col>

            <Col md={4}>
              <h6 className="card-title">Upload Date</h6>
              <input type="text" className="form-control" value={uploadDateLabel} readOnly aria-label="Upload date" />
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
                style={{
                  border: "2px dashed #6c757d",
                  borderRadius: 8,
                  padding: 30,
                  textAlign: "center",
                  cursor: "pointer",
                  color: "#164728ff",
                  backgroundColor: "#e7f3ebff",
                  outline: "none",
                }}
                title="Click or drop a spreadsheet"
                aria-label="Click or drag and drop to select a spreadsheet"
              >
                <div style={{ fontSize: 50, marginBottom: 10 }}>
                  <FaUpload />
                </div>
                <div style={{ fontSize: 16, fontWeight: 600 }}>Click or Drop File</div>
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
                  <Button type="button" color="link" className="text-danger p-0" onClick={() => setFile(null)} aria-label="Remove file">
                    <FaTimes size={18} />
                  </Button>
                </div>
              )}

              {error && <div className="text-danger mt-2" role="alert">{error}</div>}

              {isUploading && (
                <div className="mt-3">
                  <Progress value={progress} />
                  <small className="text-muted">Uploading… {Math.round(progress)}%</small>
                </div>
              )}

              <div className="mt-3">
                <Button type="button" className="btn btn-alike" color="success" onClick={handleUpload} disabled={!canUpload}>
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
