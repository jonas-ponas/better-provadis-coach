import React from 'react';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';

interface ConfirmationDialogProps {
	title: string;
	content: string | JSX.Element;
	onClose: () => void;
	onConfirm: () => void;
	open: boolean;
}

export default function ConfirmationDialog({ open, title, content, onClose, onConfirm }: ConfirmationDialogProps) {
	return (
		<Dialog open={open} onClose={onClose} aria-labelledby='confirmation-dialog-title'>
			<DialogTitle id='confirmation-dialog-title'>{title}</DialogTitle>
			<DialogContent>
				<DialogContentText>{content}</DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color='primary'>
					Abbrechen
				</Button>
				<Button variant='outlined' onClick={onConfirm}>
					Ja
				</Button>
			</DialogActions>
		</Dialog>
	);
}
