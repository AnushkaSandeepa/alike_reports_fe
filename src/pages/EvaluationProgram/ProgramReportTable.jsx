import React, { useMemo, useState, useEffect, useCallback } from "react";
import PropTypes from 'prop-types';
import EventReportTableContainer from "./ProgramReports";
import { FaEye, FaTrashAlt } from "react-icons/fa";
import Swal from "sweetalert2";
import withReactContent from "sweetalert2-react-content";
import EventReportModal from "../../components/EventReportModal";

const MySwal = withReactContent(Swal);

function EventReportGenerate() {
  const [modalIsOpen, setModalIsOpen] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);

  // Reusable loader (Option 2)
    const loadReports = useCallback(async () => {
        setLoading(true);             
        try {
            const data = await window.electronAPI.getReports();
            setReports(data);           
        } catch (e) {
            console.error(e);
            setReports([]);
        } finally {
            setLoading(false);
        }
    }, []);


  useEffect(() => {
    loadReports();
  }, [loadReports]);

  const handleDelete = useCallback(async (reportId, spreadsheet_name) => {
      const result = await MySwal.fire({
          title: "Are you sure?",
          text: `Delete report ${reportId} which was generated using spreadsheet "${spreadsheet_name}"? This action cannot be undone.`,
          icon: "warning",
          showCancelButton: true,
          confirmButtonColor: "#d33",
          cancelButtonColor: "#6c757d",
          confirmButtonText: "Yes, delete it!",
      });
      if (!result.isConfirmed) return;

      try {
          const res = await window.electronAPI.deleteReport(reportId);
          if (res?.success) {
          setReports(res.remaining);
          

          MySwal.fire({ icon: "success", title: "Deleted!", timer: 1400, showConfirmButton: false });
          } else {
          MySwal.fire("Error", res?.error || "Failed to delete report.", "error");
          }
      } catch (err) {
          console.error(err);
          MySwal.fire("Error", "Something went wrong deleting the report.", "error");
      }
  }, []);

  const handleToggleStatus = useCallback(async (reportId, currentStatus) => {
    const desired = currentStatus === "Active" ? "Inactive" : "Active";

    // optimistic update by reportId
    setReports(prev =>
      prev.map(r => (r.reportId === reportId ? { ...r, reportStatus: desired } : r))
    );

    try {
      const res = await window.electronAPI.updateReportStatus(reportId, desired);
      if (!res?.success) throw new Error(res?.error || "Update failed");
      await loadReports();
    } catch (e) {
      // revert on failure
      setReports(prev =>
        prev.map(r =>
          r.reportId === reportId ? { ...r, reportStatus: currentStatus } : r
        )
      );
      MySwal.fire("Error", e.message || "Failed to update report status.", "error");
    }
  }, []);


  const columns = useMemo(
      () => [
      { Header: 'Report ID', accessor: 'reportId' },
      { Header: 'Used Spreadsheet Name', accessor: 'spreadsheet_name' },
      { Header: 'Used Sheetsheet ID', accessor: 'spreadsheet_id' },
      { Header: 'Program Type', accessor: 'program_type', width: 200 },
      {
        Header: "Evaluated For",
        id: "evaluation_range",
        accessor: (row) => {
          const s = row.evaluation_start || "—";
          const e = row.evaluation_end || "—";
          return `${s} to ${e}`;
        },
        width: 200,
      },
      { Header: 'Satisfaction Rate (%)', accessor: 'confidence_data.satisfaction_rate', width: 150 },
      {
        Header: 'Status',
        accessor: 'reportStatus',
        minWidth: 180,
        maxWidth: 260,
        Cell: ({ row }) => {
          const { reportId, reportStatus } = row.original;
          const isActive = reportStatus === "Active";
          return (
            <div className="d-flex align-items-center gap-2">
              <div className="form-check form-switch m-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={isActive}
                  onChange={() => handleToggleStatus(reportId, reportStatus)}
                  style={{
                    backgroundColor: isActive ? "#28a745" : "#dc3545",
                    borderColor: isActive ? "#28a745" : "#dc3545",
                  }}
                  title={isActive ? "Set Inactive" : "Set Active"}
                />
              </div>
              <span
                className={
                  "badge " +
                  (isActive
                    ? "bg-success-subtle text-success"
                    : "bg-danger-subtle text-danger")
                }
              >
                {isActive ? "Active" : "Inactive"}
              </span>
            </div>
          );
        },
      },
      
      {
        Header: 'View',
        width: 140,
        Cell: ({ row }) => {
        const r = row.original;
        return (
            <div style={{ display: "flex", gap: 12, alignItems: "center" }}>
            <FaEye
                title="View"
                style={{ cursor: 'pointer', color: '#007bff' }}
                onClick={() => {
                setSelectedRow(r);
                setModalIsOpen(true);
                }}
            />
            </div>
        );
        },
      },
      {
          Header: 'Delete',
          width: 100,
          Cell: ({ row }) => {
          const r = row.original;
          return (
              <FaTrashAlt
              title="Delete"
              style={{ cursor: 'pointer', color: '#dc3545' }}
              onClick={() => handleDelete(r.reportId, r.spreadsheet_name)}
              />
          );
          },
      }
      ],
      [handleDelete, handleToggleStatus]
  );

  document.title = "Data Tables | Skote - React Admin & Dashboard Template";

  return (
    <div className="page-content">
      <div className="container-fluid">
        {loading ? (
          <p>Loading reports...</p>
        ) : (
          <EventReportTableContainer
            key={reports?.length || 0}
            columns={columns}
            data={reports}
            isGlobalFilter={true}
            isAddOptions={false}
            customPageSize={8}
            className="custom-header-css"
          />
        )}
      </div>

      <EventReportModal
        isOpen={modalIsOpen}
        onClose={() => setModalIsOpen(false)}
        data={selectedRow}
      />
    </div>
  );
}

EventReportGenerate.propTypes = {
  preGlobalFilteredRows: PropTypes.any,
};

export default EventReportGenerate;
