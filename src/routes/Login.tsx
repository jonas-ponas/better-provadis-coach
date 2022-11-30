import React, {useContext, useEffect, useState} from 'react';
import {Container, Box, Paper, Typography, useTheme, Divider, Button, Avatar} from '@mui/material';
import PocketBaseContext from '../hooks/PocketbaseContext';
import {AuthMethodsList, AuthProviderInfo} from 'pocketbase';

const GOOGLE_REDIRECT_URI = 'http://localhost:5173/callback'

export default function Login(props: {}) {
	const theme = useTheme();
	const client = useContext(PocketBaseContext);

	const [authMethods, setAuthMethods] = useState<undefined | AuthMethodsList>(undefined);
	const [error, setError] = useState<undefined | string>(undefined);

	useEffect(() => {
		client
			?.collection('users')
			.listAuthMethods()
			.then(methods => {
				setAuthMethods(methods);
			})
			.catch(e => {
				setError(e.message);
			});
	}, []);

	return (
		<Box
			sx={{
				width: '100vw',
				height: '100vh',
				bgcolor: theme.palette.primary.dark,
				display: 'flex',
				justifyContent: 'center'
			}}
		>
			<Container
				component='main'
				maxWidth='sm'
				sx={{
					mt: '20vh'
				}}
			>
				<Paper
					elevation={0}
					sx={{
						// p: theme.spacing(2),
						display: 'flex',
						alignItems: 'center',
						flexDirection: 'column',
						bgcolor: theme.palette.grey[50]
					}}
				>
					<Box
						sx={{
							p: theme.spacing(2),
							display: 'flex',
							alignItems: 'center',
							flexDirection: 'column'
						}}
					>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								mb: theme.spacing(1)
							}}
						>
							<Avatar
								src='/provadis-logo.png'
								sx={{
									bgcolor: theme.palette.common.white
								}}
							/>
							<Typography
								variant='h5'
								sx={{
									fontWeight: 'bold',
									ml: theme.spacing(1)
								}}
							>
								Expert Giggle
							</Typography>
						</Box>
						<Typography variant='body2'>Das deutlich bessere UI für den Provadis-Coach</Typography>
					</Box>
					<Box
						sx={{
							p: theme.spacing(2)
						}}
					>
						{error && (
							<Typography variant='body1' color={theme.palette.error.main}>
								{error}
							</Typography>
						)}

						<Box sx={{
							display: 'flex',
							flexDirection: 'column'
						}}>
							{authMethods &&
							authMethods.authProviders.map(v => {
								console.log(v)
								switch (v.name) {
									case 'google':
										return (
											<Button
												LinkComponent={'a'}
												href={(v.authUrl+encodeURIComponent(GOOGLE_REDIRECT_URI))|| ''}
												onClick={() => localStorage.setItem('provider', JSON.stringify(v))}
												sx={{
													bgcolor: theme.palette.common.white,
													color: theme.palette.common.black,
													m: theme.spacing(1),
													border: "1px solid black"
												}}
											>
												Sign in with Google
											</Button>
										);
									case 'github':
										return (
											<Button
												LinkComponent={'a'}
												href={v.authUrl || ''}
												onClick={() => localStorage.setItem('provider', JSON.stringify(v))}
												sx={{
													bgcolor: theme.palette.common.black,
													m: theme.spacing(1),
													color: theme.palette.common.white,
													'&:hover': {
														bgcolor: '#383838'
													}
												}}
											>
												Sign in with Github
											</Button>
										);
									default:
										return null;
								}
							})}
						</Box>
					</Box>
				</Paper>
			</Container>
		</Box>
	);
}
