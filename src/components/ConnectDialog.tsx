import React from 'react';
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from '@mui/material';


export default function ConnectDialog(props: { open: boolean; onClose: () => void }) {
	return (
		<Dialog open={props.open}>
			<DialogTitle>Verbinde Coach</DialogTitle>
			<DialogContent>
				<DialogContentText>
          Es scheint, als hättest du noch keinen Coach mit Expert Giggle verbunden. <br/>
          Mache einfach einen Screenshot vom Coach QR-Code der auf der offiziellen Coach Webiste angezeigt wird. Lade diesen anschließend hier hoch.
        </DialogContentText>
			</DialogContent>
			<DialogActions>
				<Button onClick={() => props.onClose()} color='primary'>
					Abbrechen
				</Button>
			</DialogActions>
		</Dialog>
	);
}
