import { Alert, AlertTitle, Box, Container, Typography, useTheme } from '@mui/material';
import { ClientResponseError } from 'pocketbase';
import React, { useContext, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import PocketBaseContext from '../hooks/PocketbaseContext';

// const REDIRECT_URI = 'https://coach.***REMOVED***/callback'
const REDIRECT_URI = 'http://localhost:5173/callback';
// const GITHUB_REDIRECT_URI = 'https://coach.***REMOVED***/callback'
const GITHUB_REDIRECT_URI = 'https://coach.***REMOVED***/callback/dev';

export default function Callback() {
	const theme = useTheme();
	const client = React.useContext(PocketBaseContext);

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<undefined | string>(undefined);

	useEffect(() => {
		const url = new URL(window.location.href);
		const code = url.searchParams.get('code');
		const state = url.searchParams.get('state');
		const provider = JSON.parse(localStorage.getItem('provider') || '{}');
		if (!state || !code || !provider?.name) return;
		client
			?.collection('users')
			.authWithOAuth2(
				provider.name,
				code,
				provider.codeVerifier,
				provider.name == 'github' ? GITHUB_REDIRECT_URI : REDIRECT_URI
			)
			.then(r => {
				console.log(r);
				document.cookie = client.authStore.exportToCookie();
				window.location.href = '/';
			})
			.catch((e: ClientResponseError) => {
				setError(e.message);
			})
			.finally(() => setLoading(false));
	}, []);

	return (
		<Container component='main' maxWidth='xs'>
			<Box
				sx={{
					mt: 8,
					display: 'flex',
					flexDirection: 'center',
					alignItems: 'center'
				}}
			>
				{loading ? (
					<Typography variant='body2'>Anmeldung wird verarbeitet...</Typography>
				) : error ? (
					<Alert
						variant='filled'
						severity='error'
						sx={{
							width: '100%'
						}}
					>
						<AlertTitle>Fehler!</AlertTitle>
						{error}
						<br />
						<Link
							to='/login'
							style={{
								color: theme.palette.error.contrastText
							}}
						>
							Zurück zum Login
						</Link>
					</Alert>
				) : (
					<Alert
						variant='filled'
						severity='success'
						sx={{
							width: '100%'
						}}
					>
						<AlertTitle>Erfolg!</AlertTitle>
						Erfolgreich angemeldet! Klicke{' '}
						<Link
							to='/'
							style={{
								color: theme.palette.success.contrastText
							}}
						>
							hier
						</Link>
						, wenn du nicht automatisch weitergeleitet wirst!
					</Alert>
				)}
			</Box>
		</Container>
	);
}
