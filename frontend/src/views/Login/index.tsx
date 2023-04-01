import React from 'react';
import { Container, Box, Paper, Typography, useTheme, Button, Avatar, ButtonGroup } from '@mui/material';
import { AuthMethodsList } from 'pocketbase';
import Icon from '../../components/Icon';
import { useLoaderData } from 'react-router-dom';
import LoginButton from './LoginButton';

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
								Better Provadis Coach
							</Typography>
						</Box>
						<Typography variant='body2'>Die deutlich bessere UI für den Provadis-Coach</Typography>
					</Box>
					<Box sx={{ p: theme.spacing(2) }}>
						<ButtonGroup orientation='vertical'>
							{authMethodList &&
								authMethodList.authProviders.map(v => {
									return <LoginButton authProvider={v} key={v.name} />;
								})}
						</ButtonGroup>
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
