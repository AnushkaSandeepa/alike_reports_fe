import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthContext } from '@/common/context'; // Adjust this path to your actual file

export default function useLanding() {
	const [showContent, setShowContent] = useState(false);
	const [showSpinner, setShowSpinner] = useState(true);

	const { isAuthenticated } = useAuthContext(); // ✅ Get auth state
	const navigate = useNavigate();

	// Show content after a short delay
	useEffect(() => {
		const timer = setTimeout(() => {
			setShowContent(true);
		}, 800);

		return () => clearTimeout(timer);
	}, []);

	// Redirect after splash delay
	useEffect(() => {
		const timer = setTimeout(() => {
			if (isAuthenticated) {
				navigate('/dashboard'); // ✅ Authenticated → dashboard
			} else {
				navigate('/account/login'); // ❌ Not authenticated → login
			}
		}, 4000);

		return () => clearTimeout(timer);
	}, [isAuthenticated, navigate]);

	return { showContent, showSpinner };
}
