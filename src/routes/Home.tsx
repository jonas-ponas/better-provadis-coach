// <reference path='../records.d.ts' />
import {
	Alert,
	AlertTitle,
	Avatar,
	Box,
	Button,
	Container,
	Icon,
	Link,
	Typography,
	useTheme
} from '@mui/material';
import React, { useContext, useEffect, useState } from 'react';
import PocketBaseContext from '../hooks/PocketbaseContext';
import DirectoryTable from '../components/DirectoryTable';
import PathBreadcrumb from '../components/PathBreadcrump';
import SyncDialog from '../components/SyncDialog';
import { Link as RouterLink } from 'react-router-dom';
import ConnectDialog from '../components/ConnectDialog';
import UserAvatar from '../components/UserAvatar';
import { DirectoryRecord } from '../records';
import { BugReportOutlined } from '@mui/icons-material';

export default function Home(props: {}) {
	const theme = useTheme();
	const client = useContext(PocketBaseContext);

	const [root, setRoot] = useState<DirectoryRecord | undefined>(undefined);
	const [showSyncDialog, setShowSyncDialog] = useState(false);
	const [showConnectDialog, setShowConnectDialog] = useState(false);
	const [error, setError] = useState<undefined | JSX.Element>(undefined);

	useEffect(() => {
		// Get dir from url query
		const dirQuery = new URL(window.location.href).searchParams.get('dir');
		const expand =
			'parent,parent.parent,parent.parent.parent,parent.parent.parent.parent,parent.parent.parent.parent.parent,parent.parent.parent.parent.parent.parent';
		console.log(client?.authStore.token, client?.authStore.model?.id);
		if (!dirQuery) {
			if (!client?.authStore.model?.rootDirectory) {
				client
					?.collection('directory')
					.getFirstListItem<DirectoryRecord>('parent = null', {
						expand
					})
					.then(record => {
						setRoot(record);
					})
					.catch(e => {
						client
							.collection('state')
							.getFirstListItem(`user.id = ${client.authStore.model?.id}`)
							.then(() => {
								setError(
									<Alert variant='filled' severity='error'>
										<AlertTitle>Kein Wurzel-Knoten gefunden!</AlertTitle>
										Haben Sie einen Coach verbunden?
										<br />
										<Link
											sx={{
												color: 'inherit',
												fontWeight: 'bold',
												textDecorationColor: 'inherit'
											}}
											component={RouterLink}
											to='/connect'
										>
											Hier
										</Link>{' '}
										einen Coach verbinden
									</Alert>
								);
							})
							.catch(e => {
								console.log('Connect Coach!');
								setError(
									<Alert variant='filled' severity='error'>
										<AlertTitle>Kein Wurzel-Knoten gefunden!</AlertTitle>
										Haben Sie einen Coach verbunden?
									</Alert>
								);
								setShowConnectDialog(true);
							});
					});
			} else {
				client
					?.collection('directory')
					.getOne<DirectoryRecord>(client?.authStore.model.rootDirectory, {
						expand
					})
					.then(record => {
						setRoot(record);
					});
			}
			return;
		}
		client
			?.collection('directory')
			.getOne<DirectoryRecord>(dirQuery, {
				expand
			})
			.then(record => {
				setRoot(record);
			});
	}, []);

	function onConnected(error?: string) {
		setShowConnectDialog(false);
		if (!error) {
			setShowSyncDialog(true);
		}
	}

	function logout() {
		client?.authStore.clear();
		window.location.href = '/login';
	}

	return (
		<Box
			sx={{
				width: '100vw',
				height: '100vh',
				bgcolor: theme.palette.grey[50],
				display: 'flex',
				justifyContent: 'center'
			}}
		>
			<Container
				sx={{
					bgcolor: theme.palette.grey[50]
				}}
			>
				<Box
					sx={{
						mt: theme.spacing(4),
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center'
					}}
				>
					<Box
						sx={{
							display: 'flex',
							alignItems: 'center'
						}}
					>
						<Avatar
							src='/provadis-logo.png'
							sx={{
								bgcolor: theme.palette.common.white
								// height: 24,
								// width: 24
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
					<Box>
						<Button
							LinkComponent={'a'}
							href='https://github.com/jonas-ponas/expert-giggle-frontend/'
							target='_blank'
							variant='outlined'
							sx={{
								borderColor: theme.palette.common.black,
								color: theme.palette.common.black
							}}
							size='small'
							startIcon={<BugReportOutlined />}
						>
							Bug Report
						</Button>
					</Box>
				</Box>
				<Box
					sx={{
						mt: theme.spacing(1),
						display: 'flex',
						justifyContent: 'space-between',
						alignItems: 'center'
					}}
				>
					<PathBreadcrumb directory={root} />
					<Box
						sx={{
							display: 'flex'
						}}
					>
						<Button
							variant='outlined'
							size='small'
							onClick={() => setShowSyncDialog(true)}
							sx={{
								mr: theme.spacing(2)
							}}
						>
							Synchronisieren
						</Button>
						{/* <Button
							variant='outlined'
							size='small'
							onClick={() => setShowConnectDialog(true)}
							sx={{
								mr: theme.spacing(2)
							}}
						>
							Verbinden
						</Button> */}
						<UserAvatar />
					</Box>
				</Box>
				<Box
					sx={{
						mt: theme.spacing(2)
					}}
				>
					{error}
					{root && <DirectoryTable record={root} />}
				</Box>
			</Container>
			<SyncDialog open={showSyncDialog} onFinished={() => setShowSyncDialog(false)} />
			<ConnectDialog open={showConnectDialog} onClose={onConnected} />
		</Box>
	);
}
