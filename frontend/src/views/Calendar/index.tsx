import React, { useCallback, useEffect, useState } from 'react';
import PocketBase, { ClientResponseError } from 'pocketbase';
import { IcalRecord } from '../../records';
import {
	Alert,
	Box,
	ButtonGroup,
	CircularProgress,
	Divider,
	IconButton,
	Popper,
	Stack,
	Typography
} from '@mui/material';
import Icon from '../../components/Icon';
import EditScheduleDialog from './EditScheduleDialog';
import { usePocketbase } from '../../util/PocketbaseContext';
import CopyButton from './CopyButton';
import IcalEventList from './IcalEventList';
import OpenLinkDialog from './OpenLinkDialog';
import { getIcalServiceUrl } from '../../util/serviceUrls';

function useIcalRecord(): [IcalRecord | undefined, () => void, boolean] {
	const client = usePocketbase() as PocketBase;
	const [icalRecord, setIcalRecord] = useState<IcalRecord | undefined>();
	const [isLoading, setIsLoading] = useState(false);

	const fetchData = useCallback(() => {
		setIsLoading(true);
		client
			.collection('icals')
			.getFirstListItem<IcalRecord>(`user = '${client.authStore.model?.id}'`)
			.then(record => {
				setIsLoading(false);
				setIcalRecord(record);
			})
			.catch(e => {
				setIsLoading(false);
				if (e instanceof ClientResponseError && e.status === 404) setIcalRecord(undefined);
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, [client]);

	useEffect(() => {
		fetchData();
	}, []);

	return [icalRecord, fetchData, isLoading];
}

function useIcaldata(): [string | undefined, (id: string) => void, boolean] {
	const [icalData, setIcalData] = useState<string | undefined>();
	const [isLoading, setIsLoading] = useState(false);

	const fetchData = useCallback((id: string) => {
		setIsLoading(true);
		fetch(`${getIcalServiceUrl()}/${id}`)
			.then(response => {
				response.text().then(text => {
					setIsLoading(false);
					setIcalData(text);
				});
			})
			.finally(() => {
				setIsLoading(false);
			});
	}, []);

	return [icalData, fetchData, isLoading];
}

export default function Calendar() {
	const [icalRecord, fetchIcalRecord, isRecordLoading] = useIcalRecord();
	const [icalData, fetchIcalData, isDataLoading] = useIcaldata();
	const [showEditDialog, setShowEditDialog] = useState(false);
	const [showLinkDialog, setShowLinkDialog] = useState<string | null>(null);

	const isLoading = isRecordLoading || isDataLoading;

	useEffect(() => {
		if (icalRecord?.id) {
			fetchIcalData(icalRecord.id);
		}
	}, [icalRecord]);

	console.log({ isLoading, isDataLoading, isRecordLoading });

	return (
		<>
			<Stack justifyContent='space-between' alignItems='center' direction='row' sx={{ px: 2 }}>
				<Typography variant='h5' component='h1'>
					Stundenplan
				</Typography>
				<ButtonGroup>
					<CopyButton textToCopy={`${getIcalServiceUrl()}/${icalRecord?.id}`} disabled={!icalRecord} />
					<IconButton onClick={() => setShowEditDialog(true)}>
						<Icon name='settings-4' style='line' />
					</IconButton>
				</ButtonGroup>
			</Stack>
			<Divider sx={{ my: 1 }} />
			{!isLoading ? (
				<>
					{(!icalRecord || (icalRecord && !icalData)) && (
						<Alert severity='info'>
							<Typography variant='body1'>Du musst deinen Stundenplan zuerst konfigurieren!</Typography>
							<Typography variant='body2' fontStyle='italic'>
								Klicke dazu auf das <Icon name='settings-4' style='line' /> - Symbol oben rechts.
							</Typography>
						</Alert>
					)}
					{icalData && <IcalEventList data={icalData} onClick={event => setShowLinkDialog(event.location)} />}
				</>
			) : (
				<Box sx={{ width: '100%', display: 'flex', justifyContent: 'center' }}>
					<CircularProgress />
				</Box>
			)}

			<EditScheduleDialog
				icalRecord={icalRecord}
				onClose={refresh => {
					if (refresh) fetchIcalRecord();
					setShowEditDialog(false);
				}}
				open={showEditDialog}
			/>
			<OpenLinkDialog
				link={showLinkDialog ?? ''}
				onClose={() => setShowLinkDialog(null)}
				open={showLinkDialog !== null}
			/>
		</>
	);
}
