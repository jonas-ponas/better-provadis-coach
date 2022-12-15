import React, { useEffect, useState } from 'react';
import { Alert, AlertColor, Box, Button, CircularProgress, Snackbar, Typography, useTheme } from '@mui/material';
import { usePocketbase } from '../util/PocketbaseContext';
import Icon from './Icon';

const MESSAGES = {
	connect: 'Verbinde mit Update-Service...',
	auth: 'Authenifiziere bei Update-Service...',
	state: 'Rufe aktuellen Zustand ab...',
	coach: [
		'Rufe Coach Daten ab... (1/4)',
		'Rufe Coach Daten ab... (2/4',
		'Rufe Coach Daten ab... (3/4)',
		'Rufe Coach Daten ab... (4/4)'
	],
	database: [
		'Synchronisiere Ordner mit Datenbank...',
		'Synchronisiere Dateien mit Datenbank...',
		'Synchronisiere Cache-Dateien mit Datenbank...'
	],
	done: 'Fertig!'
};

type phases = 'connect' | 'state' | 'auth' | 'coach' | 'database' | 'done';

export default function Sync(props: { syncNow?: boolean; callback?: () => void; disabled?: boolean }) {
	const theme = useTheme();
	const client = usePocketbase();

	const [isSyncing, setIsSyncing] = useState(false);
	const [phase, setPhase] = useState<phases>('connect');
	const [step, setStep] = useState<number>(0);
	const [progress, setProgress] = useState<number>(0);
	const [error, setError] = useState<undefined | string>(undefined);
	const [snackbar, setSnackbar] = useState<{ type: string; text: string } | undefined>(undefined);

	useEffect(() => {
		if (props.syncNow) {
			handleSync();
		}
	}, [props.syncNow]);

	function handleSync() {
		let url;
		if (import.meta.env.MODE == 'production') url = 'wss://coach.***REMOVED***/ws';
		else url = import.meta.env.VITE_WEBSOCKET_URI;
		setPhase('connect');
		setIsSyncing(true);
		if (!client?.authStore.isValid) {
			setError('Konnte nicht beim Sync-Service anmelden. Versuchen Sie sich neueinzuloggen!');
		}
		const ws = new WebSocket(url);
		ws.onopen = () => {
			ws.send(
				JSON.stringify({
					type: 'login',
					userId: client?.authStore.model?.id,
					token: client?.authStore.token
				})
			);
		};

		ws.onmessage = event => {
			const json = JSON.parse(event.data);
			switch (json.type) {
				case 'login':
					ws.send(
						JSON.stringify({
							type: 'sync'
						})
					);
					break;
				case 'progress':
					if (json.phase == 'done') {
						setProgress(100);
						setPhase('done');
						setSnackbar({ type: 'success', text: 'Erfolgreich Synchronisiert.' });
						setTimeout(() => {
							setIsSyncing(false);
							if (props.callback) props.callback();
						}, 1000);
						return;
					}
					setPhase(json.phase);
					setStep(json?.step || 0);
					setProgress(Math.floor(((json?.detail || 0) / (json?.total || 1)) * 100));
					break;
				case 'error':
					setError(json.msg);
					setSnackbar({ type: 'error', text: json.msg });
					setIsSyncing(false);
					break;
				default:
					setSnackbar({ type: 'error', text: 'Unbekannte Nachricht Empfangen' });
					console.log('Unknown Data', json);
			}
		};
	}

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center'
			}}>
			<Button
				variant='outlined'
				size='small'
				onClick={handleSync}
				disabled={props.disabled}
				sx={{
					height: 32
				}}
				startIcon={
					isSyncing ? (
						<CircularProgress size={18} variant='indeterminate' />
					) : (
						<Icon name='refresh' style='line' size='sm' />
					)
				}>
				Sync
			</Button>
			{isSyncing && (
				<Typography variant='body2' sx={{ ml: theme.spacing(1), color: theme.palette.grey[500] }}>
					{['database', 'coach'].includes(phase) ? MESSAGES[phase][step - 1] : MESSAGES[phase]}
					{phase == 'database' ? ` ${progress}%` : ''}
				</Typography>
			)}
			<Snackbar open={snackbar != undefined} autoHideDuration={10000} onClose={() => setSnackbar(undefined)}>
				<Alert
					variant='filled'
					onClose={() => setSnackbar(undefined)}
					severity={(snackbar?.type || 'info') as AlertColor}
					sx={{ width: '100%' }}>
					{snackbar?.text}
				</Alert>
			</Snackbar>
		</Box>
	);
}
