import React, { MutableRefObject, useContext, useEffect, useRef, useState } from 'react';
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, useTheme } from '@mui/material';
import jsQr from 'jsqr'
import { QrCode } from '@mui/icons-material';
import PocketBaseContext from '../hooks/PocketbaseContext';

export default function ConnectDialog(props: { open: boolean; onClose: (error?: string) => void }) {
	const theme = useTheme()
	const inputRef = useRef<HTMLInputElement>(null);
	const [data, setData] = useState<string>("")
	const client = useContext(PocketBaseContext)

	useEffect(() => {
		
	}, []);

	function onChange(event: React.ChangeEvent<HTMLInputElement>) {
		const input = inputRef.current;
		if(!input) {
			console.log('no input');
			return
		} 
		if(!input.files || !input.files[0]){
			console.log('no input.files, input.files[0]')
			return;
		}
		createImageBitmap(input.files[0]).then(bmp => {
			const c = document.createElement('canvas')
			c.width = bmp.width;
			c.height = bmp.height;
			const xtc = c.getContext('2d')
			xtc?.drawImage(bmp, 0, 0)
			const qrcodeImage = xtc?.getImageData(0, 0, bmp.width, bmp.height)
			if(!qrcodeImage?.data){
				console.log('no qrcodeimage.data')
				return;
			}
			// console.log(qrcodeImage.data, qrcodeImage.width, qrcodeImage.height)
			const data = jsQr(qrcodeImage?.data, qrcodeImage.width, qrcodeImage.height)
			if(!data) return
			const qrcode = JSON.parse(data.data)
			setData(JSON.stringify(qrcode, null, 2))
		})
	}

	async function onConnect() {
		const json = JSON.parse(data)
		if(json?.op == 'add_token' && json?.url == 'hochschule.provadis-coach.de') {
			await client?.collection('state').create({
				refreshToken: json.refresh_token,
				token: json?.token?.access_token||"",
				expires: new Date(json?.token?.expires||"").toISOString(),
				user: client?.authStore.model?.id,
				domainId: json?.domain_id||2,
				url: json?.url||"",
				coachUserId: json?.token?.user_id||-1
			})
			props.onClose()
		} else {
			// errr
		}
	}
	return (
		<Dialog open={props.open}>
			<DialogTitle>Verbinde Coach</DialogTitle>
			<DialogContent>
				<DialogContentText>
					Es scheint, als hättest du noch keinen Coach mit Expert Giggle verbunden. <br />
					Füge einen Screenshot des Coach QR-Codes hier ein:
				</DialogContentText>
				<Box sx={{
					display: 'flex',
					flexDirection: 'column'
				}}>
				<Button variant='contained' component='label'>
					Upload File
					<input type='file' max={1} hidden ref={inputRef} onChange={onChange}/>
				</Button>
				<Box component={'code'} sx={{
					mt: theme.spacing(1)
				}}>{data}</Box>
				</Box>
				

			</DialogContent>
			<DialogActions sx={{
				display: 'flex',
				justifyContent: 'space-between'
			}}>
				<Button onClick={onConnect} color='primary' variant='contained' disabled={data==""}>
					Verbinden
				</Button>
				<Button onClick={() => props.onClose()} color='secondary'>
					Abbrechen
				</Button>
			</DialogActions>
		</Dialog>
	);
}
