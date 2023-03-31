import React, { useCallback, useEffect, useState } from 'react';
import { LoaderFunctionArgs, useLoaderData, useNavigate } from 'react-router-dom';
import PocketBase, { ClientResponseError, ListResult } from 'pocketbase';
import { IcalRecord } from '../../records';
import { Alert, ButtonGroup, Divider, IconButton, Stack, Typography } from '@mui/material';
import Icon from '../../components/Icon';
import EditScheduleDialog from './EditScheduleDialog';
import { usePocketbase } from '../../util/PocketbaseContext';

export function loadCalendar(client: PocketBase) {
	return async function () {
		try {
			return await client
				.collection('icals')
				.getFirstListItem<IcalRecord>(`user = '${client.authStore.model?.id}'`);
		} catch (e) {
			if (e instanceof ClientResponseError && e.status === 404) return undefined;
			throw e;
		}
	};
}

function useIcalRecord(): [IcalRecord | undefined, () => void] {
	const client = usePocketbase() as PocketBase;
	const [icalRecord, setIcalRecord] = useState<IcalRecord | undefined>();

	const fetchData = useCallback(() => {
		client
			.collection('icals')
			.getFirstListItem<IcalRecord>(`user = '${client.authStore.model?.id}'`)
			.then(record => {
				setIcalRecord(record);
			})
			.catch(e => {
				if (e instanceof ClientResponseError && e.status === 404) setIcalRecord(undefined);
			});
	}, [client]);

	useEffect(() => {
		fetchData();
	}, []);

	return [icalRecord, fetchData];
}

function useIcaldata(): [string | undefined, (id: string) => void] {
	const [icalData, setIcalData] = useState<string | undefined>();
	const serviceUrlEnv = import.meta.env.VITE_ICAL_SERVICE_URI as string;
	let serviceUrl: string;
	if (!serviceUrlEnv) {
		serviceUrl = `${window.location.protocol}//${window.location.host}/ical`;
	} else if (serviceUrlEnv.startsWith('/')) {
		serviceUrl = `${window.location.protocol}//${window.location.host}${serviceUrlEnv}`;
	} else {
		serviceUrl = serviceUrlEnv;
	}
	const fetchData = useCallback((id: string) => {
		fetch(`${serviceUrl}/${id}`).then(response => {
			response.text().then(text => {
				setIcalData(text);
			});
		});
	}, []);

	return [icalData, fetchData];
}

export default function Calendar() {
	const [icalRecord, fetchIcalRecord] = useIcalRecord();
	const [icalData, fetchIcalData] = useIcaldata();
	const [showDialog, setShowDialog] = useState(false);

	useEffect(() => {
		if (icalRecord?.id) {
			fetchIcalData(icalRecord.id);
		}
	}, [icalRecord]);

	return (
		<>
			<Stack justifyContent='space-between' alignItems='center' direction='row'>
				<Typography variant='h5' component='h1'>
					Deine Termine
				</Typography>
				<ButtonGroup>
					<IconButton>
						<Icon name='links' style='line' />
					</IconButton>
					<IconButton onClick={() => setShowDialog(true)}>
						<Icon name='settings-4' style='line' />
					</IconButton>
				</ButtonGroup>
			</Stack>
			<Divider sx={{ my: 2 }} />
			{!icalRecord && <Alert severity='info'>Du musst den Kalender erst konfigurieren!</Alert>}
			{icalData && <pre>{icalData}</pre>}

			<EditScheduleDialog
				icalRecord={icalRecord}
				onClose={refresh => {
					if (refresh) fetchIcalRecord();
					setShowDialog(false);
				}}
				open={showDialog}
			/>
		</>
	);
}
