import React from 'react';
import { Breadcrumb, BreadcrumbItem, Card, CardBody, Col, Container, Input, Row } from 'reactstrap';
import { Button, Form, Grid, Panel, SelectPicker, Stack } from 'rsuite';
import Select from 'react-select';

export const VehicleForm = ({ collapsible = false, header, props }) => {
	const titleOptions = [
		{ value: 'Mr', label: 'Mr.' },
		{ value: 'Ms', label: 'Ms.' },
		{ value: 'Miss', label: 'Miss.' },
		{ value: 'Mx', label: 'Mx.' },
		// Add more gender options as needed
	  ];

	return (
		<Card>
			<CardBody>
			<Panel header={header}  collapsible={collapsible} {...props} >
			<Form>
				<label className='detail-card-title pb-3 pt-1'>Vehicle Details</label>
				<Row >
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Vehicle Number*</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="vehicle_no" placeholder="Enter vehicle number" /></div>
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Manufactured Year*</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="engine_no" placeholder="Select Year" /></div>
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Chassis Number*</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="chassis_no" placeholder="Enter chassis number" /></div>
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Make*</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="make" placeholder="Enter make" /></div>
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Model*</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="model" placeholder="Enter vehicle model" /></div>
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Color Code*</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="model" placeholder="Color Code" /></div>
					</Col>
				</Row>

				<label className='detail-card-title pb-3 pt-1'>Owner Details</label>
				<Row className="mb-3" >
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Title</label></div>
						<Select
							name="title"
							placeholder="Select Title"
							className='form-Input-bmw pt-2'
							options={titleOptions}
							isSearchable={false} // Set to true if you want a searchable dropdown
						/>	
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Name*</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="owm_name" placeholder="Name" /></div>
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>NIC*</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="nic" placeholder="NIC" /></div>
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>E-mail</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="email" placeholder="E-mail" /></div>
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Mobile Number*</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="mob_tel" placeholder="Mobile Number" /></div>
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Home Telephone</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="home_tel" placeholder="Home Telephone" /></div>
					</Col>
					<Col md={8}  className='pb-4'>
						<div><label>Address</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="address" placeholder="Address"  /></div>
					</Col>
					<Col md={4} className='pb-4'></Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Province</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="province" placeholder="Province" /></div>
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>City</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="city" placeholder="City" /></div>
					</Col>
					<Col md={12}  className='pb-4'>
						<div><label>Note</label></div>
						<div className='pt-2'><textarea name="note" className='form-Input-bmw' placeholder="Type here..." style={{ height: '200px', width:"100%" }} /></div>
					</Col>
				</Row>

				<Row style={{ display: 'flex', alignItems: 'center', marginBottom: '20px' }}>
					<label htmlFor="sameAsOwnerCheckbox">
						<Input type="checkbox" id="sameAsOwnerCheckbox" style={{ marginRight: '10px', marginTop:"0px" }} />
						Same as Owner
					</label>
				</Row>

				<label className='detail-card-title pb-3 pt-1'>Point of Contact</label>
				<Row className="mb-3" >
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Title*</label></div>
						<Select
							name="title"
							placeholder="Select Title"
							className='form-Input-bmw pt-2'
							options={titleOptions}
							isSearchable={false} // Set to true if you want a searchable dropdown
						/>					
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Name*</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="point_name" placeholder="Name" /></div>
					</Col>
					<Col md={4} sm={6} className='pb-4'>
						<div><label>Mobile Number*</label></div>
						<div className='pt-2'><Input className='form-Input-bmw' name="point_mob_tel" placeholder="Mobile Number" /></div>
					</Col>
				</Row>

				<div className='pt-4 pb-5' style={{ display: 'flex', justifyContent: 'flex-end' }}>
					<button
						className="btn btn-primary"
						style={{ marginRight: '10px', backgroundColor: '#064D5F' }}
					>
						Add Vehicle
					</button>
				</div>

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
					<BreadcrumbItem>All Vehicles</BreadcrumbItem>
					<BreadcrumbItem>Vehicle</BreadcrumbItem>
				</Breadcrumb>
				<VehicleForm />
					
				</div>
		</div>
	);
}

{/* 
						<label>Mileage</label>
						<Stack spacing={16}>
							<Input
								name="mileage_unit"
								accepter={SelectPicker}
								cleanable={false}
								searchable={false}
								data={['KM', 'Miles'].map((item) => ({
									value: item,
									label: item,
								}))}
							/>
							<Input
								name="milage_amount"
								placeholder="Enter mileage"
								type="number"
							/>
						</Stack>
					 */}
					
