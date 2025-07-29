import { lazy } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';

const AnnualReport = lazy(() => import('./AnnualReportTable'));

export default function AnnualReport() {
	return (
		<Routes>
			<Route path="/*" element={<Outlet />}>
				<Route index element={<AnnualReport />} />
				<Route path="all" element={<AnnualReport />} />
			</Route>
		</Routes>
	);
}