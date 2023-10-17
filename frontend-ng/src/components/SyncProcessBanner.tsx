import { forwardRef, useEffect, useState } from 'react';
import { CustomContentProps, SnackbarContent, closeSnackbar } from 'notistack';
import { Notification as MantineNotification } from '@mantine/core';
import EventSource from 'eventsource';
import { usePocketbase } from '../pocketbase';
import { Check, Close } from './RemixIcon';

declare module 'notistack' {
	interface VariantOverrides {
		syncBanner: true;
	}
}

export interface SyncProcessBannerProps {
	userId: string;
}

// Message Types
type CloseMessage = { type: 'close'; success: boolean; reason: string };
type ProgressMessage = { type: 'progress'; stage: string; message?: string; [key: string]: any };

const SyncProcessBanner = forwardRef<HTMLDivElement, SyncProcessBannerProps & CustomContentProps>(
	({ id, ...props }, ref) => {
		const pocketbase = usePocketbase();
		const [title, setTitle] = useState<string>('Starte Synchronisierung');
		const [text, setText] = useState<string>();
		/*
		dump 4
		coach 2
		directory-sync
		file-sync
		file-diff
		file-insert
		*/
		const [success, setSuccess] = useState(false);
		const [loading, setLoading] = useState(true);

		function handleCloseMessage(message: CloseMessage, close: VoidFunction) {
			setLoading(false);
			setSuccess(message.success);
			setText(message.reason);
			setTimeout(() => {
				closeSnackbar(id);
				close();
			}, 2 * 1000);
		}

		function handleProgressMessage(message: ProgressMessage) {
			switch (message.stage) {
				case 'dump':
					setTitle('Export');
					setText('Exportiere Daten aus Datenbank');
					break;
				case 'coach':
					setTitle('Coach-Anmeldung');
					setText('Anmeldung beim Provadis-Coach');
					break;
				case 'directory-sync':
					setTitle('Synchronisiere Coach Daten');
					setText('Rufe Ordner-Struktur ab');
					break;
				case 'file-sync':
					setText('Rufe Dateien ab');
					break;
				case 'file-diff':
					setText('Berechne Datei Differenz');
					break;
				case 'file-insert':
					setText('Füge Dateien in Datenbank ein');
					break;
			}
		}

		useEffect(() => {
			const url = `${window.location.protocol}//${window.location.host}/sync/${pocketbase.authStore.model?.id}`;
			const events = new EventSource(url, {
				headers: {
					Authorization: pocketbase.authStore.token
				}
			});

			events.onmessage = event => {
				console.log(event);
				const parsedData = JSON.parse(event.data);
				if (parsedData.type) {
					switch (parsedData.type) {
						case 'progress':
							handleProgressMessage(parsedData as ProgressMessage);
							break;
						case 'close':
							handleCloseMessage(parsedData as CloseMessage, () => events.close());
							break;
						default:
							console.warn(`Unknown Message type: `, parsedData.type);
					}
				}
				if (parsedData.message) {
					setText(parsedData.message);
				}
			};

			events.onerror = _ => {
				setSuccess(false);
				setLoading(false);
				setText('Ein Fehler ist beim Verbindungsaufbau aufgetreten!');
				setTitle('Fehler!');
				events.close();
				setTimeout(() => {
					closeSnackbar(id);
				}, 5 * 1000);
			};

			events.onopen = () => {};
		}, []);

		return (
			<SnackbarContent ref={ref}>
				<MantineNotification
					{...props}
					// sx={{ width: 200 }}
					withCloseButton={false}
					loading={loading}
					title={title}
					color={loading ? undefined : success ? 'green' : 'red'}
					icon={loading ? undefined : success ? <Check /> : <Close />}>
					{text}
				</MantineNotification>
			</SnackbarContent>
		);
	}
);

export default SyncProcessBanner;
