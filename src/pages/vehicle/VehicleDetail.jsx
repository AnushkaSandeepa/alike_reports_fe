import TwoLineItem from '@/components/TwoLineItem';
import React from 'react';
import { Table } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import { Card, CardBody, Col, Row } from 'reactstrap';

function VehicleDetail() {

	const navigate = useNavigate();

	const data = [
		{
			id: '#001',
			make: 'BMW',
			vehicle_number: 'BIV3247',
			model: 'M1',
			color_code: 'A120',
		},
		{
			id: '#002',
			make: 'Toyota',
			vehicle_number: 'TOY5678',
			model: 'Camry',
			color_code: 'B245',
		},
		{
			id: '#003',
			make: 'Honda',
			vehicle_number: 'HON9123',
			model: 'Accord',
			color_code: 'C335',
		},
		{
			id: '#004',
			make: 'Ford',
			vehicle_number: 'FOR4567',
			model: 'Mustang',
			color_code: 'D410',
		},
		{
			id: '#005',
			make: 'Chevrolet',
			vehicle_number: 'CHE7890',
			model: 'Camaro',
			color_code: 'E512',
		},
		{
			id: '#006',
			make: 'Mercedes-Benz',
			vehicle_number: 'MBZ1234',
			model: 'C-Class',
			color_code: 'F623',
		},
		{
			id: '#007',
			make: 'Nissan',
			vehicle_number: 'NIS5678',
			model: 'Altima',
			color_code: 'G734',
		},
		{
			id: '#008',
			make: 'Audi',
			vehicle_number: 'AUD9123',
			model: 'A4',
			color_code: 'H845',
		},
		{
			id: '#009',
			make: 'Tesla',
			vehicle_number: 'TES4567',
			model: 'Model S',
			color_code: 'I956',
		},
		{
			id: '#010',
			make: 'Volkswagen',
			vehicle_number: 'VW7890',
			model: 'Golf',
			color_code: 'J067',
		},
		{
			id: '#011',
			make: 'Subaru',
			vehicle_number: 'SUB1234',
			model: 'Outback',
			color_code: 'K178',
		},
		// Add more data if needed
	];

	return (
		<div className="m-5">
			<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
				<div>
					<h3>Vehicle ID #100</h3>
				</div>
				
			</div>
			
			<div style={{ width:"100%" }}>		
					<Card>
						<CardBody>
							<div style={{padding:"20px 25px"}}>
								<label className='detail-card-title pb-3'>Vehicle Details</label>
								<Row>
									<Col md={4} sm={6} className='pb-4'>
										<TwoLineItem title={"Vehicle Number"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"BIV 3239"} />
									</Col>
									<Col md={4} sm={6} className='pb-4'>
										<TwoLineItem title={"Make"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"BMW"} />
									</Col>
									<Col md={4} sm={6} className='pb-4'>
										<TwoLineItem title={"Model"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"M1"} />
									</Col>
									<Col md={4} sm={6} className='pb-4'>
										<TwoLineItem title={"Manufactured Year"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"2018"} />
									</Col>
									<Col md={4} sm={6} className='pb-4'>
										<TwoLineItem title={"Chassis Number"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"452525446642"} />
									</Col>
									<Col md={4} sm={6} className='pb-4'>
										<TwoLineItem title={"Color Code"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"#83374"} />
									</Col>
								</Row>

								<label className='detail-card-title pb-3 pt-3'>Owner’s Details</label>
								<Row>
									<Col md={4} className='pb-4'>
										<TwoLineItem title={"Name"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"Suhail Summon"} />
									</Col>
									<Col md={4} sm={6} className='pb-4'>
										<TwoLineItem title={"NIC Number"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"99555064V"} />
									</Col>
								</Row>
								<Row>
								<Col md={4} className='pb-4'>
									<TwoLineItem title={"E-mail"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"suhai@gmal.com"} />
								</Col>
								<Col md={4} sm={6} className='pb-4'>
									<TwoLineItem title={"Mobile Number"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"+94 2 729 729"} />
								</Col>
								<Col md={4} sm={6} className='pb-4'>
									<TwoLineItem title={"Home Telephone"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"+94 2 729 729"} />
								</Col>
								<Col md={4} >
									<TwoLineItem title={"Address"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"243/2 Colombo road, Gintothota"} />
								</Col>
								<Col md={4} sm={6} className='pb-4'>
									<TwoLineItem title={"Province"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"Western Province"} />
								</Col>
								<Col md={4} sm={6} className='pb-4'>
									<TwoLineItem title={"City"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"Ginthota"} />
								</Col>
								</Row>

								<label className='detail-card-title pb-3 pt-3'>Point of Contact</label>
								<Row>
									<Col md={4} className='pb-4'>
										<TwoLineItem title={"Name"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"Suhail Summon"} />
									</Col>
									<Col md={4} sm={6} className='pb-4'>
										<TwoLineItem title={"Mobile Number"} titleStyle={{fontWeight:700, color:"#374957"}} subtitle={"+94 2 729 729"} />
									</Col>
								</Row>

								<label className='detail-card-title pb-3 pt-3'>Service History</label>
								<Table className="border" style={{ borderRadius: '20px' }}>
									<thead style={{ background: '#EBF4F4', borderRadius: '20px' }}>
										<tr>
											<th>ID</th>
											<th>Make</th>
											<th>Vehicle Number</th>
											<th>Model</th>
											<th>Color Code</th>
										</tr>
									</thead>
									<tbody >
										{data.map((vehicle) => (
											<tr key={vehicle.id}  >
												<td>{vehicle.id}</td>
												<td>{vehicle.make}</td>
												<td>{vehicle.vehicle_number}</td>
												<td>{vehicle.model}</td>
												<td>{vehicle.color_code}</td>
												
											</tr>
										))}
									</tbody>
								</Table>

								{/* <div className='pt-4' style={{ display: 'flex', justifyContent: 'flex-end' }}>
									<button
										className="btn btn-primary"
										style={{ marginRight: '10px', backgroundColor: '#064D5F' }}
									>
										Create Work Order
									</button>
								</div> */}


							</div>
						</CardBody>
					</Card>
					<div className='pt-4' style={{ display: 'flex', justifyContent: 'flex-end' }}>
						<button
							className="btn btn-primary"
							style={{ marginRight: '10px', backgroundColor: '#064D5F' }}
						>
							Create Work Order
						</button>
					</div>
				</div>
		</div>
	);
}

export default VehicleDetail;
