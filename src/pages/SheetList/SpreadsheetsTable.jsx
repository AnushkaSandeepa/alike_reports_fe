import React, { useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
import TableContainer from "@/pages/SheetList/TableContainer";
import { FaTrash, FaEye } from "react-icons/fa";

function EventSheetsTable() {
  const [sheetData, setSheetData] = useState([]);
  
  console.log("Sheet Data:", sheetData);
  // Fetch metadata on mount
  useEffect(() => {
    const fetchData = async () => {
      const res = await window.electronAPI.getUploadedSheets();
      if (res.success) {
        // Format the metadata to match table shape
        const formatted = res.data.map((item, index) => ({
          row_id: index + 1, // Fake ID
          fileId: item.fileId,
          name: item.storedAt.split(/[\\/]/).pop(),
          sheet_type: item.programType,
          programDate: item.programDate.slice(0, 10),
          status: item.filesStatus,
          fullPath: item.storedAt
        }));
        setSheetData(formatted);
      } else {
        console.error("Failed to load uploaded sheets:", res.error);
      }
    };
    fetchData();
  }, []);

  const handleDelete = async (rowIndex) => {
    const fileIdToDelete = sheetData[rowIndex].fileId;
    const res = await window.electronAPI.deleteSpreadsheet(fileIdToDelete);
    if (res.success) {
      const updated = [...sheetData];
      updated.splice(rowIndex, 1);
      setSheetData(updated);
    } else {
      alert("Failed to delete: " + (res.error || "Unknown error"));
    }
  };

  const handleToggleStatus = async (rowIndex) => {
    const row = sheetData[rowIndex];
    const prevStatus = row.status;
    const nextStatus = prevStatus === "Active" ? "Inactive" : "Active";

    // Optimistic update
    setSheetData((old) =>
      old.map((r, i) => (i === rowIndex ? { ...r, status: nextStatus } : r))
    );

    // OPTIONAL: persist to disk (enable step 2 and 3)
    try {
      const res = await window.electronAPI.updateSpreadsheetStatus(
        row.fileId,
        nextStatus
      );
      if (!res?.success) throw new Error(res?.error || "Update failed");
    } catch (e) {
      // Revert on failure
      setSheetData((old) =>
        old.map((r, i) => (i === rowIndex ? { ...r, status: prevStatus } : r))
      );
      alert("Failed to update status: " + e.message);
    }
  };


  const columns = useMemo(
    () => [
      {
        Header: "File ID",
        accessor: "fileId",
        width: 100
      },
      {
        Header: "File Name",
        accessor: "name",
        width: 200
      },
      {
        Header: "Program Type",
        accessor: "sheet_type",
        width: 200
      },
      {
        Header: "Promgram Date",
        accessor: "programDate",
        minWidth: 150,
        maxWidth: 250
      },
      {
        Header: "Status",
        accessor: "status",
        minWidth: 180,
        maxWidth: 260,
        Cell: ({ row }) => {
          const isActive = row.original.status === "Active";
          return (
            <div className="d-flex align-items-center gap-2">
              {/* If you want to hanlde status by a button, then uncomment this. all functions are impelemted */}
              {/* <div className="form-check form-switch m-0">
                <input
                  className="form-check-input"
                  type="checkbox"
                  role="switch"
                  checked={isActive}
                  onChange={() => handleToggleStatus(row.index)}
                  style={{
                    backgroundColor: isActive ? "#28a745" : "#dc3545",
                    borderColor: isActive ? "#28a745" : "#dc3545",
                  }}
                />
              </div> */}
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
        Header: "Delete",
        width: 100,
        Cell: ({ row }) => (
          <FaTrash
            style={{ cursor: "pointer", color: "#dc3545" }}
            onClick={() => handleDelete(row.index)}
          />
        )
      }
    ],
    [sheetData]
  );

  document.title = "Sheet Table | Alike Reports";

  return (
    <div className="page-content">
      <div className="container-fluid">
        <TableContainer
          columns={columns}
          data={sheetData}
          isGlobalFilter={true}
          isAddOptions={false}
          customPageSize={8}
          className="custom-header-css"
        />
      </div>
    </div>
  );
}

EventSheetsTable.propTypes = {
  preGlobalFilteredRows: PropTypes.any
};

export default EventSheetsTable;
