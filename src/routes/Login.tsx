import React, {useContext, useEffect, useState} from 'react';
import {Container, Box, Paper, Typography, useTheme, Divider, Button, Avatar} from '@mui/material';
import CloudCircleTwoToneIcon from '@mui/icons-material/CloudCircleTwoTone';
import PocketBaseContext from '../hooks/PocketbaseContext';

export default function Login(props: {}) {
	const theme = useTheme();
	const client = useContext(PocketBaseContext);

	const [authUrl, setAuthUrl] = useState<string>("")
	const [error, setError] = useState<undefined|string>(undefined)
	
	useEffect(() => {
		client?.collection('users').listAuthMethods().then((methods) => {
			setAuthUrl(methods.authProviders[0].authUrl)
		}).catch((e) => {
			setError(e.message)
		})
	}, [])

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
				component="main"
				maxWidth="sm"
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
						flexDirection: 'column'
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
						<Avatar
							sx={{
								width: 56,
								height: 56,
								bgcolor: theme.palette.common.black
							}}
						>
							<CloudCircleTwoToneIcon fontSize="large" />
						</Avatar>
						<Typography
							variant="h5"
							component="h1"
							sx={{
								mt: theme.spacing(1),
								fontWeight: 'bold'
							}}
						>
							Login
						</Typography>
					</Box>
					<Divider variant="fullWidth" light />
					<Box
						sx={{
							p: theme.spacing(2)
						}}
					>
						{error ?
						<Typography variant='body1'>{error}</Typography>
						:
						<Button
							// onClick={() => (window.location.href = authUrl)}
							LinkComponent={"a"}
							href={authUrl||""}
							sx={{
								bgcolor: '#000',
								color: theme.palette.common.white,
								'&:hover': {
									bgcolor: '#383838'
								}
							}}
						>
							Sign in with Github
						</Button>
					}
					</Box>
				</Paper>
			</Container>
		</Box>
	);
}
