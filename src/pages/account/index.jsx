import DefaultLayout from '@/layouts/Default';
import { lazy } from 'react';
import { Route, Routes } from 'react-router-dom';

const Login = lazy(() => import('./Login'));
const Logout = lazy(() => import('./Logout'));
const Register = lazy(() => import('./Register'));
const RecoverPassword = lazy(() => import('./RecoverPassword'));
const ConfirmMail = lazy(() => import('./ConfirmMail'));
const LockScreen = lazy(() => import('./LockScreen'));
const LockScreen2 = lazy(() => import('./LockScreen2'));

export default function Account() {
	return (
		<Routes>
			<Route path="/*" element={<DefaultLayout />}>
				<Route index element={<Login />} />
				<Route path="login" element={<Login />} />
				<Route path="logout" element={<Logout />} />
				<Route path="register" element={<Register />} />
				<Route path="recover-password" element={<RecoverPassword />} />
				<Route path="confirm-mail" element={<ConfirmMail />} />
				<Route path="lock-screen" element={<LockScreen />} />
				<Route path="lock-screen2" element={<LockScreen2 />} />
			</Route>
		</Routes>
	);
}
