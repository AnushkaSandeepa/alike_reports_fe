import React, { useState, useEffect } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  CardBody,
  Container,
  InputGroup,
} from "reactstrap";
import Flatpickr from "react-flatpickr";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";

import "flatpickr/dist/themes/material_blue.css";
import ExcelIcon from "../../assets/images/File/Excel.png";

const MySwal = withReactContent(Swal);

  
const PROGRAM_TYPES = [
  { value: "", label: "Select Type" },
  { value: "networking_events", label: "Networking Events" },
  { value: "workshop", label: "Workshop" },
];

const SheetUpload = () => {
  useEffect(() => {
    document.title = "Spreadsheet Upload | Alike Reports";
  }, []);

  const [programType, setProgramType] = useState("");
  const [programDate, setProgramDate] = useState(null);
  const [status, setStatus] = useState("");
  const [selectedFilePath, setSelectedFilePath] = useState(null);
  const [fileName, setFileName] = useState(null);

  const RequiredAsterisk = () => (
    <small
      className="text-danger ms-1"
      aria-label="required"
      style={{ fontSize: 12 }}
    >
      *
    </small>
  );

  const handlePickFile = async () => {
    const result = await window.electronAPI.pickSpreadsheet();
    if (result.success) {
      setSelectedFilePath(result.filePath);
      setFileName(result.filePath.split(/[\\/]/).pop());
      setStatus("");
    } else {
      setStatus("File selection cancelled.");
    }
  };

  const handleUpload = async () => {
    if (!programType || !programDate || !selectedFilePath) {
      MySwal.fire({
        icon: "warning",
        title: "Missing fields",
        text: "Please select type, date, and file.",
      });
      return;
    }

    setStatus("Uploading...");

    const res = await window.electronAPI.storeSpreadsheet({
      sourcePath: selectedFilePath,
      programType,
      programDate: programDate.toISOString().slice(0, 10),
    });

    if (res.success) {
      MySwal.fire({
        icon: "success",
        title: "Upload Successful",
        text: `Saved to: ${res.metadata.storedAt}`,
        timer: 3000,
        timerProgressBar: true,
        showConfirmButton: false,
      });

      // Reset all form states
      setProgramType("");
      setProgramDate(null);
      setSelectedFilePath(null);
      setFileName(null);
      setStatus("");

    } else {
      MySwal.fire({
        icon: "error",
        title: "Upload Failed",
        text: res.error,
      });
    }
  };


  return (
    <div className="page-content">
      <Container fluid={true}>
        <Row className="py-3 align-items-center">
          <div
            className="fs-5"
            style={{ fontSize: "24px", fontWeight: "700" }}
          >
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
                        Select Program Type
                        {!programType && <RequiredAsterisk />}
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

                    <Col md={4} className="mb-3">
                      <h6 className="card-title">
                        Select Program Date
                        {!programDate && <RequiredAsterisk />}
                      </h6>
                      <InputGroup>
                        <Flatpickr
                          className="form-control d-block date-buttion-alike"
                          placeholder="dd M,yyyy"
                          options={{
                            altInput: true,
                            altFormat: "F j, Y",
                            dateFormat: "Y-m-d",
                          }}
                          value={programDate ? [programDate] : []}
                          onChange={(dates) =>
                            setProgramDate(dates[0] || null)
                          }
                        />
                      </InputGroup>
                    </Col>

                    <Col md={12} className="mt-3">
                      <h6 className="card-title">
                        Upload Your Spreadsheet
                        <RequiredAsterisk />
                      </h6>

                      <div className="d-flex flex-column gap-2">
                        <div
                          onClick={handlePickFile}
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
                          onMouseEnter={(e) =>
                            (e.currentTarget.style.backgroundColor = "#e9ecef")
                          }
                          onMouseLeave={(e) =>
                            (e.currentTarget.style.backgroundColor = "#f8f9fa")
                          }
                          >
                          <div style={{ fontSize: "16px", fontWeight: 500 }}>
                            Drag & drop or click to select spreadsheet
                          </div>
                          <div style={{ fontSize: "12px", color: "#adb5bd", marginTop: "5px" }}>
                            Only .xlsx, .xls, .csv files are allowed
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
                              <img
                                src={ExcelIcon}
                                alt="Excel Icon"
                                style={{ width: 34, height: 34 }}
                              />
                              <span>{fileName}</span>
                            </div>
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedFilePath(null);
                                setFileName(null);
                                setStatus("");
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
                            >
                              &times;
                            </button>
                          </div>
                        )}



                        {selectedFilePath && (
                          <button
                            type="button"
                            className="btn btn-alike"
                            onClick={handleUpload}
                          >
                            Upload Spreadsheet
                          </button>
                        )}
                      </div>
                    </Col>
                  </Row>
                </Form>

                {/* {status && (
                  <Alert
                    color={status.startsWith("Error") ? "danger" : "success"}
                    className="mt-3"
                    toggle={() => setStatus("")}
                    fade
                  >
                    {status}
                  </Alert>
                )} */}

              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SheetUpload;
