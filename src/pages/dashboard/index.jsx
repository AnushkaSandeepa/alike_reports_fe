import React from 'react';
import { BsFillCarFrontFill } from 'react-icons/bs';
import { GiAutoRepair, GiPauseButton } from 'react-icons/gi';
import { Card, CardBody, CardTitle, Col, Container, Row } from 'reactstrap';
import { Button, Header, Stack, Table } from 'rsuite';
import CustomerSearchBox from '../SheetList/CustomerSearchBox';
import InfoCard from '../../components/InfoCard';
import { Link } from 'react-router-dom';
import { tableHeader } from '../../resources/custom-styles';
import { FiSquare } from 'react-icons/fi';
import { CiPause1 } from 'react-icons/ci';
import { IoPauseCircleSharp } from "react-icons/io5";
import { BiSolidCarMechanic } from "react-icons/bi";
import { PageBreadcrumb } from '@/components';
import LineBar from './linebarchart';

const Dashboard = () => {
	return (
		<React.Fragment>
			<PageBreadcrumb title="Dashboard" />

			<Container className="py-4">
				<Row>
					<Col>
						<Card
							style={{
								background:
									'linear-gradient(94deg, #4a71c6ff -36.87%, #4AC6C6 -22.86%, #153986 150.33%)',
							}}
						>
							<CardBody>
								<Row className="">
									<Col className=" ">
										<InfoCard
											title={
												<span
													className="info-card-title"
													style={{ fontSize: '24px', fontWeight: '700' }}
												>
													Completed <br />Events
												</span>
											}
											body={
												<span
													className="info-card-body"
													style={{
														fontSize: '60px',
														fontWeight: '700',
														color: '#ACE8E6',
													}}
												>
													100
												</span>
											}
											icon={<BiSolidCarMechanic color="#064d5f" />}
										/>
									</Col>
									<Col className="">
										<InfoCard
											title={
												<span
													className="info-card-title"
													style={{ fontSize: '24px', fontWeight: '700' }}
												>
													Completed <br />Workshops
												</span>
											}
											body={
												<span
													className="info-card-body"
													style={{
														fontSize: '60px',
														fontWeight: '700',
														color: '#ACE8E6',
													}}
												>
													85
												</span>
											}
											icon={<IoPauseCircleSharp color="#064d5f" />}
										/>
									</Col>
								</Row>
							</CardBody>
						</Card>
					</Col>
				</Row>
				
				
				<Card>
                <CardBody>
                  <CardTitle>Facebook Reach</CardTitle>
                  <div id="mix-line-bar" className="e-chart">
                    <LineBar />
                  </div>
                </CardBody>
              </Card>
			</Container>
		</React.Fragment>
	);
};

export { Dashboard };
