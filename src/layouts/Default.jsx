import { PageLoader } from '@/components';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import bgVideo from '../assets/images/File/bg-video.mp4'; // Ensure this path is correct

const DefaultLayout = () => {
	return (
		<Suspense fallback={<PageLoader />}>
			<div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
				{/* Background Video */}
				<video
					autoPlay
					loop
					muted
					playsInline
					style={{
						position: 'absolute',
						top: 0,
						left: 0,
						width: '100%',
						height: '100%',
						objectFit: 'cover',
						zIndex: -1,
						opacity: 0.6, // You can adjust opacity here
					}}
				>
					<source src={bgVideo} type="video/mp4" />
					Your browser does not support the video tag.
				</video>

				{/* Page Content */}
				<div style={{ position: 'relative', zIndex: 1 }}>
					<Outlet />
				</div>
			</div>
		</Suspense>
	);
};

export default DefaultLayout;
