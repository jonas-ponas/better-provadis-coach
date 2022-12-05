import React, {useContext, useEffect, useState} from 'react';
import {Box, CircularProgress, LinearProgress, Typography, useTheme} from '@mui/material';
import PocketBaseContext from '../hooks/PocketbaseContext';

const messages = {
	connect: 'Verbinde mit Update-Service...',
	auth: 'Authenifiziere bei Update-Service...',
    state: 'Rufe aktuellen Zustand ab...',
	coach: 'Rufe Coach Daten ab...',
	database: [
        'Synchronisiere Ordner mit Datenbank...',
        'Synchronisiere Dateien mit Datenbank...',
        'Synchronisiere Cache-Dateien mit Datenbank...'
    ]
};

export default function SyncProgress(props: {onFinish: (error?: string) => void}) {
    const theme = useTheme()
    const client = useContext(PocketBaseContext)

	const [phase, setPhase] = useState<'connect' | 'state' | 'auth' | 'coach' | 'database'>('connect');
	const [step, setStep] = useState<number>(0)
    const [progress, setProgress] = useState<number>(0);

	useEffect(() => {
        if(!client?.authStore.isValid) return
        const ws = new WebSocket('wss://coach.***REMOVED***/ws');
        ws.onopen = (event) => {
            ws.send(JSON.stringify({
                type: 'login',
                userId: client?.authStore.model?.id,
                token: client?.authStore.token
            }))
        }

        ws.onmessage = (event) => {
            const json = JSON.parse(event.data)
            switch(json.type) {
                case 'login':
                    ws.send(JSON.stringify({
                        type: 'sync'
                    }))
                    break;
                case 'progress':
                    if(json.phase == 'done') {
                        setProgress(100)
                        setTimeout(() => {
                            props.onFinish()
                        }, 700)
                        return;
                    }
                    setPhase(json.phase)
                    setStep(json?.step||0)
                    setProgress(Math.floor(((json?.detail||0) / (json?.total||1)) * 100))
                    break;
                case 'error':

                    break;
                default:
                    console.log('Unknown Data', json)
            }
        }
        return () => {
            ws.close()
        };
	}, []);

	return (
		<Box sx={{
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            alignItems: 'center',
            minWidth: 250
        }}>
			<CircularProgress 
                variant={phase == 'database' ? 'determinate' : 'indeterminate'}
                value={progress}
                color={progress >= 100 ? "success" : "primary"}/>
            
			<Typography variant='body2' color='initial' sx={{
                mt: theme.spacing(2)
            }}>
				{phase == 'database' ? messages[phase][step-1] : messages[phase]}
			</Typography>
		</Box>
	);
}
