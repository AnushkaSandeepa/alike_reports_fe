import React, { useState, useEffect } from "react";
import {
  Row, Col, Card, Form, Input, CardBody, Container, InputGroup, FormGroup,
} from "reactstrap";
import Flatpickr from "react-flatpickr";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import "flatpickr/dist/themes/material_blue.css";
import ExcelIcon from "../../assets/images/File/Excel.png";
import { FaUpload } from "react-icons/fa";

const MySwal = withReactContent(Swal);

// Only allow .xlsx and .csv
const ALLOWED_EXTS = [".xlsx", ".csv"];
const getExt = (p) => (p?.match(/\.[^./\\]+$/)?.[0] || "").toLowerCase();
const isValidSpreadsheet = (path) => ALLOWED_EXTS.includes(getExt(path));

const PROGRAM_TYPES = [
  { value: "", label: "Select Type" },
  { value: "networking_events", label: "Networking Events" },
  { value: "workshop", label: "Workshop" },
];

const FUNDINGBODY = [
  { value: "", label: "Select Funding Body"},
  { value: "DOC", label: "Department of Communities (DOC)" },
  { value: "DOH", label: "Department of Health (DOH)" },
];

const SheetUpload = () => {
  useEffect(() => { document.title = "Spreadsheet Upload | Alike WA"; }, []);

  const [programType, setProgramType] = useState("");
  const [fundingBody, setFundingBody] = useState("");
  const [programDate, setProgramDate] = useState(null);
  const [status, setStatus] = useState("");
  const [selectedFilePath, setSelectedFilePath] = useState(null); // real path on disk
  const [pendingBytes, setPendingBytes] = useState(null);         // { bytes, originalName } when pathless
  const [fileName, setFileName] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [facilitator, setFacilitator] = useState("");
  const [dateRange, setDateRange] = useState([]);

  const RequiredAsterisk = () => (
    <small className="text-danger ms-1" aria-label="required" style={{ fontSize: 12 }}>
      *
    </small>
  );

  const applyMetadataFrom = (res) => {
    if (res?.eventDate) {
      const [y, m, d] = res.eventDate.split("-").map(Number);
      setProgramDate(new Date(y, m - 1, d));
    } else setProgramDate(null);

    setFacilitator(res?.facilitator || "");

    if (res?.fundingBody) {
      const fb = String(res.fundingBody || "").trim().toUpperCase();
      setFundingBody(["DOC", "DOH"].includes(fb) ? fb : "");
    }

    if (res?.range && (res.range.start || res.range.end)) {
      setDateRange([res.range.start || "", res.range.end || ""]);
    } else setDateRange([]);
  };

  async function hydrateFromRealPath(p) {
    if (!isValidSpreadsheet(p)) {
      await MySwal.fire({ icon: "warning", title: "Unsupported file", text: "Only .xlsx and .csv files are allowed." });
      return;
    }
    setPendingBytes(null);
    setSelectedFilePath(p);
    setFileName(p.split(/[\\/]/).pop());
    setStatus("");

    const res = await window.electronAPI.extractSheetMetadata(p);
    if (res?.success) applyMetadataFrom(res);
    else console.error("extractSheetMetadata error:", res?.error);
  }

  async function hydrateFromFileOrBytes(fileOrPath) {
    if (typeof fileOrPath === "string") {
      const ok = await window.electronAPI.fsPathExists(fileOrPath);
      if (ok) return hydrateFromRealPath(fileOrPath);
      await MySwal.fire({ icon: "error", title: "File not found", text: fileOrPath });
      return;
    }

    // It's a File object (drag from browser/VS Code without real path)
    const f = fileOrPath;
    if (f && typeof f.arrayBuffer === "function") {
      const ab = await f.arrayBuffer();
      const bytes = Array.from(new Uint8Array(ab));

      const meta = await window.electronAPI.extractSheetMetadataBytes(bytes, f.name);
      if (meta?.success) applyMetadataFrom(meta);
      else console.error("extractSheetMetadataBytes error:", meta?.error);

      setSelectedFilePath(null);
      setPendingBytes({ bytes, originalName: f.name });
      setFileName(f.name || "upload.xlsx");
      setStatus("");
      return;
    }

    await MySwal.fire({
      icon: "warning",
      title: "Unsupported drop",
      text: "Please drag from File Explorer/Finder, or click to select.",
    });
  }

  const handlePickFile = async () => {
    const result = await window.electronAPI.pickSpreadsheet();
    if (result?.success) {
      await hydrateFromRealPath(result.filePath);
    } else {
      setStatus("File selection cancelled.");
    }
  };

  const handleDragOver = (e) => { e.preventDefault(); e.stopPropagation(); };
  const handleDrop = async (e) => {
    e.preventDefault(); e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (!file) return;
    if (file.path) {
      const exists = await window.electronAPI.fsPathExists(file.path);
      if (exists) return hydrateFromRealPath(file.path);
    }
    await hydrateFromFileOrBytes(file);
  };

  const handleUpload = async () => {
    if (!programType || !programDate || (!selectedFilePath && !pendingBytes) || !fundingBody) {
      MySwal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please select type, funding body, date, and file.",
      });
      return;
    }

    try {
      setIsUploading(true);
      setStatus("Uploading...");

      const ymdLocal = (d) =>
        [d.getFullYear(), String(d.getMonth() + 1).padStart(2, "0"), String(d.getDate()).padStart(2, "0")].join("-");

      let res;
      if (selectedFilePath) {
        res = await window.electronAPI.storeSpreadsheet({
          sourcePath: selectedFilePath,
          programType,
          fundingBody,
          programDate: ymdLocal(programDate),
          personIncharge: facilitator || "",
          dateRange: Array.isArray(dateRange)
            ? { start: dateRange[0] || null, end: dateRange[1] || null }
            : { start: null, end: null },
        });
      } else {
        // bytes path
        res = await window.electronAPI.storeSpreadsheetBytes(
          pendingBytes.bytes,
          pendingBytes.originalName,
          {
            programType,
            fundingBody,
            programDate: ymdLocal(programDate),
            personIncharge: facilitator || "",
            dateRange: { start: dateRange[0] || null, end: dateRange[1] || null },
          }
        );
      }

      if (res?.success) {
        MySwal.fire({
          icon: "success",
          title: "Upload Successful",
          text: `Saved to: ${res.metadata.storedAt}`,
          timer: 3000,
          timerProgressBar: true,
          showConfirmButton: false,
        });

        // reset form
        setProgramType("");
        setFundingBody("");
        setProgramDate(null);
        setSelectedFilePath(null);
        setPendingBytes(null);
        setFileName(null);
        setFacilitator("");
        setDateRange([]);
        setStatus("");
      } else {
        MySwal.fire({ icon: "error", title: "Upload Failed", text: res?.error || "Unknown error" });
      }
    } catch (err) {
      MySwal.fire({ icon: "error", title: "Upload Failed", text: String(err) });
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <div className="page-content">
      <Container fluid={true}>
        <Row className="py-3 align-items-center">
          <div className="fs-5" style={{ fontSize: "24px", fontWeight: "700" }}>
            Spreadsheet Uploading
          </div>
        </Row>

        <Row style={{ marginTop: "20px" }}>
          <Col className="col-12">
            <Card>
              <CardBody>
                <Form>
                  <Row>
                    <Col md={4} className="mb-3">
                      <h6 className="card-title">
                        Select Program Type {!programType && <RequiredAsterisk />}
                      </h6>
                      <select
                        value={programType}
                        className="form-select"
                        onChange={(e) => setProgramType(e.target.value)}
                      >
                        {PROGRAM_TYPES.map((pt) => (
                          <option key={pt.value} value={pt.value}>
                            {pt.label}
                          </option>
                        ))}
                      </select>
                    </Col>

                    <Col md={4} className="mb-3" title="Make sure your data file has a column named Funding Body">
                      <h6 className="card-title">Funding Body (Auto) <RequiredAsterisk /></h6>
                      <div>
                        <select
                          className="form-select"
                          value={fundingBody}
                          style={{ height: "40px" }}
                          onChange={(e) => setFundingBody(e.target.value)}
                        >
                          {FUNDINGBODY.map((pt) => (
                            <option key={pt.value} value={pt.value}>
                              {pt.label}
                            </option>
                          ))}
                        </select>
                      </div>
                    </Col>

                    <Col md={12} className="mt-3">
                      <h6 className="card-title">
                        Upload Your Spreadsheet <RequiredAsterisk />
                      </h6>

                      <div className="d-flex flex-column gap-2">
                        <div
                          onClick={handlePickFile}
                          onDragOver={handleDragOver}
                          onDrop={handleDrop}
                          style={{
                            border: "2px dashed #6c757d",
                            borderRadius: "6px",
                            padding: "30px",
                            textAlign: "center",
                            cursor: "pointer",
                            color: "#6c757d",
                            backgroundColor: "#f8f9fa",
                            transition: "background-color 0.2s ease",
                          }}
                          onMouseEnter={(e) => (e.currentTarget.style.backgroundColor = "#e9ecef")}
                          onMouseLeave={(e) => (e.currentTarget.style.backgroundColor = "#f8f9fa")}
                          aria-label="File drop zone"
                        >
                          <div style={{ fontSize: "50px", marginBottom: "10px" }}>
                            <FaUpload />
                          </div>
                          <div style={{ fontSize: "16px", fontWeight: 500 }}>
                            Click or Drag & Drop a Spreadsheet
                          </div>
                          <div style={{ fontSize: "12px", color: "#adb5bd", marginTop: "5px" }}>
                            Only .xlsx and .csv files are allowed
                          </div>
                        </div>

                        {fileName && (
                          <div
                            className="d-flex align-items-center justify-content-between gap-2 p-2 mt-2"
                            style={{
                              border: "1px solid #ced4da",
                              borderRadius: "6px",
                              backgroundColor: "#f8f9fa",
                            }}
                          >
                            <div className="d-flex align-items-center gap-2">
                              <img src={ExcelIcon} alt="Excel Icon" style={{ width: 34, height: 34 }} />
                              <span>{fileName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFilePath(null);
                                setPendingBytes(null);
                                setFileName(null);
                                setStatus("");
                                setProgramDate(null);
                                setFacilitator("");
                                setDateRange([]);
                              }}
                              style={{
                                background: "none",
                                border: "none",
                                fontSize: "20px",
                                color: "#dc3545",
                                cursor: "pointer",
                                lineHeight: "1",
                              }}
                              title="Remove file"
                              aria-label="Remove file"
                            >
                              &times;
                            </button>
                          </div>
                        )}

                        <Row className="mt-3">
                          <Col md={4} className="mb-3 mt-3" title="Make sure your data file has a column named Event Date">
                            <h6 className="card-title">Program Date (Auto) {!programDate && <RequiredAsterisk />}</h6>
                            <InputGroup>
                              <Flatpickr
                                className="form-control d-block date-buttion-alike"
                                placeholder="dd M,yyyy"
                                options={{ altInput: true, altFormat: "F j, Y", dateFormat: "Y-m-d" }}
                                value={programDate ? [programDate] : []}
                                onChange={(dates) => setProgramDate(dates[0] || null)}
                              />
                            </InputGroup>
                          </Col>

                          <Col md={4} className="mt-3" title="Make sure your data file has a column named Facilitator">
                            <h6 className="card-title">Facilitator (Auto) <RequiredAsterisk /></h6>
                            <div>
                              <InputGroup>
                                <Input type="text" className="form-control" value={facilitator} style={{ height: "40px" }} disabled />
                              </InputGroup>
                            </div>
                          </Col>

                          <Col md={4} className="mt-3" title="Make sure your data file has a column named Event Date">
                            <h6 className="card-title">Included Range (Auto) <RequiredAsterisk /></h6>
                            <div>
                              <FormGroup className="mb-0">
                                <InputGroup>
                                  <Flatpickr
                                    className="form-control d-block date-buttion-alike"
                                    placeholder="yyyy-mm-dd to yyyy-mm-dd"
                                    options={{ mode: "range", dateFormat: "Y-m-d" }}
                                    value={dateRange}
                                  />
                                </InputGroup>
                              </FormGroup>
                            </div>
                          </Col>
                        </Row>

                        {(selectedFilePath || pendingBytes) && (
                          <button
                            type="button"
                            className="btn btn-alike"
                            onClick={handleUpload}
                            disabled={isUploading}
                          >
                            {isUploading ? "Uploading..." : "Upload Spreadsheet"}
                          </button>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Form>
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SheetUpload;
