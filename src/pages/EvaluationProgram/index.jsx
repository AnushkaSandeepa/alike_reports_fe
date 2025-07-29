import { lazy } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';

const GenerateReport = lazy(() => import('./ProgramReportTable'));

export default function EventReport() {
	return (
		<Routes>
			<Route path="/*" element={<Outlet />}>
				<Route index element={<GenerateReport />} />
				<Route path="all" element={<GenerateReport />} />
			</Route>
		</Routes>
	);
}