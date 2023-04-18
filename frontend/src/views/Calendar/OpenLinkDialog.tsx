import { ThemeContext } from '@emotion/react';
import {
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Link,
	useTheme
} from '@mui/material';
import React from 'react';
import Icon from '../../components/Icon';

export default function OpenLinkDialog({ link, open, onClose }: { link: string; open: boolean; onClose: () => void }) {
	const theme = useTheme();
	return (
		<Dialog open={open} onClose={onClose}>
			<DialogTitle id={'open-meeting'}>Besprechung beitreten?</DialogTitle>
			<DialogContent>
				<DialogContentText>
					Möchtest du wirklich folgendem Meeting beitreten?
					<br />
					<code>{link}</code>
				</DialogContentText>
			</DialogContent>
			<DialogActions
				sx={{
					display: 'flex',
					justifyContent: 'space-between',
					px: theme.spacing(3),
					mb: theme.spacing(1)
				}}>
				<Button href={link} target='_blank' color='primary' variant='outlined'>
					Öffnen
					<Box sx={{ ml: theme.spacing(1) }}>
						<Icon name='external-link' style='line' />
					</Box>
				</Button>
				<Button onClick={onClose} color='error' variant='contained'>
					Abbrechen
				</Button>
			</DialogActions>
		</Dialog>
	);
}
