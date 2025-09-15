import React, { useEffect, useMemo, useState } from "react";
import { Card, CardBody, Form, Row, Button, Col, Input } from "reactstrap";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import { FaEye, FaTrashAlt, FaEdit, FaCheck, FaTimes } from "react-icons/fa";


const MySwal = withReactContent(Swal);

export default function WebsiteDownloads() {
  const [data, setData] = useState([]);
  const [newName, setNewName] = useState("");
  const [newDownloads, setNewDownloads] = useState("");

  const [editingId, setEditingId] = useState(null);
  const [editName, setEditName] = useState("");
  const [editDownloads, setEditDownloads] = useState("");

  // initial load
  useEffect(() => {
    window.electronAPI.getWebsiteDownloads().then(rows => {
      setData(Array.isArray(rows) ? rows : []);
    });
  }, []);

  // live re-sync
  useEffect(() => {
    const off = window.electronAPI.on?.("WebsiteDownloads:updated", () => {
      window.electronAPI.getWebsiteDownloads().then(rows => {
        setData(Array.isArray(rows) ? rows : []);
      });
    }) || (() => {});
    return () => off();
  }, []);

  const totalDownloads = useMemo(
    () => data.reduce((sum, r) => sum + Number(r.downloads || 0), 0),
    [data]
  );

  const handleAdd = async (e) => {
    e.preventDefault();
    const n = Number(newDownloads);
    if (!newName.trim() || !Number.isFinite(n) || n < 0) return;
    const res = await window.electronAPI.addWebsiteDownload({ name: newName.trim(), downloads: n });
    if (res?.success) {
      setData(prev => [...prev, res.data]); // optimistic; event will also re-sync
      setNewName(""); setNewDownloads("");
    } else {
      MySwal.fire("Error", res?.error || "Add failed", "error");
    }
  };

  const startEdit = (row) => {
    setEditingId(row.id);
    setEditName(row.name);
    setEditDownloads(String(row.downloads ?? ""));
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditName("");
    setEditDownloads("");
  };

  const saveEdit = async () => {
    const n = Number(editDownloads);
    if (!editName.trim() || !Number.isFinite(n) || n < 0) return;
    const res = await window.electronAPI.updateWebsiteDownload({ id: editingId, name: editName.trim(), downloads: n });
    if (res?.success) {
      // optimistic local patch
      setData(prev => prev.map(r => r.id === editingId ? { ...r, name: editName.trim(), downloads: n } : r));
      cancelEdit();
    } else {
      MySwal.fire("Error", res?.error || "Update failed", "error");
    }
  };

  const handleDelete = async (row) => {
    const confirm = await MySwal.fire({
      icon: "warning",
      title: "Delete this item?",
      text: `${row.name} (${row.downloads})`,
      showCancelButton: true,
      confirmButtonText: "Delete",
    });
    if (!confirm.isConfirmed) return;

    const res = await window.electronAPI.deleteWebsiteDownload(row.id);
    if (res?.success) {
      setData(prev => prev.filter(r => r.id !== row.id)); // optimistic; event re-syncs anyway
    } else {
      MySwal.fire("Error", res?.error || "Delete failed", "error");
    }
  };

  const downloadCsv = async () => {
    // pass current rows in case you want to export exactly what's displayed
    const res = await window.electronAPI.exportWebsiteDownloadsCsv(data);
    if (res?.canceled) return;
    if (!res?.success) {
      MySwal.fire("Error", res?.error || "Export failed", "error");
    } else {
      MySwal.fire({ icon: "success", title: "CSV saved", text: res.path, timer: 1800, showConfirmButton: false });
    }
  };

  return (
    <Card>
      <CardBody>
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="mb-0">Website Downloads 23/1/23 - 23/3/23</h3>
        </div>

        <Form onSubmit={handleAdd} className="mb-3">
            <Row className="g-2 align-items-end" style={{ maxWidth: 700 }}>
                <Col xs="12" md="6" lg="6">
                <label className="form-label" htmlFor="wd-name">Name</label>
                <Input
                    id="wd-name"
                    className="alikeinput"
                    type="text"
                    placeholder="Name"
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    autoComplete="off"
                />
                </Col>

                <Col xs="12" md="3" lg="3">
                <label className="form-label" htmlFor="wd-downloads">Downloads</label>
                <Input
                    id="wd-downloads"
                    type="number"
                    className="alikeinput"
                    placeholder="Downloads"
                    value={newDownloads}
                    onChange={(e) => setNewDownloads(e.target.value)}
                    min={0}
                    step="1"
                    inputMode="numeric"
                    pattern="[0-9]*"
                />
                </Col>

                <Col xs="12" md="3" lg="3">
                <Button type="submit" color="success" className="w-100">
                    Add
                </Button>
                </Col>
            </Row>
        </Form>


        <table style={{ width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr style={{ background: "#e0e0e0" }}>
              <th style={{ textAlign: "left", padding: "8px" }}>Name</th>
              <th style={{ textAlign: "right", padding: "8px" }}>Downloads</th>
              <th style={{ textAlign: "center", padding: "8px", width: 180 }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, idx) => {
              const isEditing = editingId === row.id;
              return (
                <tr key={row.id || idx} style={{ background: idx % 2 ? "#f9f9f9" : "#fff" }}>
                  <td style={{ padding: "8px" }}>
                    {isEditing ? (
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        style={{ width: "100%", padding: 6 }}
                      />
                    ) : (
                      row.name
                    )}
                  </td>
                  <td style={{ padding: "8px", textAlign: "right" }}>
                    {isEditing ? (
                      <input
                        type="number"
                        min={0}
                        value={editDownloads}
                        onChange={(e) => setEditDownloads(e.target.value)}
                        style={{ width: 120, padding: 6, textAlign: "right" }}
                      />
                    ) : (
                      row.downloads
                    )}
                  </td>
                  <td style={{ padding: "8px", textAlign: "center" }}>
                    {isEditing ? (
                      <div className="d-inline-flex gap-2">
                        <Button size="sm" color="success" onClick={saveEdit}>Save</Button>
                        <Button size="sm" color="secondary" onClick={cancelEdit}>Cancel</Button>
                      </div>
                    ) : (
                      <div className="d-inline-flex gap-2">
                        <FaEdit
                            title="Edit"
                            className="me-1 fs-5"
                            style={{ cursor: "pointer", color: "#198754" }}
                            onClick={() => startEdit(row)}
                            />
                        
                        <FaTrashAlt
                            title="Delete"
                            className="fs-5"
                            style={{ cursor: "pointer", color: "#dc3545" }}
                            onClick={() => handleDelete(row.reportId, row.spreadsheet_name)}
                            />
                        {/* <Button size="sm" color="danger" onClick={() => handleDelete(row)}>Delete</Button> */}
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
            <tr style={{ background: "#e6f4ea", fontWeight: "bold" }}>
              <td style={{ padding: "8px" }}>TOTAL DOWNLOADS</td>
              <td style={{ padding: "8px", textAlign: "right" }}>{totalDownloads}</td>
              <td />
            </tr>
          </tbody>
        </table>
        <div className="mt-3 text-end">
            <Button color="primary" onClick={downloadCsv}>Download CSV</Button>
        </div>
      </CardBody>
    </Card>
  );
}
