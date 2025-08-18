// Inside your ViewReportModal component, after `if (!data) return null;`

if (data.program_type !== "workshop") {
    return (
        <Modal isOpen={isOpen} onRequestClose={onClose}>
            <div style={{ padding: "20px" }}>
                <h5>No workshop data to display</h5>
                <button onClick={onClose}>Close</button>
            </div>
        </Modal>
    );
}

// Extract values from data.confidence_data
const pre = data.confidence_data?.pre_percent ?? 0;
const post = data.confidence_data?.post_percent ?? 0;
const increase = data.confidence_data?.increase_percent ?? 0;
const satisfaction = data.confidence_data?.satisfaction_rate ?? 0;

// Prepare ApexCharts series dynamically
const series = [
    {
        name: "Confidence Level",
        data: [pre, post]
    }
];

// Prepare ApexCharts options
const chartOptions = {
    chart: {
        type: 'bar',
        height: 350,
        toolbar: { show: false }
    },
    plotOptions: {
        bar: {
            horizontal: false,
            columnWidth: '50%',
            endingShape: 'rounded',
            distributed: true
        }
    },
    dataLabels: {
        enabled: true,
        formatter: (val) => `${val}%`
    },
    xaxis: {
        categories: ['Pre-Workshop', 'Post-Workshop'],
    },
    yaxis: {
        max: 100,
        title: { text: 'Confidence Level (%)' }
    },
    annotations: {
    yaxis: [{
        y: post,
        borderColor: '#008FFB',
        label: {
        text: `+${increase.toFixed(1)}% increase`,
        style: { background: '#008FFB', color: "#fff" }
        }
    }]
    },   

    colors: ['#FF4560', '#00E396']
};
