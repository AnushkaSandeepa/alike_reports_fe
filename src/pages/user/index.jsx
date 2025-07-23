import { lazy } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';

const UserTable = lazy(() => import('./TableUser'));
const NewUser = lazy(() => import('./NewUser'));

export default function User() {
	return (
		<Routes>
			<Route path="/*" element={<Outlet />}>
				<Route index element={<UserTable />} />
				<Route path="all" element={<UserTable />} />
				<Route path="new_user" element={<NewUser />} />
			</Route>
		</Routes>
	);
}