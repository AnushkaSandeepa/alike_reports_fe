import { ThemeSettings, useAuthContext, useThemeContext } from '@/common';
import { lazy } from 'react';
import { Navigate, Route, Routes as ReactRoutes } from 'react-router-dom';
import VerticalLayout from '@/layouts/Vertical';
import HorizontalLayout from '@/layouts/Horizontal';
import Root from './Root';
import { Dashboard } from '@/pages/dashboard';
import SheetUpload from '@/pages/Uploading/SpreadsheetUpload';
import EventSheetsTable from '@/pages/SheetList/SpreadsheetsTable';
import EventReportGenerate from '@/pages/EvaluationProgram/ProgramReportTable';
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

			     
				
			</Route>
		</ReactRoutes>
	) : (
		<Navigate to="./landing" replace />
	);
}
