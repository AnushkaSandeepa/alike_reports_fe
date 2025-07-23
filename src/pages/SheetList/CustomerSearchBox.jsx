import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Input, Panel, Stack } from 'rsuite';
export default function CustomerSearchBox({ initialQuery = '' }) {
	const [query, setQuery] = useState('');
	useEffect(() => {
		if (query.length) {
			setQuery(query);
		}
	}, [initialQuery]);
	const navigate = useNavigate();
	return (
		<Panel bordered className="mb-3">
			<div
				className="fs-5"
				style={{
					fontSize: '24px',
					fontWeight: '700',
					marginBottom: '10px',
					marginLeft: '5px',
				}}
			>
				Search Sheet
			</div>
			<Stack spacing={300} justifyContent="space-around">
				<Stack.Item grow={1}>
					<Input
						placeholder="Enter name of the sheet"
						defaultValue={query}
						onChange={setQuery}
					/>
				</Stack.Item>
				<Button
					disabled={!query.length}
					appearance="primary"
					color="green"
					onClick={() => {
						navigate('/Report/Report_found');
					}}
					// onClick={() => {
					// 	navigate('/search/' + query);
					// }}
					// as={Link}
					// to={}
				>
					Find Sheet
				</Button>
			</Stack>
		</Panel>
	);
}
