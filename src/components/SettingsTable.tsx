import {
	Alert,
	AlertColor,
	Box,
	Button,
	Chip,
	Paper,
	Snackbar,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	useTheme
} from '@mui/material';
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Record } from 'pocketbase';

import Icon from './Icon';
import ConnectDialog from './ConnectDialog';
import Sync from './SyncButton';
import { usePocketbase } from '../util/PocketbaseContext';

export default function SettingsTable({ state, rootDir }: { state: Record | null; rootDir: Record | undefined }) {
	const theme = useTheme();
	const navigate = useNavigate();
	const client = usePocketbase();
	const [showConnectDialog, setShowConnectDialog] = useState(false);
	const [syncNow, setSyncNow] = useState(false);
	const [snackbar, setSnackbar] = useState<{text: string, type: string}|undefined>(undefined)

	function handleClose(success?: boolean) {
		setShowConnectDialog(false);
		if (success) {
			setSyncNow(true);
		}
	}

	function onSyncFinished() {
		setSyncNow(false);
		navigate(0);
	}

	async function onRootDirRemove() {
		if (!client?.authStore.model?.id) {
			setSnackbar({type: 'error', text: 'Fehler beim Entfernen!'})
			return;
		}
		try {
			await client.collection('users').update(client.authStore.model.id, {
				rootDirectory: null
			});
			navigate(0)
		} catch(e) {
			if(e instanceof Error) {
				setSnackbar({type: 'error', text: e.name})
			}
		}
	}

	return (
		<>
			<TableContainer component={Paper}>
				<Table size='small'>
					<TableHead>
						<TableRow>
							<TableCell colSpan={3} sx={{ fontWeight: 'bold' }}>
								Expert-Giggle Einstellungen
							</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						<TableRow>
							<TableCell width={150}>Wurzel-Ordner</TableCell>
							<TableCell>
								{rootDir == null ? (
									<Typography variant='body2' sx={{ fontStyle: 'italic' }}>
										nicht festgelegt
									</Typography>
								) : (
									<Chip
										label={rootDir?.name}
										variant='filled'
										color='primary'
										size='small'
										deleteIcon={
											<Box sx={{ width: '1.5em' }}>
												<Icon name='external-link' style='line' />
											</Box>
										}
										onDelete={() => navigate(`/dir/${rootDir.id}`)}
									/>
								)}
							</TableCell>
							<TableCell>
								<Button
									variant='outlined'
									size='small'
									color='error'
									disabled={rootDir == null}
									onClick={onRootDirRemove}
									startIcon={<Icon size='xss' name='delete-bin' style='line' />}
									sx={{
										height: 32
									}}>
									Entfernen
								</Button>
							</TableCell>
						</TableRow>
						<TableRow>
							<TableCell>Coach</TableCell>
							<TableCell>
								{state == null ? (
									<Chip label='Nicht verbunden' variant='filled' color='error' size='small' />
								) : (
									<Chip label='Verbunden' variant='filled' color='success' size='small' />
								)}
							</TableCell>
							<TableCell>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'row'
									}}>
									<Button
										variant='contained'
										size='small'
										disabled={state != null}
										startIcon={<Icon size='xss' name='link' />}
										onClick={() => setShowConnectDialog(true)}
										sx={{
											height: 32,
											mr: theme.spacing(1)
										}}>
										Verbinden
									</Button>
									<Sync callback={onSyncFinished} syncNow={syncNow} disabled={state == null} />
								</Box>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>
			<ConnectDialog open={showConnectDialog} onClose={handleClose} />
			<Snackbar
				open={snackbar != undefined}
				autoHideDuration={10000}
				onClose={() => setSnackbar(undefined)}>
				<Alert
					variant='filled'
					onClose={() => setSnackbar(undefined)}
					severity={(snackbar?.type || 'info') as AlertColor}
					sx={{ width: '100%' }}>
					{snackbar?.text}
				</Alert>
			</Snackbar>
		</>
	);
}
