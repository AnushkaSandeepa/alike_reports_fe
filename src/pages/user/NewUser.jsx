import React from 'react';
import { Button, Card, CardBody, Col, Input, Modal, ModalBody, Row } from 'reactstrap';
import Select from 'react-select';
import { useState } from 'react';
import  {CopyToClipboard}  from 'react-copy-to-clipboard';
import coppytoclipboad from "../../assets/images/svg/coppytoclipboad.svg"


function NewUser({ closeModal }) {

	const similarItem = [
		{ value: 'item1', label: 'Item 1' },
		{ value: 'item2', label: 'Item 2' },
		{ value: 'item3', label: 'Item 3' },
		{ value: 'item4', label: 'Item 4' },
		{ value: 'item5', label: 'Item 5' },
		{ value: 'item6', label: 'Item 6' },
	];

	const [generatedPassword, setGeneratedPassword] = useState("");

	const generateRandomPassword = () => {
		const length = 15; 
		const charset = "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
		let password = "";
		for (let i = 0; i < length; i++) {
		  const randomIndex = Math.floor(Math.random() * charset.length);
		  password += charset[randomIndex];
		}
		setGeneratedPassword(password);
	};

	const handleCopyToClipboard = () => {
		if (generatedPassword) {
			Swal.fire({
			icon: 'info',
			title: 'Text Copied!',
			text: 'The text has been copied to the clipboard.',
			timer: 1000, 
			});
		}
	};

	return (
		
		<div className="m-5">
		<div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
			<div>
				<h3>Create User</h3>
			</div>
		</div>
		<div >
			<Card>
				<CardBody>
					<Row className='pb-4'>
						<Col md={6} sm={6} className='pb-4'>
							<div><label>Name*</label></div>
							<div className='pt-2'><Input className='form-Input-bmw' name="user_name" placeholder="Enter User's First & Last Name" /></div>
						</Col>
						<Col md={6} sm={6} className='pb-4'>
							<div><label>Role*</label></div>
							<Select
								name="similar_item"
								placeholder="Select User Role"
								className='form-Input-bmw pt-2'
								options={similarItem}
								isSearchable={false}
								isMulti={true} // Set isMulti to true for multiple selection
							/>
						</Col>
						<Col md={6} sm={6} className='pb-4'>
							<div><label>Email*</label></div>
							<div className='pt-2'><Input className='form-Input-bmw' name="user_email" placeholder="Enter Email Address" /></div>
						</Col>
						<Col md={6} sm={6} className='pb-4'>
							<div><label>Mobile Number*</label></div>
							<div className='pt-2'><Input className='form-Input-bmw' name="user_mob_number" placeholder="Enter Mobile Number" /></div>
						</Col>

						<div className='pb-2'><label>Password*</label></div>
						<Col md={4} style={{ display: 'flex', border: '1px solid #CED4DA', borderRadius: '4px', height:"42px", marginLeft:"10px"}}>
							<Input
								className="form-input"
								type="text"
								style={{ border: 'none' }}
								placeholder="Generate Password"
								value={generatedPassword}
								onChange={(e) => setGeneratedPassword(e.target.value)}
							/>
							<CopyToClipboard text={generatedPassword} onCopy={handleCopyToClipboard}>
								<img
									src={coppytoclipboad}
									style={{ cursor: 'pointer', padding:"8px" }}
									title="Copy to Clipboard"
								/>
							</CopyToClipboard>
						</Col>

						<Col md={2}>
							<Button
								className="btn  mb-4"
								color="dark"
								style={{
								width:"100%",
								fontSize: "15px",
								backgroundColor: "#FFFFFF",
								color: "#374957",
								border: "1px solid #374957",
								}}
								onClick={generateRandomPassword}
							>
								Generate
							</Button>
						</Col>

					</Row>
					<div className='pt-4' style={{ display: 'flex', justifyContent: 'flex-end' }}>
						<button
							className="btn btn-primary"
							style={{ marginRight: '10px', backgroundColor: '#064D5F' }}
						>
							Add
						</button>
					</div>
				</CardBody>
			</Card>
		</div>
	</div>
	);
}

export default NewUser;
