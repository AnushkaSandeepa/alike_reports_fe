import { lazy } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import Maintenance from './MProcess';


export default function Sheets() {
	return (
		<Routes>
			<Route path="/*" element={<Outlet />}>
				<Route index element={<Maintenance />} />
				<Route path="all" element={<Maintenance />} />
			</Route>
		</Routes>
	);
}