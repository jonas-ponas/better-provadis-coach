import React from 'react';
import { Alert, AlertTitle, Box, Button, SxProps } from '@mui/material';
import { isRouteErrorResponse, useNavigate, useRouteError } from 'react-router-dom';
import Icon from './Icon';

export default function ErrorAlert({ title, description, sx }: { title: string; description: string; sx?: SxProps }) {
	const error = useRouteError() as { [key: string]: any };
	const navigate = useNavigate();
	let name;
	let message;
	let stack;
	if (isRouteErrorResponse(error)) {
		name = error.data.name;
		message = error.data.description;
	} else {
		if (error instanceof Error) {
			name = error.name;
			stack = error.stack;
		} else {
			name = title;
			message = description;
		}
	}

	return (
		<Alert variant='filled' severity='error' icon={<Icon name='error-warning' style='line' />} sx={sx}>
			<AlertTitle>{name}</AlertTitle>
			{message}
			{stack && <pre>{stack}</pre>}
			<Box sx={{ mt: 3 }}>
				<Button
					color='inherit'
					onClick={() => navigate('/')}
					startIcon={<Icon name='arrow-left' style='line' />}>
					Back Home
				</Button>
			</Box>
		</Alert>
	);
}
