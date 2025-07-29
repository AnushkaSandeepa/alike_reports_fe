import { ThemeSettings, useAuthContext, useThemeContext } from '@/common';
import { lazy } from 'react';
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom';
import VerticalLayout from '@/layouts/Vertical';
import HorizontalLayout from '@/layouts/Horizontal';
import Root from './Root';
import { Dashboard } from '@/pages/dashboard';
import User from '@/pages/user';
import Vehicle from '@/pages/vehicle';
import SheetUpload from '@/pages/Uploading/EventSheetUpload';
import EventSheetsTable from '@/pages/SheetList/EventSheetsTable';
import EventReportGenerate from '@/pages/EvaluationEvent/EventReportTable';
import AnnualReportGenerate from '@/pages/EvaluationAnnual/AnnualReportTable';


/**
 * routes import
 */
// const Dashboard = lazy(() => import('../pages/dashboard'));
// const Apps = lazy(() => import('../pages/apps'));

// const Vehicle = lazy(() => import('../pages/vehicle'));

export default function ProtectedRoutes() {
	const { settings } = useThemeContext();
	const Layout =
		settings.layout.type == ThemeSettings.layout.type.vertical
			? VerticalLayout
			: HorizontalLayout;

	const { user } = useAuthContext();

	return user ? (
		<ReactRoutes>
			<Route path="/*" element={<Layout />}>
				<Route index element={<Root />} />
				<Route path="dashboard" element={<Dashboard />} />
				{/* <Route path="apps/*" element={<Apps />} /> */}
				
				<Route path="upload/*" element={<SheetUpload />} />
				<Route path="sheetslist/*" element={<EventSheetsTable />} />
				<Route path="event_reports/*" element={<EventReportGenerate />} />
				<Route path="annual_reports/*" element={<AnnualReportGenerate />} />

			     {/* have to remove */}
				<Route path="vehicle/*" element={<Vehicle />} />
				<Route path="user/*" element={<User />} />
				
			</Route>
		</ReactRoutes>
	) : (
		<Navigate to="/account/login" replace />
	);
}
