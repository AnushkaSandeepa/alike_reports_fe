import Hero from './Hero';
import { useAccountLayout } from '@/components/BGCircles';
import { PageBreadcrumb } from '@/components';

const LandingPage = () => {
	useAccountLayout();

	return (
		<>
			<PageBreadcrumb title="Landing" />
			{/* hero */}
			<Hero />

			
		</>
	);
};

export { LandingPage };
