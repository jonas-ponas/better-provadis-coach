import React, { useEffect, useMemo, useState } from 'react';
import { FileRecord, IcalRecord } from '../../records';
import Dialog from '@mui/material/Dialog';
import DialogTitle from '@mui/material/DialogTitle';
import DialogContent from '@mui/material/DialogContent';
import DialogContentText from '@mui/material/DialogContentText';
import DialogActions from '@mui/material/DialogActions';
import Button from '@mui/material/Button';
import { Alert, Box, CircularProgress, IconButton, Stack, Typography } from '@mui/material';
import Icon from '../../components/Icon';
import MultipleSelect from './MultipleSelect';
import { usePocketbase } from '../../util/PocketbaseContext';

export default function EditScheduleDialog({
	icalRecord,
	open,
	onClose
}: {
	icalRecord?: IcalRecord;
	open: boolean;
	onClose: (refresh?: boolean) => void;
}) {
	const [isSaving, setIsSaving] = useState(false);
	const [files, setFiles] = useState<FileRecord[]>([]);
	const [selected, setSelected] = useState<string[]>([]);
	const client = usePocketbase();

	useEffect(() => {
		if (!client) return;
		client
			.collection('file')
			.getList<FileRecord>(0, 40, {
				filter: `(name ~ ".ics" || name ~ ".html")`
			})
			.then(response => {
				setFiles(response.items);
			});
		if (icalRecord) setSelected(icalRecord.fileList ?? []);
	}, [client, icalRecord]);

	const availableSchedules = useMemo(() => {
		let a = files
			.filter((p, i, a) => {
				const [name, ext] = p.name.split('.');
				if (ext == 'html') return a.findIndex(v => v.name === `${name}.ics`) >= 0;
				if (ext == 'ics') return a.findIndex(v => v.name === `${name}.html`) >= 0;
			})
			.map(v => v.name.split('.')[0]);
		a = [...new Set(a)];
		return a;
	}, [files]);

	const onSave = () => {
		if (!client) return;
		setIsSaving(true);
		if (icalRecord) {
			client
				.collection('icals')
				.update(icalRecord.id, {
					fileList: JSON.stringify(selected)
				})
				.then(() => {
					onClose(true);
				})
				.finally(() => {
					setIsSaving(false);
				});
		} else {
			client
				.collection('icals')
				.create({
					user: client.authStore.model?.id,
					fileList: JSON.stringify(selected)
				})
				.then(() => {
					onClose(true);
				})
				.finally(() => {
					setIsSaving(false);
				});
		}
	};

	return (
		<Dialog open={open} onClose={() => onClose(false)} aria-labelledby='edit-calendar-dialog'>
			<DialogTitle
				sx={{
					display: 'flex',
					flexDirection: 'row',
					justifyContent: 'space-between',
					position: 'relative'
				}}>
				<Typography id='edit-calendar-dialog' variant='h6' component='h1'>
					Kalender-Einstellungen
				</Typography>
				<IconButton sx={{ position: 'relative', top: -10, right: -10 }} onClick={() => onClose(false)}>
					<Icon name='close' style='line' />
				</IconButton>
			</DialogTitle>
			<DialogContent sx={{ minWidth: 500, px: 3, pb: 3 }}>
				<Stack gap={0}>
					<Typography variant='body1'>Ausgewählt:</Typography>
					<Box sx={{ mb: 2 }}>
						{selected.length === 0 && (
							<Typography fontStyle='italic' variant='body2'>
								Keine Stundenpläne ausgewählt
							</Typography>
						)}
						{selected.map(s => (
							<Typography variant='body2' key={s}>
								- {s}
							</Typography>
						))}
					</Box>
					<MultipleSelect
						options={availableSchedules}
						defaultValue={icalRecord?.fileList ?? []}
						onChange={(newValue: string[]) => {
							setSelected(newValue);
						}}
						help='Wähle alle Stundenpläne aus die auf dich zutreffen.'
					/>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button
					onClick={onSave}
					variant='contained'
					startIcon={<Icon name='save' style='line' size='sm' />}
					sx={{
						height: 35
					}}
					disabled={isSaving}
					color='primary'>
					Save
				</Button>
			</DialogActions>
		</Dialog>
	);
}
