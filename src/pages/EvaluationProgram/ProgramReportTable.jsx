import React, { useMemo, useState, useEffect } from "react";
import PropTypes from 'prop-types';
import EventReportTableContainer from "./ProgramReports";

import { FaEye } from "react-icons/fa";
import Modal from "react-modal";
import EventReportModal from "../../components/EventReportModal";

// Electron API from preload
// Ensure preload.js exposes: getReports: () => ipcRenderer.invoke("get-reports")

function EventReportGenerate() {
    const [modalIsOpen, setModalIsOpen] = useState(false);
    const [selectedRow, setSelectedRow] = useState(null);
    const [reports, setReports] = useState([]);
    const [loading, setLoading] = useState(true);

    // Fetch reports from Electron
    useEffect(() => {
        async function loadReports() {
            try {
                const data = await window.electronAPI.getReports();
                setReports(data);
            } catch (err) {
                console.error("Error loading reports:", err);
                setReports([]);
            } finally {
                setLoading(false);
            }
        }
        loadReports();
    }, []);

    const columns = useMemo(
        () => [
            {
                Header: 'Report ID',
                accessor: 'reportId',
            },
            {
                Header: 'Used Spreadsheet Name',
                accessor: 'spreadsheet_name',
            },
            {
                Header: 'Used Sheetsheet ID',
                accessor: 'spreadsheet_id',
            },
            {
                Header: 'Generated Date',
                accessor: 'generated_date',
                minWidth: 150,
                maxWidth: 250,
                Cell: ({ value }) => new Date(value).toLocaleString()
            },
            {
                Header: 'Program Type',
                accessor: 'program_type',
                width: 200,
            },
            {
                Header: 'Satisfaction Rate (%)',
                accessor: 'confidence_data.satisfaction_rate',
                width: 150,
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
                            data={selectedRow};
                        }}
                    />
                ),
            }
        ],
        []
    );

    document.title = "Data Tables | Skote - React Admin & Dashboard Template";

    return (
        <div className="page-content">
            <div className="container-fluid">
                {loading ? (
                    <p>Loading reports...</p>
                ) : (
                    <EventReportTableContainer
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
