import { lazy } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';

const SheetListTables = lazy(() => import('./SpreadsheetsTable'));

export default function Sheets() {
	return (
		<Routes>
			<Route path="/*" element={<Outlet />}>
				<Route index element={<SheetListTables />} />
				<Route path="all" element={<SheetListTables />} />
			</Route>
		</Routes>
	);
}