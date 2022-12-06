import React, { useState } from 'react';
import { Dialog, DialogContent, DialogContentText, DialogTitle, useTheme, Typography, Box } from '@mui/material';
import SyncProgress from './SyncProgress';
import { ErrorOutline } from '@mui/icons-material';

export default function SyncDialog(props: { open: boolean; onFinished: (error?: string) => void }) {
	const theme = useTheme();
	const [dismissible, setDismissible] = useState<boolean>(false);
	const [error, setError] = useState<string | undefined>(undefined);

	function handleClose(event: {}, reason: string) {
		if (dismissible) {
			props.onFinished(error);
		}
		if ((reason && reason == 'escapeKeyDown') || reason == 'backDropClick') return;
	}

	function handleFinish(error?: string) {
		if (!error) return props.onFinished();
		setDismissible(true);
		setError(error);
	}

	return (
		<Dialog open={props.open} onClose={handleClose} onBackdropClick={() => {}} disableEscapeKeyDown={true}>
			<DialogContent
				sx={{
					display: 'flex',
					justifyContent: 'center'
				}}
			>
				{!error && <SyncProgress onFinish={handleFinish} />}
				{error && (
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							justifyContent: 'center',
							alignItems: 'center',
							minWidth: 250
						}}
					>
						<ErrorOutline
							fontSize='large'
							sx={{
								color: theme.palette.error.main
							}}
						/>
						<Typography variant='body2' sx={{ mt: theme.spacing(2), color: theme.palette.error.main }}>
							{error}
						</Typography>
					</Box>
				)}
			</DialogContent>
		</Dialog>
	);
}
