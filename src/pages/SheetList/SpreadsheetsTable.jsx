import React, { useMemo, useState, useEffect } from "react";
import PropTypes from "prop-types";
import TableContainer from "@/pages/SheetList/TableContainer";
import { FaTrash, FaEye } from "react-icons/fa";

function EventSheetsTable() {
  const [sheetData, setSheetData] = useState([]);

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
          startDate: item.savedOn.slice(0, 10),
          status: "Active", // You can add real status logic later
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



  const columns = useMemo(
    () => [
      {
        Header: "Row ID",
        accessor: "row_id",
        width: 100
      },
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
        Header: "Uploaded Date",
        accessor: "startDate",
        minWidth: 150,
        maxWidth: 250
      },
      {
        Header: "Status",
        accessor: "status",
        minWidth: 150,
        maxWidth: 250
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
