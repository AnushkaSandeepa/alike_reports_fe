import React, { useState } from "react";
import {
  Row,
  Col,
  Card,
  Form,
  CardBody,
  Container,
  InputGroup,
} from "reactstrap";
import Dropzone from "react-dropzone";
import Flatpickr from "react-flatpickr";
import "flatpickr/dist/themes/material_blue.css";
import csvimg from "../../assets/images/File/Excel.png";

// Replace with real program types if dynamic
const PROGRAM_TYPES = [
  { value: "", label: "Select Type" },
  { value: "networking_events", label: "Networking Events" },
  { value: "workshop", label: "Workshop" },
];

const SheetUpload = () => {
  document.title = "Spreadsheet Upload | Alike Reports";

  const [selectedFile, setSelectedFile] = useState(null); // File object from Dropzone
  const [programType, setProgramType] = useState("");
  const [programDate, setProgramDate] = useState(null);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);

  const canUpload = !!selectedFile && !!programType && !!programDate;


  // called when user drops/selects via Dropzone
  function handleAcceptedFiles(files) {
    if (files && files.length > 0) {
      const file = files[0];
      Object.assign(file, {
        preview: URL.createObjectURL(file),
        formattedSize: formatBytes(file.size),
      });
      setSelectedFile(file);
    }
  }

  function formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = [
      "Bytes",
      "KB",
      "MB",
      "GB",
      "TB",
      "PB",
      "EB",
      "ZB",
      "YB",
    ];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return (
      parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + " " + sizes[i]
    );
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      setStatus("Please select a spreadsheet file.");
      return;
    }
    if (!programType) {
      setStatus("Please select a program type.");
      return;
    }
    if (!programDate) {
      setStatus("Please select a program date.");
      return;
    }

    setSaving(true);
    setStatus("Saving...");

    // Format date as YYYY-MM-DD
    const formattedDate = programDate
      .toISOString()
      .slice(0, 10);

    // Electron file path (Electron exposes `path` on File objects)
    const sourcePath = selectedFile.path || selectedFile?.name;
    if (!sourcePath || !selectedFile.path) {
      setStatus("Cannot determine file path (must run inside Electron).");
      setSaving(false);
      return;
    }

    try {
      const res = await window.electronAPI.storeSpreadsheet(
        sourcePath,
        {
          programType,
          programDate: formattedDate,
        }
      );

      if (res.success) {
        setStatus(
          `Saved successfully to ${res.metadata.storedAt}`
        );
      } else {
        setStatus(`Error saving: ${res.error}`);
      }
    } catch (err) {
      setStatus("Unexpected error: " + err.message);
    } finally {
      setSaving(false);
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
                    <Col md={3} className="mb-3">
                      <h6 className="card-title">
                        Select Program Type
                      </h6>
                      <select
                        value={programType}
                        className="form-select"
                        onChange={(e) =>
                          setProgramType(e.target.value)
                        }
                      >
                        {PROGRAM_TYPES.map((pt) => (
                          <option
                            key={pt.value}
                            value={pt.value}
                          >
                            {pt.label}
                          </option>
                        ))}
                      </select>
                    </Col>

                    <Col md={3} className="mb-3">
                      <h6 className="card-title">
                        Select Program Date
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
                          value={programDate ? [programDate] : []}           // <<-- fixed
                          onChange={(dates) => setProgramDate(dates[0] || null)}
                        />

                      </InputGroup>
                    </Col>

                    <Col md={12}>
                      <h6 className="card-title">
                        Upload Your Spreadsheets Here
                      </h6>
                      <Dropzone
                        onDrop={handleAcceptedFiles}
                        accept={{
                          "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet":
                            [".xlsx"],
                          "text/csv": [".csv"],
                        }}
                        multiple={false}
                      >
                        {({ getRootProps, getInputProps }) => (
                          <div className="dropzone">
                            <div
                              className="dz-message needsclick mt-2"
                              {...getRootProps()}
                            >
                              <input {...getInputProps()} />
                              <div className="mb-3">
                                <i className="display-4 text-muted bx bxs-cloud-upload" />
                              </div>
                              <h4>
                                Drop XLSX or CSV files here or
                                click to upload.
                              </h4>
                            </div>
                          </div>
                        )}
                      </Dropzone>
                    </Col>
                  </Row>

                  {selectedFile && (
                    <div
                      className="dropzone-previews mt-3"
                      id="file-previews"
                    >
                      <Card className="mt-1 mb-0 shadow-none border">
                        <div className="p-2">
                          <Row className="align-items-center">
                            <Col className="col-auto">
                              <img
                                height="80"
                                className="avatar-sm rounded bg-light"
                                src={csvimg}
                                alt="file"
                              />
                            </Col>
                            <Col>
                              <div className="text-muted font-weight-bold">
                                {selectedFile.name}
                              </div>
                              <p className="mb-0">
                                <strong>
                                  {selectedFile.formattedSize}
                                </strong>
                              </p>
                            </Col>
                          </Row>
                        </div>
                      </Card>
                    </div>
                  )}
                </Form>

                <div className="mt-4">
                  <button
                    type="button"
                    className="btn-alike"
                    onClick={handleUpload}
                    disabled={!canUpload || saving}
                  >
                    {saving ? "Saving..." : "Upload & Store Spreadsheet"}
                  </button>

                </div>

                {status && (
                  <div
                    style={{
                      marginTop: 15,
                      fontSize: 14,
                      color: status.startsWith("Error")
                        ? "crimson"
                        : "green",
                    }}
                  >
                    {status}
                  </div>
                )}
              </CardBody>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
};

export default SheetUpload;
