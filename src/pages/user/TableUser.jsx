import SearchDropdown from '@/layouts/Topbar/SearchDropdown';
import React from 'react';
import { Table } from 'react-bootstrap';
import { FiTrash2 } from 'react-icons/fi';
import { HiOutlinePencil } from 'react-icons/hi';
import { FaArrowUp } from 'react-icons/fa6';
import { FaSearch } from 'react-icons/fa';
import { useNavigate } from 'react-router-dom';
import { PageBreadcrumb } from '@/components';

function User() {
	const data = [
		{
			id: '#001',
			name: 'Michele',
			role: 'Advisor',
			phone: '+94 2 729 729',
		},
		{
			id: '#002',
			name: 'John',
			role: 'Manager',
			phone: '+94 7 856 321',
		},
		{
			id: '#003',
			name: 'Emily',
			role: 'Consultant',
			phone: '+94 7 123 456',
		},
		{
			id: '#004',
			name: 'Daniel',
			role: 'Analyst',
			phone: '+94 7 789 012',
		},
		{
			id: '#005',
			name: 'Sophia',
			role: 'Specialist',
			phone: '+94 7 345 678',
		},
		{
			id: '#006',
			name: 'Liam',
			role: 'Coordinator',
			phone: '+94 7 901 234',
		},
		{
			id: '#007',
			name: 'Olivia',
			role: 'Supervisor',
			phone: '+94 7 567 890',
		},
		{
			id: '#008',
			name: 'Ethan',
			role: 'Developer',
			phone: '+94 7 234 567',
		},
		{
			id: '#009',
			name: 'Ava',
			role: 'Designer',
			phone: '+94 7 890 123',
		},
		{
			id: '#010',
			name: 'Noah',
			role: 'Engineer',
			phone: '+94 7 456 789',
		},
	];
	const navigate = useNavigate();

	return (
		<>
			<PageBreadcrumb title="Users" />

			<div className="m-5">
				<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
					<div>
						<h3>User Management</h3>
					</div>
					<div style={{ display: 'flex', alignItems: 'center' }}>
						<div style={{ display: 'flex', alignItems: 'center' }}>
							<FaSearch style={{ marginRight: '5px' }} />
							<input
								type="text"
								placeholder="Search..."
								style={{ width: '100px', border: 'none' }}
							/>
						</div>
						<button
							className="btn btn-primary"
							style={{ backgroundColor: '#064D5F' }}
							onClick={() => navigate('/user/new_user')}
						>
							Add User
						</button>
					</div>
				</div>
				<div >
					<Table className="border" style={{ borderRadius: '20px' }}>
						<thead style={{ background: '#EBF4F4', borderRadius: '20px' }}>
							<tr>
								<th>ID</th>
								<th>Username</th>
								<th>Role</th>
								<th>phone</th>
								<th>Action</th>
							</tr>
						</thead>
						<tbody>
							{data.map((user) => (
								<tr key={user.id}>
									<td>{user.id}</td>
									<td>{user.name}</td>
									<td>{user.role}</td>
									<td>{user.phone}</td>
									<td>
										<HiOutlinePencil
											size={20}
											style={{ cursor: 'pointer', marginRight: '10px' }}
											onClick={() => navigate('/user/new_user')}
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

export default User;
