import { Alert, AlertTitle } from '@mui/material';
import { ClientResponseError } from 'pocketbase';
import React from 'react';
import { isRouteErrorResponse, useRouteError } from 'react-router-dom';
import Icon from './Icon';

export default function Error({ title, description }: { title: string; description: string }) {
	const error = useRouteError() as { [key: string]: any };
	let name = error?.name || title;
	let message = error?.message || description;
	if (isRouteErrorResponse(error)) {
		name = error.data.name;
		message = error.data.description;
	}

	console.log(error);
	console.log(name, message);
	return (
		<Alert variant='filled' severity='error' icon={<Icon name='error-warning' style='line' />}>
			<AlertTitle>{name}</AlertTitle>
			{message}
		</Alert>
	);
}
