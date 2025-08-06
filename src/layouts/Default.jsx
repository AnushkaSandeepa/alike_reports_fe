import { PageLoader } from '@/components';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import bgimg from '../assets/images/DA-bg.jpg';
// import bgimg from '../assets/images/File/bg-video.mp4'; // Adjust the path to your actual image

const DefaultLayout = () => {
	return (
		<Suspense fallback={<PageLoader />}>
    		<div style={{ backgroundImage: `url(${bgimg})`, backgroundSize: 'cover', backgroundPosition: 'center', height:'100vh'}} >
				<Outlet />
			</div>
		</Suspense>
	);
};
export default DefaultLayout;
