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
		'Rufe Coach Daten ab... (2/4)',
		'Rufe Coach Ordner ab... (3/4)',
		'Rufe Coach Dateien ab... (4/4)'
	],
	database: [
		'Synchronisiere Ordner mit Datenbank...',
		'Synchronisiere Dateien mit Datenbank...',
		'Synchronisiere Cache-Dateien mit Datenbank...'
	],
	done: 'Fertig!'
};

type phases = 'connect' | 'state' | 'auth' | 'coach' | 'database' | 'done';

export default function Sync(props: {
	syncNow?: boolean;
	onSyncFinish?: () => void;
	disabled?: boolean;
	onSyncStart?: () => void;
}) {
	const theme = useTheme();
	const client = usePocketbase();

	const [isSyncing, setIsSyncing] = useState(false);
	const [phase, setPhase] = useState<phases>('connect');
	const [step, setStep] = useState<number>(0);
	const [progress, setProgress] = useState<number>(0);
	const [snackbar, setSnackbar] = useState<{ type: string; text: string } | undefined>(undefined);

	useEffect(() => {
		if (props.syncNow) {
			handleSync();
		}
	}, [props.syncNow]);

	function handleSync() {
		const ws_uri = import.meta.env.VITE_WEBSOCKET_URI as string;
		const scheme = window.location.protocol.startsWith('https') ? 'wss://' : 'ws://';
		let url;
		if (!ws_uri) {
			url = `${scheme}${window.location.host}/ws`;
		} else if (ws_uri.startsWith('/')) {
			url = `${scheme}${window.location.host}${ws_uri}`;
		} else {
			url = ws_uri;
		}
		setPhase('connect');
		setIsSyncing(true);
		if (props.onSyncStart) props.onSyncStart();
		if (!client?.authStore.isValid) {
			setSnackbar({
				type: 'error',
				text: 'Konnte nicht beim Sync-Service anmelden. Versuchen Sie sich neueinzuloggen!'
			});
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

		ws.onerror = e => {
			console.error(e);
			setSnackbar({ type: 'error', text: 'Es gab einen Websocket Fehler!' });
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
							if (props.onSyncFinish) props.onSyncFinish();
						}, 1000);
						return;
					}
					setPhase(json.phase);
					setStep(json?.step || 0);
					setProgress(Math.floor(((json?.detail || 0) / (json?.total || 1)) * 100));
					break;
				case 'error':
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
