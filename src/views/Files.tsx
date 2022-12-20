import React, { useState } from 'react';
import { Box, useTheme } from '@mui/material';
import { json, LoaderFunctionArgs, redirect, useLoaderData, useNavigate } from 'react-router-dom';
import { DirectoryRecord } from '../records';
import SyncButton from '../components/SyncButton';
import FileTable from '../components/FileTable';
import pocketbaseEs, { ClientResponseError } from 'pocketbase';

export function loadFiles(client: pocketbaseEs, expand: string) {
	return async function ({ params }: LoaderFunctionArgs) {
		const record = await client.collection('directory').getOne<DirectoryRecord>(params.dirId!!, {
			expand
		});
		return record;
	};
}

export function loadRootDirectory(client: pocketbaseEs) {
	return async () => {
		if (client.authStore.model?.rootDirectory) {
			throw redirect('/dir/' + client.authStore.model?.rootDirectory);
		} else {
			try {
				const record = await client
					.collection('directory')
					.getFirstListItem<DirectoryRecord>(`parent = null`);
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
	}
}

export default function Files(props: {}) {
	const theme = useTheme();
	const loaderData = useLoaderData() as DirectoryRecord;
	const navigate = useNavigate();

	return (
		<Box>
			<Box>
				<SyncButton callback={() => navigate(0)} />
			</Box>
			<Box
				sx={{
					mt: theme.spacing(1)
				}}>
				<FileTable directory={loaderData} />
			</Box>
		</Box>
	);
}
