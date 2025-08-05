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
import "flatpickr/dist/themes/material_blue.css";

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

  const RequiredAsterisk = () => (
    <small
      className="text-danger ms-1"
      aria-label="required"
      style={{ fontSize: 12 }}
    >
      *
    </small>
  );

  const handleFilePickAndUpload = async () => {
    if (!programType || !programDate) {
      setStatus("Please select program type and date first.");
      return;
    }

    setStatus("Saving...");
    const res = await window.electronAPI.pickAndStoreSpreadsheet({
      programType,
      programDate: programDate.toISOString().slice(0, 10),
    });

    if (res.success) {
      setStatus(`Saved to: ${res.metadata.storedAt}`);
    } else {
      setStatus(`Error saving: ${res.error}`);
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

                    <Col md={3} className="mb-3">
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
                      <button
                        type="button"
                        className="btn btn-secondary"
                        onClick={handleFilePickAndUpload}
                      >
                        Select File from Computer
                      </button>
                    </Col>
                  </Row>
                </Form>

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
