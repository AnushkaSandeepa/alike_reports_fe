const MENU_ITEMS = [
	{
	key: 'dashboard',
	label: 'Dashboard',
	icon: 'fas fa-home',   // Font Awesome class instead of Unicons
	url: '/dashboard',
	},
	{
	key: 'workOrders',
	label: 'Spreadsheet Uploading',
	icon: 'fas fa-upload',
	url: '/upload',
	},
	{
	key: 'eventSheets',
	label: 'Spreadsheets',
	icon: 'fas fa-file-alt',
	url: '/sheetslist',
	},
	{
	key: 'eventReports',
	label: 'Program Evaluation',
	icon: 'fas fa-chart-line',
	url: '/event_reports',
	},
	{
	key: 'annualReports',
	label: 'Annual Evaluation',
	icon: 'fas fa-calendar-alt',
	url: '/annual_reports',
	}

];

const HORIZONTAL_MENU_ITEMS = [
  {
    key: 'dashboards',
    icon: 'fas fa-home',
    label: 'Dashboards',
    isTitle: false, // optional
    children: [
      {
        key: 'dashboard-main',
        label: 'Dashboard',
        icon: 'fas fa-home',
        url: '/dashboard',
        parentKey: 'dashboards',
      },
      {
        key: 'workOrders',
        label: 'Spreadsheet Uploading',
        icon: 'fas fa-upload',
        url: '/upload',
        parentKey: 'dashboards',
      },
      {
        key: 'eventSheets',
        label: 'Spreadsheets',
        icon: 'fas fa-file-alt',
        url: '/sheetslist',
        parentKey: 'dashboards',
      },
      {
        key: 'eventReports',
        label: 'Program Evaluation',
        icon: 'fas fa-chart-line',
        url: '/event_reports',
        parentKey: 'dashboards',
      },
      {
        key: 'annualReports',
        label: 'Annual Evaluation',
        icon: 'fas fa-calendar-alt',
        url: '/annual_reports',
        parentKey: 'dashboards',
      }
    ],
  },
];


export { MENU_ITEMS, HORIZONTAL_MENU_ITEMS };
