import React, { useState } from 'react';
import { Box, Stack, Typography, useTheme } from '@mui/material';
import { json, LoaderFunctionArgs, redirect, useLoaderData, useNavigate } from 'react-router-dom';
import { DirectoryRecord, StateRecord } from '../records';
import SyncButton from '../components/SyncButton';
import FileTable from '../components/FileTable';
import PocketBase, { ClientResponseError } from 'pocketbase';
import verbalizeDate from '../util/verbalizeDate';

export function loadFiles(client: PocketBase, expand: string) {
	return async function ({ params }: LoaderFunctionArgs) {
		const record = await client.collection('directory').getOne<DirectoryRecord>(params.dirId!!, {
			expand
		});
		const state = await client.collection('state').getFirstListItem(`user = '${client.authStore.model?.id}'`);
		return [record, state];
	};
}

export function loadRootDirectory(client: PocketBase) {
	return async () => {
		if (client.authStore.model?.rootDirectory) {
			throw redirect('/dir/' + client.authStore.model?.rootDirectory);
		} else {
			try {
				const record = await client.collection('directory').getFirstListItem<DirectoryRecord>(`parent = null`);
				throw redirect('/dir/' + record.id);
			} catch (e) {
				if (e instanceof Error) {
					if ((e as ClientResponseError).status == 404) {
						throw json({
							name: 'Kein Wurzel-Ordner gefunden',
							description: `Es wurde kein Wurzelordner gefunden. Haben Sie einen Coach verbunden?
							(Ein Coach kann in den Einstellungen mit Expert-Giggle verbunden werden)`
						});
					}
				}
				throw e;
			}
		}
	};
}

export default function Files(props: {}) {
	const theme = useTheme();
	const [directory, state] = useLoaderData() as [DirectoryRecord, StateRecord];
	const navigate = useNavigate();
	const [isSyncing, setIsSyncing] = useState(false);

	return (
		<Box>
			<Stack direction='row' alignItems='center' justifyContent='space-between'>
				<SyncButton
					onSyncFinish={() => {
						setIsSyncing(false);
						navigate(0);
					}}
					onSyncStart={() => {
						setIsSyncing(true);
					}}
				/>
				{!isSyncing && (
					<Typography variant='body2' sx={{ color: theme.palette.grey[500] }}>
						Zuletzt synchronisiert: {state.lastSync ? verbalizeDate(state.lastSync) : 'nie'}
					</Typography>
				)}
			</Stack>
			<Box
				sx={{
					mt: theme.spacing(1)
				}}>
				<FileTable directory={directory} />
			</Box>
		</Box>
	);
}
