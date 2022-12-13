import React, { MutableRefObject, useContext, useEffect, useRef, useState } from 'react';
import {
	Alert,
	AlertColor,
	Box,
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Snackbar,
	TextField,
	Typography,
	useTheme
} from '@mui/material';
import jsQr from 'jsqr';
import { usePocketbase } from '../util/PocketbaseContext';
import Icon from './Icon';
import { TextIncrease } from '@mui/icons-material';

export default function ConnectDialog(props: { open: boolean; onClose: (success?: boolean) => void }) {
	const theme = useTheme();
	const client = usePocketbase();

	const inputRef = useRef<HTMLInputElement>(null);
	const textFieldRef = useRef<HTMLTextAreaElement>(null);
	const [data, setData] = useState<string>('');
	const [showSnackbar, setShowSnackbar] = useState<{ type: string; message: string } | undefined>(undefined);

	function onChangeImage(event: React.ChangeEvent<HTMLInputElement>) {
		const input = inputRef.current;
		if (!input) {
			console.log('no input');
			return;
		}
		if (!input.files || !input.files[0]) {
			console.log('no input.files, input.files[0]');
			return;
		}
		createImageBitmap(input.files[0]).then(bmp => {
			const c = document.createElement('canvas');
			c.width = bmp.width;
			c.height = bmp.height;
			const xtc = c.getContext('2d');
			xtc?.drawImage(bmp, 0, 0);
			const qrcodeImage = xtc?.getImageData(0, 0, bmp.width, bmp.height);
			if (!qrcodeImage?.data) {
				setShowSnackbar({ type: 'error', message: 'Fehler beim Auslesen des Qr-Codes' });
				console.log('no qrcodeimage.data');
				return;
			}
			const data = jsQr(qrcodeImage?.data, qrcodeImage.width, qrcodeImage.height);
			if (!data) {
				setShowSnackbar({ type: 'error', message: 'Fehler beim Auslesen des Qr-Codes' });
				return;
			}
			const qrcode = JSON.parse(data.data);
			setData(JSON.stringify(qrcode));
			textFieldRef.current!!.value = JSON.stringify(qrcode);
		});
	}

	function onChangeTextField(event: React.ChangeEvent<HTMLTextAreaElement>) {
		// TODO: Check if QR-Code looks right
	}

	async function onSubmit() {
		let json;
		if (data) {
			json = JSON.parse(data);
		} else {
			json = JSON.parse(textFieldRef.current!!.value);
		}
		if (json?.op == 'add_token' && json?.url == 'hochschule.provadis-coach.de') {
			try {
				await client?.collection('state').create({
					refreshToken: json.refresh_token,
					token: json?.token?.access_token || '',
					expires: new Date(json?.token?.expires || '').toISOString(),
					user: client?.authStore.model?.id,
					domainId: json?.domain_id || 2,
					url: json?.url || '',
					coachUserId: json?.token?.user_id || -1
				});
				setShowSnackbar({ type: 'success', message: 'Erfolgreich verbunden!' });
				props.onClose(true);
			} catch (e) {
				setShowSnackbar({ type: 'error', message: 'Fehler beim Hochladen der Daten!' });
			}
		} else {
			setShowSnackbar({ type: 'error', message: 'Die Daten sind fehlerhaft! Bitte überprüfen!' });
		}
	}
	return (
		<>
			<Dialog open={props.open}>
				<DialogTitle>Coach verbinden</DialogTitle>
				<DialogContent>
					<Box
						sx={{
							display: 'flex',
							flexDirection: 'column',
							mt: theme.spacing(1)
						}}>
						<Typography>Lade einen Screenshot des Coach QR-Codes hier ein:</Typography>
						<Button
							variant='contained'
							component='label'
							size='small'
							startIcon={<Icon name='qr-code' style='line' />}
							sx={{
								mt: theme.spacing(1)
							}}>
							QR-Code
							<input type='file' max={1} hidden ref={inputRef} onChange={onChangeImage} />
						</Button>
						<Typography sx={{ mt: theme.spacing(1) }}>oder füge den QR-Code Inhalt hier ein:</Typography>
						<TextField
							label='QR-Code Inhalt'
							multiline
							inputRef={textFieldRef}
							rows={4}
							defaultValue={data}
							sx={{
								mt: theme.spacing(2)
							}}
							onChange={onChangeTextField}
						/>
					</Box>
				</DialogContent>
				<DialogActions
					sx={{
						display: 'flex',
						justifyContent: 'space-between'
					}}>
					<Button onClick={onSubmit} color='primary' variant='contained'>
						Verbinden
					</Button>
					<Button onClick={() => props.onClose(false)} color='primary'>
						Abbrechen
					</Button>
				</DialogActions>
			</Dialog>
			<Snackbar
				open={showSnackbar != undefined}
				autoHideDuration={10000}
				onClose={() => setShowSnackbar(undefined)}>
				<Alert
					variant='filled'
					onClose={() => setShowSnackbar(undefined)}
					severity={(showSnackbar?.type || 'info') as AlertColor}
					sx={{ width: '100%' }}>
					{showSnackbar?.message}
				</Alert>
			</Snackbar>
		</>
	);
}
