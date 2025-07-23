const MENU_ITEMS = [
	{
		key: 'dashboard',
		label: 'Dashboard',
		isTitle: false,
		icon: 'uil-apps',
		url: '/dashboard',
	},
	{
		key: 'workOrders',
		label: 'Sheet Uploading',
		isTitle: false,
		icon: 'uil-upload',
		url: '/upload',
	},
	{
		key: 'eventSheets',
		label: 'Events Sheets',
		isTitle: false,
		icon: 'uil-dollar-sign',
		url: '/sheetslist',
	},
	{
		key: 'eventSheets',
		label: 'Events Evaluation',
		isTitle: false,
		icon: 'uil-dollar-sign',
		url: '/event_reports',
	},
	{
		key: 'inventory',
		label: 'Anual Evaluation',
		isTitle: false,
		icon: 'uil-cube',
		url: '/inventory',
	},
	{
		key: 'users',
		label: 'Users',
		isTitle: false,
		icon: 'uil-user-plus',
		url: '/user',
	},
	
];

const HORIZONTAL_MENU_ITEMS = [
	{
		key: 'dashboards',
		icon: 'uil-dashboard',
		label: 'Dashboards',
		isTitle: true,
		children: [
			{
				key: 'ds-analytics',
				label: 'Analytics',
				url: '/dashboard/analytics',
				parentKey: 'dashboards',
			},
			{
				key: 'ds-ecommerce',
				label: 'Ecommerce',
				url: '/dashboard/ecommerce',
				parentKey: 'dashboards',
			},
			{
				key: 'ds-project',
				label: 'Projects',
				url: '/dashboard/project',
				parentKey: 'dashboards',
			},
			{
				key: 'ds-crm',
				label: 'CRM',
				url: '/dashboard/crm',
				parentKey: 'dashboards',
			},
			{
				key: 'ds-ewallet',
				label: 'E-Wallet',
				url: '/dashboard/e-wallet',
				parentKey: 'dashboards',
			},
		],
	},
	{
		key: 'apps',
		icon: 'uil-apps',
		label: 'Apps',
		isTitle: true,
		children: [
			{
				key: 'apps-calendar',
				label: 'Calendar',
				url: '/apps/calendar',
				parentKey: 'apps',
			},
			{
				key: 'apps-chat',
				label: 'Chat',
				url: '/apps/chat',
				parentKey: 'apps',
			},
			{
				key: 'apps-crm',
				label: 'CRM',
				parentKey: 'apps',
				children: [
					{
						key: 'crm-projects',
						label: 'Projects',
						url: '/apps/crm/projects',
						parentKey: 'apps-crm',
					},
					{
						key: 'crm-orders',
						label: 'Orders List',
						url: '/apps/crm/orders',
						parentKey: 'apps-crm',
					},
					{
						key: 'crm-clients',
						label: 'Clients',
						url: '/apps/crm/clients',
						parentKey: 'apps-crm',
					},
					{
						key: 'crm-management',
						label: 'Management',
						url: '/apps/crm/management',
						parentKey: 'apps-crm',
					},
				],
			},
			{
				key: 'apps-ecommerce',
				label: 'Ecommerce',
				parentKey: 'apps',
				children: [
					{
						key: 'ecommerce-products',
						label: 'Products',
						url: '/apps/ecommerce/products',
						parentKey: 'apps-ecommerce',
					},
					{
						key: 'ecommerce-details',
						label: 'Products Details',
						url: '/apps/ecommerce/product-details',
						parentKey: 'apps-ecommerce',
					},
					{
						key: 'ecommerce-orders',
						label: 'Orders',
						url: '/apps/ecommerce/orders',
						parentKey: 'apps-ecommerce',
					},
					{
						key: 'ecommerce-order-details',
						label: 'Order Details',
						url: '/apps/ecommerce/order-details',
						parentKey: 'apps-ecommerce',
					},
					{
						key: 'ecommerce-customers',
						label: 'Customers',
						url: '/apps/ecommerce/customers',
						parentKey: 'apps-ecommerce',
					},
					{
						key: 'ecommerce-shopping-cart',
						label: 'Shopping Cart',
						url: '/apps/ecommerce/shopping-cart',
						parentKey: 'apps-ecommerce',
					},
					{
						key: 'ecommerce-checkout',
						label: 'Checkout',
						url: '/apps/ecommerce/checkout',
						parentKey: 'apps-ecommerce',
					},
					{
						key: 'ecommerce-sellers',
						label: 'Sellers',
						url: '/apps/ecommerce/sellers',
						parentKey: 'apps-ecommerce',
					},
				],
			},
			{
				key: 'apps-email',
				label: 'Email',
				parentKey: 'apps',
				children: [
					{
						key: 'email-inbox',
						label: 'Inbox',
						url: '/apps/email/inbox',
						parentKey: 'apps-email',
					},
					{
						key: 'email-read-email',
						label: 'Read Email',
						url: '/apps/email/read',
						parentKey: 'apps-email',
					},
				],
			},
			{
				key: 'apps-projects',
				label: 'Projects',
				parentKey: 'apps',
				children: [
					{
						key: 'project-list',
						label: 'List',
						url: '/apps/projects/list',
						parentKey: 'apps-projects',
					},
					{
						key: 'project-details',
						label: 'Details',
						url: '/apps/projects/details',
						parentKey: 'apps-projects',
					},
					{
						key: 'project-gantt',
						label: 'Gantt',
						url: '/apps/projects/gantt',
						parentKey: 'apps-projects',
					},
					{
						key: 'project-create-project',
						label: 'Create Project',
						url: '/apps/projects/create',
						parentKey: 'apps-projects',
					},
				],
			},
			{
				key: 'apps-social',
				label: 'Social Feed',
				url: '/apps/social',
				parentKey: 'apps',
			},
			{
				key: 'apps-tasks',
				label: 'Tasks',
				parentKey: 'apps',
				children: [
					{
						key: 'task-list',
						label: 'List',
						url: '/apps/tasks/list',
						parentKey: 'apps-tasks',
					},
					{
						key: 'task-details',
						label: 'Details',
						url: '/apps/tasks/details',
						parentKey: 'apps-tasks',
					},
					{
						key: 'task-kanban',
						label: 'Kanban Board',
						url: '/apps/tasks/kanban',
						parentKey: 'apps-tasks',
					},
				],
			},
			{
				key: 'apps-file-manager',
				label: 'File Manager',
				url: '/apps/file',
				parentKey: 'apps',
			},
		],
	},
];

export { MENU_ITEMS, HORIZONTAL_MENU_ITEMS };
