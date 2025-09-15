import { lazy } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';

const SheetUpload = lazy(() => import('./additional_evaluations'));

export default function SheetUpload() {
	return (
		<Routes>
			<Route path="/*" element={<Outlet />}>
				<Route index element={<SheetUpload />} />
				<Route path="all" element={<SheetUpload />} />
			</Route>
		</Routes>
	);
}