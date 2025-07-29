import React, { useMemo, useState } from "react";
import PropTypes from "prop-types";
import TableContainer from "@/pages/SheetList/TableContainer";

import { FaTrash, FaEye } from "react-icons/fa";

function EventSheetsTable() {
  const [sheetData, setSheetData] = useState([
    {
      name: "Jennifer Chang",
      position: "Regional Director",
      age: 28,
      office: "Singapore",
      startDate: "2010/11/14",
      sheet_type: "Networking Event",
      status: "Active"
    },
    {
      name: "Gavin Joyce",
      position: "Developer",
      age: 42,
      office: "Edinburgh",
      startDate: "2010/12/22",
      sheet_type: "Networking Event",
      status: "Active"
    },
    {
      name: "Angelica Ramos",
      position: "Chief Executive Officer (CEO)",
      age: 47,
      office: "London",
      startDate: "2009/10/09",
      sheet_type: "Networking Event",
      status: "Active"
    },
    {
      name: "Doris Wilder",
      position: "Sales Assistant",
      age: 23,
      office: "Sidney",
      startDate: "2010/09/20",
      sheet_type: "Networking Event",
      status: "Active"
    },
    {
      name: "Caesar Vance",
      position: "Pre-Sales Support",
      age: 21,
      office: "New York",
      startDate: "2011/12/12",
      sheet_type: "Networking Event",
      status: "Inactive"
    },
    {
      name: "Yuri Berry",
      position: "Chief Marketing Officer (CMO)",
      age: 40,
      office: "New York",
      startDate: "2009/06/25",
      sheet_type: "Workshop",
      status: "Active"
    },
    {
      name: "Jenette Caldwell",
      position: "Development Lead",
      age: 30,
      office: "New York",
      startDate: "2011/09/03",
      sheet_type: "Workshop",
      status: "Inactive"
    },
    {
      name: "Dai Rios",
      position: "Personnel Lead",
      age: 35,
      office: "Edinburgh",
      startDate: "2012/09/26",
      sheet_type: "Workshop",
      status: "Active"
    },
    {
      name: "Bradley Greer",
      position: "Software Engineer",
      age: 41,
      office: "London",
      startDate: "2012/10/13",
      sheet_type: "Workshop",
      status: "Active"
    },
    {
      name: "Gloria Little",
      position: "Systems Administrator",
      age: 59,
      office: "New York",
      startDate: "2009/04/10",
      sheet_type: "Workshop",
      status: "Active"
    }
  ]);

  const handleDelete = (rowIndex) => {
    const updated = [...sheetData];
    updated.splice(rowIndex, 1);
    setSheetData(updated);
  };

  const handlePreview = (rowData) => {
    // alert(`Preview clicked for file: ${rowData.name}`);
    const fileUrl = "https://excel.officeapps.live.com/x/_layouts/XlFileHandler.aspx?WOPISrc=https://wopi.readthedocs.io/en/latest/_static/contoso.xlsx";
    window.open(`https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(fileUrl)}`);

  };

  const columns = useMemo(
    () => [
      {
        Header: "File ID",
        accessor: "age",
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
        Header: "Preview",
        width: 100,
        Cell: ({ row }) => (
          <FaEye
            style={{ cursor: "pointer", color: "#17a2b8" }}
            onClick={() => handlePreview(row.original)}
          />
        )
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

  document.title = "Sheet Table | Skote - React Admin & Dashboard";

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
