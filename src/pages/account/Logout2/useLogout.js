import { useAuthContext } from '@/common/context';
import { useEffect } from 'react';

export default function useLogout() {
	const { removeSession } = useAuthContext();

	useEffect(() => {
		removeSession();
	}, [removeSession]);
}
