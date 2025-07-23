import React from 'react';
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Row } from 'reactstrap';
import { Button, Form, Grid, Panel, SelectPicker, Stack } from 'rsuite';

export const VehicleForm = ({ collapsible = false, header, props }) => {
	return (
		<Card>
			<CardBody>
			<Panel header={header}  collapsible={collapsible} {...props} >
			<Form>
				<label className='detail-card-title pb-3'>Vehicle Details</label>
				<Stack className="mb-3" wrap spacing={32} alignItems="stretch">
					<Form.Group>
						<Form.ControlLabel>Vehicle Number*</Form.ControlLabel>
						<Form.Control name="vehicle_no" placeholder="Enter vehicle number" />
					</Form.Group>
					<Form.Group>
						<Form.ControlLabel>Manufactured Year*</Form.ControlLabel>
						<Form.Control name="engine_no" placeholder="Select Year" />
					</Form.Group>
					<Form.Group>
						<Form.ControlLabel>Chassis Number*</Form.ControlLabel>
						<Form.Control name="chassis_no" placeholder="Enter chassis number" />
					</Form.Group>
					<Form.Group>
						<Form.ControlLabel>Make*</Form.ControlLabel>
						<Form.Control name="make" placeholder="Enter make" />
					</Form.Group>
					<Form.Group>
						<Form.ControlLabel>Model*</Form.ControlLabel>
						<Form.Control name="model" placeholder="Enter vehicle model" />
					</Form.Group>
					
					{/* <Form.Group>
						<Form.ControlLabel>Mileage</Form.ControlLabel>
						<Stack spacing={16}>
							<Form.Control
								name="mileage_unit"
								accepter={SelectPicker}
								cleanable={false}
								searchable={false}
								data={['KM', 'Miles'].map((item) => ({
									value: item,
									label: item,
								}))}
							/>
							<Form.Control
								name="milage_amount"
								placeholder="Enter mileage"
								type="number"
							/>
						</Stack>
					</Form.Group> */}
					
					<Form.Group>
						<Form.ControlLabel>Color Code*</Form.ControlLabel>
						<Form.Control name="color_code" placeholder="Enter color code" />
					</Form.Group>
				</Stack>

				<label className='detail-card-title pb-3'>Owner Details</label>
				<Row className="mb-3" >
					<Col md={4}>
						<Form.Group>
							<Form.ControlLabel>Name*</Form.ControlLabel>
							<Form.Control name="vehicle_no" placeholder="Enter vehicle number" />
						</Form.Group>
					</Col>
					<Col md={4}>
        				<Form.Group>
							<Form.ControlLabel>NIC</Form.ControlLabel>
							<Form.Control name="engine_no" placeholder="Select Year" />
						</Form.Group>
					</Col>
					<Col md={4}>
        				<Form.Group>
							<Form.ControlLabel>Gender</Form.ControlLabel>
							<Form.Control name="chassis_no" placeholder="Enter chassis number" />
						</Form.Group>
					</Col>
					<Col md={4}>
        				<Form.Group>
							<Form.ControlLabel>E-mail</Form.ControlLabel>
							<Form.Control name="make" placeholder="Enter make" />
						</Form.Group>
					</Col>
					<Col md={4}>
        				<Form.Group>
							<Form.ControlLabel>Mobile Number*</Form.ControlLabel>
							<Form.Control name="model" placeholder="Enter vehicle model" />
						</Form.Group>
					</Col>
					<Col md={4}>
						<Form.Group>
							<Form.ControlLabel>Home Telephone</Form.ControlLabel>
							<Form.Control name="color_code" placeholder="Enter color code" />
						</Form.Group>
					</Col>
					{/* <div className='pt-2 pb-2'><hr/></div><br/> */}
					<Col md={8}>
						<Form.Group>
							<Form.ControlLabel>Address</Form.ControlLabel>
							<Form.Control name="model" placeholder="Address" />
						</Form.Group>
					</Col>
				</Row>
			</Form>
		</Panel>
			</CardBody>
		</Card>
		
	);
};

export default function Vehicle() {
	return (
		<div className="m-5">
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
				<div>
					<h3>Vehicle ID #100</h3>
				</div>
				
			</div>
			<div style={{ width:"100%" }}>		
			<Breadcrumb>
					<BreadcrumbItem>Dashboard</BreadcrumbItem>
					<BreadcrumbItem>All Vehicles</BreadcrumbItem>
					<BreadcrumbItem>Vehicle</BreadcrumbItem>
				</Breadcrumb>
				<VehicleForm />
					
				</div>
		</div>
	);
}

{/* <Form.Group>
						<Form.ControlLabel>Mileage</Form.ControlLabel>
						<Stack spacing={16}>
							<Form.Control
								name="mileage_unit"
								accepter={SelectPicker}
								cleanable={false}
								searchable={false}
								data={['KM', 'Miles'].map((item) => ({
									value: item,
									label: item,
								}))}
							/>
							<Form.Control
								name="milage_amount"
								placeholder="Enter mileage"
								type="number"
							/>
						</Stack>
					</Form.Group> */}
					
