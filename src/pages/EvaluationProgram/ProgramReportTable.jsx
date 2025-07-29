// src/components/filter.
import React, { useMemo } from "react";
import PropTypes from 'prop-types';
import EventReportTableContainer from "./ProgramReports";

import { FaEye } from "react-icons/fa"; // You can install with: npm install react-icons
import { useState } from "react";
import Modal from "react-modal"; // npm install react-modal
import EventReportModal from "../../components/EventReportModal"; // Assuming you have a modal component for viewing reports


//import components

function EventReportGenerate() {

    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);

    const columns = useMemo(
            () => [
                {
                Header: 'Report ID',
                accessor: 'age',
                },
                {
                Header: 'Generated date',
                accessor: 'startDate',
                minWidth: 150,      // Minimum width (won't go smaller than 150px)
                maxWidth: 250,      // Maximum width (won't go wider than 250px)
                },
                {
                Header: 'Program Name',
                accessor: 'name',
                width: 200,         // You can adjust this to fit your layout
                },
                {
                Header: 'Used File Name',
                accessor: 'office',
                width: 200,         // You can adjust this to fit your layout
                },
                {
                Header: 'View',
                width: 100,
                Cell: ({ row }) => (
                    <FaEye
                    style={{ cursor: 'pointer', color: '#007bff' }}
                    onClick={() => {
                        setSelectedRow(row.original);
                        setModalIsOpen(true);
                    }}
                    />
                ),
                }
            ],
            []
        );

    const data = [
        {
            "name": "Jennifer Chang",
            "position": "Regional Director",
            "age": 28,
            "office": "Singapore",
            "startDate": "2010/11/14",
            "salary": "$357,650"
        },
        {
            "name": "Gavin Joyce",
            "position": "Developer",
            "age": 42,
            "office": "Edinburgh",
            "startDate": "2010/12/22",
            "salary": "$92,575"
        },
        {
            "name": "Angelica Ramos",
            "position": "Chief Executive Officer (CEO)",
            "age": 47,
            "office": "London",
            "startDate": "2009/10/09",
            "salary": "$1,200,000"
        },
        {
            "name": "Doris Wilder",
            "position": "Sales Assistant",
            "age": 23,
            "office": "Sidney",
            "startDate": "2010/09/20",
            "salary": "$85,600"
        },
        {
            "name": "Caesar Vance",
            "position": "Pre-Sales Support",
            "age": 21,
            "office": "New York",
            "startDate": "2011/12/12",
            "salary": "$106,450"
        },
        {
            "name": "Yuri Berry",
            "position": "Chief Marketing Officer (CMO)",
            "age": 40,
            "office": "New York",
            "startDate": "2009/06/25",
            "salary": "$675,000"
        },
        {
            "name": "Jenette Caldwell",
            "position": "Development Lead",
            "age": 30,
            "office": "New York",
            "startDate": "2011/09/03",
            "salary": "$345,000"
        },
        {
            "name": "Dai Rios",
            "position": "Personnel Lead",
            "age": 35,
            "office": "Edinburgh",
            "startDate": "2012/09/26",
            "salary": "$217,500"
        },
        {
            "name": "Bradley Greer",
            "position": "Software Engineer",
            "age": 41,
            "office": "London",
            "startDate": "2012/10/13",
            "salary": "$132,000"
        },
        {
            "name": "Gloria Little",
            "position": "Systems Administrator",
            "age": 59,
            "office": "New York",
            "startDate": "2009/04/10",
            "salary": "$237,500"
        }
    ];

    //meta title
    document.title = "Data Tables | Skote - React Admin & Dashboard Template";

    return (
        <div className="page-content">
            <div className="container-fluid">
                {/* <Table columns={columns} data={data} /> */}
                <EventReportTableContainer
                    columns={columns}
                    data={data}
                    isGlobalFilter={true}
                    isAddOptions={false}
                    customPageSize={8}
                    className="custom-header-css"
                />
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