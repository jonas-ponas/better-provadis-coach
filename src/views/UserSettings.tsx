import React, { useEffect, useState } from 'react';
import {
	Alert,
	AlertTitle,
	Avatar,
	Box,
	Chip,
	Typography,
	useTheme
} from '@mui/material';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { usePocketbase } from '../util/PocketbaseContext';
import CoachDataTable from '../components/CoachDataTable';
import Icon from '../components/Icon';
import { ExternalAuth, Record } from 'pocketbase';
import SettingsTable from '../components/SettingsTable';

export default function UserSettings(props: {}) {
	const theme = useTheme();
	const { rootDir, state, authProviders } = useLoaderData() as {
		rootDir: Record;
		state: Record;
		authProviders: ExternalAuth[];
	};
	const client = usePocketbase();
	const navigate = useNavigate();

	const authProvider = authProviders[0].provider;
	const avatar = `https://coach.***REMOVED***/api/files/${client?.authStore.model?.collectionId}/${client?.authStore.model?.id}/${client?.authStore.model?.avatar}`;

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
					<Typography variant='h6'>{client?.authStore.model?.username}</Typography>
					<Chip
						icon={
							<Box sx={{ height: '1em', color: 'inherit' }}>
								<Icon name={authProvider} style='line' size='fw' />
							</Box>
						}
						label={authProvider == 'github' ? 'Github' : authProvider == 'google' ? 'Google' : 'unbekannt'}
						variant='outlined'
						color='info'
						size='small'
					/>
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
				{state != null && <CoachDataTable data={state} />}
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