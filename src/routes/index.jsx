import { Route, Routes as ReactRoutes } from 'react-router-dom';
import ProtectedRoutes from './ProtectedRoutes';
import ErrorPages from '@/pages/error';
import Account from '@/pages/account';
import LandingPage from '@/pages/Landing';
import ErrorPageNotFound from '@/pages/error/PageNotFound';
import SheetUpload from '@/pages/Uploading/SpreadsheetUpload';
// import Vehicle from '@/pages/vehicle/ListVehicle';

export default function AppRoutes() {
	return (
		<ReactRoutes>
			<Route path="account/*" element={<Account />} />
			<Route path="/*" element={<ProtectedRoutes />} />
			<Route path="/error/*" element={<ErrorPages />} />
			<Route path="/landing" element={<LandingPage />} />
			<Route path="*" element={<ErrorPageNotFound />} />
		</ReactRoutes>
	);
}
