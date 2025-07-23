import { lazy } from 'react';
import { Outlet, Route, Routes } from 'react-router-dom';
import VehicleFound from './VehicleFound';

const VehicleList = lazy(() => import('./ListVehicle'));
const VehicleForm = lazy(() => import('./VehicleForm'));
// const VehicleFound = lazy(() => import('./VehicleFound'));
const VehicleDetail = lazy(() => import('./VehicleDetail'));<div className=""></div>

export default function Vehicle() {
	return (
		<Routes>
			<Route path="/*" element={<Outlet />}>
				<Route index element={<VehicleList />} />
				<Route path="all" element={<VehicleList />} />
				<Route path="vehicleform" element={<VehicleForm />} />
				<Route path="vehicleid1" element={<VehicleDetail />} />
				<Route path="vehicle_found" element={<VehicleFound />} />

			</Route>
		</Routes>
	);
}
