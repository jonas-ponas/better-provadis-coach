import React from 'react';
import { Container, Box, Paper, Typography, useTheme, Button, Avatar } from '@mui/material';
import { AuthMethodsList } from 'pocketbase';
import Icon from '../components/Icon';
import { useLoaderData } from 'react-router-dom';

const REDIRECT_URI: { [key: string]: string } = {
	google: import.meta.env.VITE_GOOGLE_REDIRECT_URI || '',
	github: import.meta.env.VITE_GITHUB_REDIRECT_URI || ''
};

export default function Login(props: {}) {
	const theme = useTheme();
	const loaderData = useLoaderData();
	const authMethodList = loaderData as AuthMethodsList;
	return (
		<Box
			sx={{
				width: '100vw',
				height: '100vh',
				bgcolor: theme.palette.primary.dark,
				display: 'flex',
				justifyContent: 'center'
			}}>
			<Container component='main' maxWidth='sm' sx={{ mt: '20vh' }}>
				<Paper
					elevation={0}
					sx={{
						// p: theme.spacing(2),
						display: 'flex',
						alignItems: 'center',
						flexDirection: 'column',
						bgcolor: theme.palette.grey[50]
					}}>
					<Box
						sx={{
							p: theme.spacing(2),
							display: 'flex',
							alignItems: 'center',
							flexDirection: 'column'
						}}>
						<Box
							sx={{
								display: 'flex',
								alignItems: 'center',
								mb: theme.spacing(1)
							}}>
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
								}}>
								Expert Giggle
							</Typography>
						</Box>
						<Typography variant='body2'>Die deutlich bessere UI für den Provadis-Coach</Typography>
					</Box>
					<Box sx={{ p: theme.spacing(2) }}>
						<Box
							sx={{
								display: 'flex',
								flexDirection: 'column'
							}}>
							{authMethodList &&
								authMethodList.authProviders.map(v => {
									let redirectUrl =
										import.meta.env.MODE == 'production'
											? 'https://coach.***REMOVED***/callback'
											: REDIRECT_URI[v.name] || '';
									let combinedAuthUrl = v.authUrl + encodeURIComponent(redirectUrl);
									switch (v.name) {
										case 'google':
											return (
												<Button
													key={v.name}
													LinkComponent={'a'}
													href={combinedAuthUrl}
													onClick={() =>
														localStorage.setItem(
															'provider',
															JSON.stringify({ ...v, redirectUrl })
														)
													}
													sx={{
														bgcolor: theme.palette.common.white,
														color: theme.palette.common.black,
														m: theme.spacing(1),
														border: '1px solid black'
													}}
													startIcon={<Icon name='google' style='line' />}>
													Sign in with Google
												</Button>
											);
										case 'github':
											return (
												<Button
													key={v.name}
													LinkComponent={'a'}
													href={combinedAuthUrl}
													onClick={() =>
														localStorage.setItem(
															'provider',
															JSON.stringify({ ...v, redirectUrl })
														)
													}
													sx={{
														bgcolor: theme.palette.common.black,
														m: theme.spacing(1),
														color: theme.palette.common.white,
														'&:hover': {
															bgcolor: '#383838'
														}
													}}
													startIcon={<Icon name='github' style='line' />}>
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
