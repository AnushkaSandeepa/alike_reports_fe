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

			<div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
				{/* background layer */}
				<div
					aria-hidden
					style={{
					position: 'absolute',
					inset: 0,
					background: `url(${bgImage}) center / cover no-repeat`,
					opacity: 0.5,          // <- only the image fades
					zIndex: 0,
					pointerEvents: 'none',  // clicks pass through
					}}
				/>
				{/* content layer */}
				<div style={{ position: 'relative', zIndex: 1}}>
					<Outlet />
				</div>
			</div>

		</Suspense>
	);
};

export default DefaultLayout;
