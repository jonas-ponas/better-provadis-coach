import React, {useEffect, useState} from 'react';
import {Box, CircularProgress, Typography, useTheme} from '@mui/material';

const messages = {
	connect: 'Verbinde mit Update-Service...',
	auth: 'Authenifiziere bei Update-Service...',
	coach: 'Rufe Coach Daten ab...',
	database: 'Synchronisiere Daten mit Datenbank...'
};

export default function SyncProgress(props: {onFinish: (error?: string) => void}) {
    const theme = useTheme()

	const [phase, setPhase] = useState<'connect' | 'auth' | 'coach' | 'database'>('connect');
	const [progress, setProgress] = useState<number>(0);

    function mockProgress() {
        let interval: number
        setTimeout(() => {
            setPhase('auth')
            setTimeout(() => {
                setPhase('coach')
                setTimeout(() => {
                    setPhase('database')
                    interval = setInterval(() => {
                        setProgress(progress => {
                            if(progress >= 100) {
                                clearInterval(interval)
                                setTimeout(() => {
                                    props.onFinish()
                                }, 1000)
                                return 100
                            }
                            return progress + Math.floor(Math.random() * 3)
                        })
                    }, 100)
                }, 10 * 1000)
            }, 200)
        }, 200)
    }

	useEffect(() => {
        mockProgress()
		return () => {

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
				{messages[phase]}
			</Typography>
		</Box>
	);
}
