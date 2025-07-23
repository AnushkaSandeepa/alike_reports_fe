import SimpleBar from 'simplebar-react';
import { Offcanvas, Row } from 'react-bootstrap';
import useThemeCustomizer from '@/components/ThemeCustomizer/useThemeCustomizer';
import { ThemeSettings, useThemeContext } from '@/common';
import { ThemeCustomizer } from '@/components';

const RightSideBar = () => {
	const { updateSettings, settings } = useThemeContext();

	const { reset } = useThemeCustomizer();

	const isOpenRightSideBar = settings.rightSidebar;

	/**
	 * Toggles the right sidebar
	 */
	const handleRightSideBar = () => {
		updateSettings({ rightSidebar: ThemeSettings.rightSidebar.hidden });
	};

	return (
		<>
			<Offcanvas
				show={isOpenRightSideBar}
				onHide={handleRightSideBar}
				placement="end"
				id="theme-settings-offcanvas"
			>
				<Offcanvas.Header
					className="d-flex align-items-center bg-primary p-3"
					closeVariant="white"
					closeButton
				>
					<h5 className="text-white m-0">Theme Settings</h5>
				</Offcanvas.Header>

				<Offcanvas.Body className="p-0">
					<SimpleBar scrollbarMaxSize={320} className="h-100">
						<ThemeCustomizer />
					</SimpleBar>
				</Offcanvas.Body>

				<div className="offcanvas-footer border-top p-3 text-center">
					<Row>
						<div className="col-6">
							<button
								type="button"
								className="btn btn-light w-100"
								id="reset-layout"
								onClick={reset}
							>
								Reset
							</button>
						</div>
						<div className="col-6">
							<a
								href="https://themes.getbootstrap.com/product/hyper-responsive-admin-dashboard-template/"
								target="_blank"
								role="button"
								className="btn btn-primary w-100"
							>
								Buy Now
							</a>
						</div>
					</Row>
				</div>
			</Offcanvas>
		</>
	);
};

export default RightSideBar;
