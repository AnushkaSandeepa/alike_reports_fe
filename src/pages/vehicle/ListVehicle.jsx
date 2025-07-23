import SearchDropdown from '@/layouts/Topbar/SearchDropdown';
import React from 'react';
import { Table } from 'react-bootstrap';
import { FiTrash2 } from 'react-icons/fi';
import { HiOutlinePencil } from 'react-icons/hi';
import { FaArrowUp } from 'react-icons/fa6';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { PageBreadcrumb } from '@/components';

function ListVehicle() {

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

	const handleNavigate = () => {
		navigate('/vehicle/vehicleid1');
	};
	const handleNavigateNewVehicle = () => {
		navigate('/vehicle/vehicleform');
	};

	return (
		<>
			<PageBreadcrumb title="Vehicle" />
			<div className="m-5">
				<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
					<div>
						<h3>Vehicle List</h3>
					</div>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<div style={{ display: 'flex', alignItems: 'center' }}>
							<FaSearch style={{ marginRight: '5px' }} />
							<input
								type="text"
								placeholder="Search..."
								style={{ width: '150px', marginRight: '10px', border: 'none' }}
							/>
						</div>
						<button
							className="btn btn-primary"
							style={{ marginRight: '10px', backgroundColor: '#064D5F' }}
							onClick={handleNavigateNewVehicle}
						>
							Add Vehicle
						</button>
						<button className="btn btn-outline-secondary " style={{ color: '#064D5F' }}>
							<FaArrowUp
								size={14}
								style={{ cursor: 'pointer', marginRight: '5px', marginTop: '-3px' }}
							/>{' '}
							Export
						</button>
					</div>
				</div>
				<div >
					<Table className="border" style={{ borderRadius: '20px' }}>
						<thead style={{ background: '#EBF4F4', borderRadius: '20px' }}>
							<tr>
								<th>ID</th>
								<th>Make</th>
								<th>Vehicle Number</th>
								<th>Model</th>
								<th>Color Code</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody >
							{data.map((vehicle) => (
								<tr key={vehicle.id}  onClick={handleNavigate}>
									<td>{vehicle.id}</td>
									<td>{vehicle.make}</td>
									<td>{vehicle.vehicle_number}</td>
									<td>{vehicle.model}</td>
									<td>{vehicle.color_code}</td>
									<td>
										<HiOutlinePencil
											size={20}
											style={{ cursor: 'pointer', marginRight: '10px' }}
										/>
										<FiTrash2
											size={20}
											style={{ cursor: 'pointer', color: 'red' }}
										/>
									</td>
								</tr>
							))}
						</tbody>
					</Table>
				</div>
			</div>
		</>
	);
}

export default ListVehicle;
