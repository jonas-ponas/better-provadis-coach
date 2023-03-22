import React from 'react';
import {
	Alert,
	AlertTitle,
	Avatar,
	Box,
	Chip,
	Paper,
	Stack,
	TableContainer,
	Typography,
	useTheme
} from '@mui/material';
import { useLoaderData } from 'react-router-dom';
import { usePocketbase } from '../util/PocketbaseContext';
import Icon, { IconProps } from '../components/Icon';
import pocketbaseEs, { ExternalAuth, Record } from 'pocketbase';
import SettingsTable from '../components/SettingsTable';
import { DirectoryRecord, StateRecord } from '../records';
import SortableTable, { SortableTableProps } from '../components/SortableTable';
import { ICON_MAP } from '../icons/providerIcons';

export function loadUserSettings(client: pocketbaseEs) {
	return async () => {
		let rootDir = undefined;

		let authProviders: ExternalAuth[] = [];
		let state: StateRecord | null = null;
		if (client.authStore.model?.rootDirectory) {
			try {
				rootDir = await client
					.collection('directory')
					.getOne<DirectoryRecord>(client.authStore.model?.rootDirectory);
			} catch (e) {}
		}

		try {
			authProviders = await client.collection('users').listExternalAuths(client.authStore.model!!.id);
		} catch (e) {}

		try {
			state = await client.collection('state').getFirstListItem(`user.id = "${client.authStore.model!!.id}"`);
		} catch (e) {}
		return {
			state,
			rootDir,
			authProviders
		};
	};
}

export default function UserSettings(props: {}) {
	const theme = useTheme();
	const { rootDir, state, authProviders } = useLoaderData() as {
		rootDir?: DirectoryRecord;
		state: StateRecord;
		authProviders: ExternalAuth[];
	};
	const client = usePocketbase();
	let avatar = client?.authStore.model?.avatarUrl;

	console.log(authProviders);

	return (
		<Box>
			<Box
				sx={{
					display: 'flex',
					flexDirection: 'row',
					alignItems: 'center'
				}}>
				<Avatar src={avatar} alt={(client?.authStore.model?.username || 'u').toUpperCase()} />
				<Box sx={{ ml: theme.spacing(2) }}>
					<Typography variant='h6'>{client?.authStore.model?.name}</Typography>
					<Stack direction='row' gap={1}>
						{authProviders.map(({ provider }) => {
							const icon = ICON_MAP[provider];
							return (
								<Chip
									icon={
										<Box sx={{ height: '1em', color: 'inherit' }}>
											<Icon name={icon?.name ?? 'question-mark'} style={icon?.style} size='fw' />
										</Box>
									}
									label={provider}
									sx={{ textTransform: 'capitalize' }}
									variant='outlined'
									color='info'
									size='small'
								/>
							);
						})}
					</Stack>
				</Box>
			</Box>
			<Box
				sx={{
					mt: theme.spacing(2)
				}}>
				<SettingsTable state={state} rootDir={rootDir} />
			</Box>
			<Box
				sx={{
					mt: theme.spacing(2)
				}}>
				{state != null && (
					<Box component={Paper}>
						<Typography
							variant='body2'
							fontWeight='bold'
							sx={{
								pl: theme.spacing(2),
								pt: theme.spacing(1)
							}}>
							Gespeicherte Daten
						</Typography>
						<SortableTable
							size='small'
							header={[
								{
									title: 'Einstellung',
									key: 'key',
									fixedWidth: 230,
									sortable: true
								},
								{
									title: 'Wert',
									key: 'value',
									sortable: true
								}
							]}
							uniqueKey={'key'}
							data={[
								{ key: 'Benutzername / ID', value: `${state?.coachUsername} / ${state?.coachUserId}` },
								{ key: 'URL / Domänen-ID', value: `${state?.url} / ${state?.domainId}` },
								{
									key: 'Letzte Synchronisierung',
									value: new Date(state?.lastSync || '').toLocaleString('de-de')
								},
								{
									key: 'Letzter Antwort-Hash',
									value: `${state?.lastFilesHash} / ${state?.lastNewsHash}`
								}
							]}
						/>
					</Box>
				)}
				{state == null && (
					<Alert variant='filled' severity='warning'>
						<AlertTitle>Kein Coach verbunden!</AlertTitle>
						Verbinden Sie einen Coach über den Button "Verbinden"
					</Alert>
				)}
			</Box>
		</Box>
	);
}
