import { PageLoader } from '@/components';
import { Suspense } from 'react';
import { Outlet } from 'react-router-dom';
import bgImage from '../assets/images/File/background-bg.jpg'; 

const DefaultLayout = () => {
	return (
		<Suspense fallback={<PageLoader />}>
			{/* <div style={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
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

				<div style={{ position: 'relative', zIndex: 1 }}>
					<Outlet />
				</div>
			</div> */}

			<div
				style={{
					position: 'relative',
					minHeight: '100vh',
					overflow: 'hidden',
    				backgroundImage: `linear-gradient(rgba(255, 255, 255, 0.4), rgba(15, 15, 15, 0.4)), url(${bgImage})`,
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					backgroundRepeat: 'no-repeat',
					//opacity: 0.6, 
				}}
				>
				<div style={{ position: 'relative', zIndex: 1, paddingTop: '6%' }}>
					<Outlet />
				</div>
				</div>
		</Suspense>
	);
};

export default DefaultLayout;
