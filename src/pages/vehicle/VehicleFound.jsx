import React, { useContext } from 'react';
import {
	Row,
	Col,
	Card,
	Accordion,
	Button,
	Collapse,
	useAccordionButton,
	AccordionContext,
} from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import classNames from 'classnames';
import { useToggle } from '@/hooks';
import { PageBreadcrumb } from '@/components';
import TwoLineItem from '@/components/TwoLineItem';
import { useState } from 'react';
import Select from 'react-select';

const CustomToggle = ({ children, eventKey, containerClass, linkClass, callback }) => {
	const { activeEventKey } = useContext(AccordionContext);

	const decoratedOnClick = useAccordionButton(eventKey, () => callback && callback(eventKey));

	const isCurrentEventKey = activeEventKey === eventKey;

	return (
		<h5 className={containerClass}>
			<Link
				to=""
				className={classNames(linkClass, {
					collapsed: !isCurrentEventKey,
				})}
				onClick={decoratedOnClick}
			>
				{children}
			</Link>
		</h5>
	);
};

const CustomAccordion2 = ({ item, index }) => {
	const navigate = useNavigate();

	return (
		<Card className="mb-0">
			<Card.Header>
				<CustomToggle
					eventKey={String(index)}
					containerClass="m-0"
					linkClass="custom-accordion-title d-block py-1"
				>
					Vehicle Details
					<i className="mdi mdi-chevron-down accordion-arrow"></i>
				</CustomToggle>
			</Card.Header>
			<Accordion.Collapse eventKey={String(index)}>
				<div>
					<Card.Body>
						<Row>
							<Col md={4} sm={6} className="pb-4">
								<TwoLineItem
									title={'Vehicle Number'}
									titleStyle={{ fontWeight: 700, color: '#374957' }}
									subtitle={'BIV 3239'}
								/>
							</Col>
							<Col md={4} sm={6} className="pb-4">
								<TwoLineItem
									title={'Make'}
									titleStyle={{ fontWeight: 700, color: '#374957' }}
									subtitle={'BMW'}
								/>
							</Col>
							<Col md={4} sm={6} className="pb-4">
								<TwoLineItem
									title={'Model'}
									titleStyle={{ fontWeight: 700, color: '#374957' }}
									subtitle={'M1'}
								/>
							</Col>
							<Col md={4} sm={6} className="pb-4">
								<TwoLineItem
									title={'Manufactured Year'}
									titleStyle={{ fontWeight: 700, color: '#374957' }}
									subtitle={'2018'}
								/>
							</Col>
							<Col md={4} sm={6} className="pb-4">
								<TwoLineItem
									title={'Chassis Number'}
									titleStyle={{ fontWeight: 700, color: '#374957' }}
									subtitle={'452525446642'}
								/>
							</Col>
							<Col md={4} sm={6} className="pb-4">
								<TwoLineItem
									title={'Color Code'}
									titleStyle={{ fontWeight: 700, color: '#374957' }}
									subtitle={'#83374'}
								/>
							</Col>
						</Row>
					</Card.Body>
					<div className="" style={{ display: 'flex', justifyContent: 'flex-end' }}>
						<button
							className="btn "
							style={{
								marginRight: '10px',
								color: '#064D5F',
								background: 'none',
								border: 'solid 1px #064D5F',
							}}
							onClick={() => {
								navigate('/vehicle/vehicleid1');
							}}
						>
							View Full Details
						</button>
					</div>
				</div>
			</Accordion.Collapse>
		</Card>
	);
};

const VehicleFound = () => {
	const navigate = useNavigate();
	const routineServiceOptions = [
		{ value: 'body_repair', label: 'Body Repair' },
		{ value: 'routine_service', label: 'Routine Service' },
		{ value: 'adhoc_service', label: 'Adhoc Services' },
		{ value: 'break_down_service', label: 'Break Down Services' },
	];

	const [selectedOptions, setSelectedOptions] = useState([]);

	const handleSelectChange = (selectedValues) => {
		setSelectedOptions(selectedValues);
	};

	const handleNavigateWorkOrderForm = () => {
		navigate('/workorder/workorderform');
	};

	return (
		<>
			<div className="m-5">
				<div>
					<div className="pb-3">
						<h3>Vehicle Found (#BIV-3239)</h3>
					</div>
					<div>
						<Card>
							<Card.Body>
								<Accordion
									defaultActiveKey="0"
									id="accordion"
									className="custom-accordion"
								>
									<CustomAccordion2 />
								</Accordion>

								<Row className="pt-5">
									<Col md={6}>
										<label className="found-title">Registered to :</label>
										<br />
										<label className="profile-label d-flex align-items-center">
											<span className="profile-icon">S</span>
											<span className="found-label">Suhail Summon</span>
										</label>
									</Col>
									<Col md={6} className="d-flex justify-content-end">
										<label className="found-title">Last Visited :</label>
										<div className="found-label">
											&nbsp;&nbsp;&nbsp;01.18.2024
										</div>
									</Col>
									<Col md={12} className="pt-4">
										<label className="found-title">Problem Description</label>
										<div className="pt-2">
											<textarea
												name="note"
												className="form-Input-bmw"
												placeholder="Type here..."
												style={{ height: '200px', width: '100%' }}
											/>
										</div>
									</Col>
									<Col md={12} className="pt-4">
										<label className="found-title">
											Service Type Radio Button
										</label>
										<div className="pt-3 d-flex align-items-center">
											<div
												className="form-check "
												style={{ paddingRight: '40px' }}
											>
												<input
													className="form-check-input"
													type="radio"
													name="flexRadioDefault"
													id="body_repair"
												/>
												<label
													className="form-radio-label"
													htmlFor="body_repair"
												>
													Body Repair
												</label>
											</div>
											<div
												className="form-check "
												style={{ paddingRight: '40px' }}
											>
												<input
													className="form-check-input"
													type="radio"
													name="flexRadioDefault"
													id="routin_service"
												/>
												<label
													className="form-radio-label"
													htmlFor="routin_service"
												>
													Routine Service
												</label>
											</div>
											<div
												className="form-check "
												style={{ paddingRight: '40px' }}
											>
												<input
													className="form-check-input"
													type="radio"
													name="flexRadioDefault"
													id="adhoc_service"
												/>
												<label
													className="form-radio-label"
													htmlFor="adhoc_service"
												>
													Adhoc Services
												</label>
											</div>
											<div
												className="form-check"
												style={{ paddingRight: '40px' }}
											>
												<input
													className="form-check-input"
													type="radio"
													name="flexRadioDefault"
													id="breake_down_service"
												/>
												<label
													className="form-radio-label"
													htmlFor="breake_down_service"
												>
													Break Down Services
												</label>
											</div>
										</div>
									</Col>
									<Col md={12} className="pt-4">
										<label className="found-title pb-3">
											Service Type Dropdown
										</label>
										<Select
											isMulti
											options={routineServiceOptions}
											value={selectedOptions}
											onChange={handleSelectChange}
										/>
									</Col>
								</Row>
							</Card.Body>
						</Card>
						<div
							className="pt-4 pb-4"
							style={{ display: 'flex', justifyContent: 'flex-end' }}
						>
							<button
								className="btn btn-primary"
								style={{ marginRight: '10px', backgroundColor: '#064D5F' }}
								onClick={handleNavigateWorkOrderForm}
							>
								Create Work Order
							</button>
						</div>
					</div>
				</div>
			</div>
		</>
	);
};

export default VehicleFound;
