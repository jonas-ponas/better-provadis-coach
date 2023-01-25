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

	const uiVersion = import.meta.env.VITE_UI_VERSION || '???';
	const pbVersion = import.meta.env.VITE_PB_VERSION || '???';

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
									let redirectUrl = '';
									let disabled = false;
									let combinedAuthUrl = v.authUrl;
									switch (v.name) {
										case 'google':
											redirectUrl = import.meta.env.VITE_GOOGLE_REDIRECT_URI;
											if (!redirectUrl)
												return (
													<Typography
														sx={{ m: theme.spacing(1) }}
														variant='body2'
														color='error'>
														Google Login not available
													</Typography>
												);
											combinedAuthUrl += encodeURIComponent(redirectUrl);
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
											redirectUrl = import.meta.env.VITE_GITHUB_REDIRECT_URI;
											if (!redirectUrl)
												return (
													<Typography
														sx={{ m: theme.spacing(1) }}
														variant='body2'
														color='error'>
														Github Login not available
													</Typography>
												);
											combinedAuthUrl += encodeURIComponent(redirectUrl);
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
				<Box>
					<Typography sx={{ color: theme.palette.primary.light }} variant='body2' align='center' color=''>
						{uiVersion} / {pbVersion}
					</Typography>
				</Box>
			</Container>
		</Box>
	);
}
