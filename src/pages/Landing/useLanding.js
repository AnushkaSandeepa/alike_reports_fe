import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function useLanding() {
	const [showContent, setShowContent] = useState(false);

	useEffect(() => {
		const timer = setTimeout(() => {
		setShowContent(true);
		}, 800);

		return () => clearTimeout(timer);
	}, []);

	const [showSpinner, setShowSpinner] = useState(true);
	const navigate = useNavigate();

	useEffect(() => {
		setTimeout(() => {
		  navigate('/account/loginnew');
		}, 4000); 
	}, []);

	return { showContent, showSpinner };
}

