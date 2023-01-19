import React, { useState } from 'react';
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
import { useNavigate } from 'react-router-dom';
import pocketbaseEs, { Record } from 'pocketbase';

import Icon from './Icon';
import ConnectDialog from './ConnectDialog';
import Sync from './SyncButton';
import { usePocketbase } from '../util/PocketbaseContext';
import ConfirmationDialog from './ConfirmationDialog';

export default function SettingsTable({ state, rootDir }: { state: Record | null; rootDir: Record | undefined }) {
	const theme = useTheme();
	const navigate = useNavigate();
	const client = usePocketbase();
	const [showConnectDialog, setShowConnectDialog] = useState(false);
	const [showRemoveConfirmation, setShowRemoveConfirmation] = useState(false);
	const [syncNow, setSyncNow] = useState(false);
	const [snackbar, setSnackbar] = useState<{ text: string; type: string } | undefined>(undefined);

	function handleCloseConnectDialog(success?: boolean) {
		setShowConnectDialog(false);
		if (success) {
			setSyncNow(true);
		}
	}

	function onSyncFinished() {
		setSyncNow(false);
		navigate(0);
	}

	async function handleRemoveCoachConfirmed() {
		if (!client?.authStore.model?.id) {
			setSnackbar({ type: 'error', text: 'Fehler beim Entfernen!' });
			return;
		}
		try {
			const state = await client.collection('state').getFirstListItem(`user.id = '${client.authStore.model.id}'`);
			await client.collection('state').delete(state.id);
			navigate(0);
		} catch (e) {
			if (e instanceof Error) {
				setSnackbar({ type: 'error', text: e.name });
			}
		}
	}

	async function onRootDirRemove() {
		if (!client?.authStore.model?.id) {
			setSnackbar({ type: 'error', text: 'Fehler beim Entfernen!' });
			return;
		}
		try {
			await client.collection('users').update(client.authStore.model.id, {
				rootDirectory: null
			});
			navigate(0);
		} catch (e) {
			if (e instanceof Error) {
				setSnackbar({ type: 'error', text: e.name });
			}
		}
	}

	const isCoachConnected = state !== null;

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
								{isCoachConnected ? (
									<Chip label='Verbunden' variant='filled' color='success' size='small' />
								) : (
									<Chip label='Nicht verbunden' variant='filled' color='error' size='small' />
								)}
							</TableCell>
							<TableCell>
								<Box
									sx={{
										display: 'flex',
										flexDirection: 'row'
									}}>
									{isCoachConnected ? (
										<Button
											variant='contained'
											size='small'
											color='error'
											startIcon={<Icon size='xss' name='link-unlink-m' />}
											onClick={() => setShowRemoveConfirmation(true)}
											sx={{
												height: 32,
												mr: theme.spacing(1)
											}}>
											Entfernen
										</Button>
									) : (
										<Button
											variant='contained'
											size='small'
											startIcon={<Icon size='xss' name='link' />}
											onClick={() => setShowConnectDialog(true)}
											sx={{
												height: 32,
												mr: theme.spacing(1)
											}}>
											Verbinden
										</Button>
									)}
									<Sync callback={onSyncFinished} syncNow={syncNow} disabled={state == null} />
								</Box>
							</TableCell>
						</TableRow>
					</TableBody>
				</Table>
			</TableContainer>
			<ConnectDialog open={showConnectDialog} onClose={handleCloseConnectDialog} />
			<ConfirmationDialog
				open={showRemoveConfirmation}
				title='Coach-Verbindung entfernen?'
				content={
					'Möchten Sie wirklich ihre Coach-Verbindung entfernen? Dadurch können Sie keine neuen Dateien synchronisieren, bis Sie die Coach neu verbinden!'
				}
				onClose={() => setShowRemoveConfirmation(false)}
				onConfirm={handleRemoveCoachConfirmed}
			/>
			<Snackbar open={snackbar != undefined} autoHideDuration={10000} onClose={() => setSnackbar(undefined)}>
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
