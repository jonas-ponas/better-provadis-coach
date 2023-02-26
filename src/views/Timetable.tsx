import React, { useEffect, useState } from 'react';
import PocketBase, { ListResult } from 'pocketbase';
import { LoaderFunctionArgs, useLoaderData } from 'react-router-dom';
import { FileRecord, UserRecord } from '../records';
import {
	Alert,
	AlertTitle,
	Avatar,
	Box,
	Divider,
	List,
	ListItemAvatar,
	ListItemButton,
	ListItemText,
	Paper,
	Stack,
	Typography,
	useTheme
} from '@mui/material';
import { decode } from 'html-entities';
import ICAL, { Event } from 'ical.js';
import verbalizeDate from '../util/verbalizeDate';
import { usePocketbase } from '../util/PocketbaseContext';
import Icon from '../components/Icon';
import OpenLinkDialog from '../components/OpenLinkDialog';

export function loadTimeTable(client: PocketBase) {
	return async function ({ request }: LoaderFunctionArgs): Promise<{ files?: ListResult<FileRecord> }> {
		const scheduleDir = (client.authStore.model as UserRecord).scheduleDirectory;
		if (!scheduleDir) return {};
		const files = await client.collection('file').getList<FileRecord>(0, 20, {
			filter: `(name ~ ".ics" || name ~ ".html") && parent.id = '${scheduleDir}'`
		});
		return {
			files
		};
	};
}

export default function TimeTable() {
	const { files } = useLoaderData() as { files?: ListResult<FileRecord> };
	const [vEvents, setVEvents] = useState<Event[]>([]);
	const [showDialog, setShowDialog] = useState<string | null>(null);
	const theme = useTheme();
	const client = usePocketbase();

	useEffect(() => {
		if (!client) return;
		if (files) {
			let fileList = files.items.sort((a, b) => {
				return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
			});
			const icsFile = fileList.find(item => item.name.endsWith('.ics'));
			const htmlFile = fileList.find(item => item.name.endsWith('.html'));
			if (!icsFile || !htmlFile || !icsFile.cachedFile || !htmlFile.cachedFile) return;
			Promise.all([
				fetch(client.getFileUrl(icsFile, icsFile.cachedFile || '')),
				fetch(client.getFileUrl(htmlFile, htmlFile.cachedFile || ''))
			]).then(([r1, r2]) => {
				Promise.all([r1.text(), r2.text()]).then(([icsText, htmlText]) => {
					const jcal = ICAL.parse(icsText);
					const vCalendar = new ICAL.Component(jcal);
					let vComponents = vCalendar.getAllSubcomponents('vevent');
					let vEvents = vComponents
						.map(v => new Event(v, { strictExceptions: false, exceptions: [] }))
						.filter(event => {
							return event.endDate.toJSDate().getTime() > new Date().getTime();
						});
					setVEvents(vEvents);

					const array = Array.from(htmlText.matchAll(/(https:\/\/.*?)'\starget="_blank">(.*?)</g), m => {
						return `${m[2]}##${m[1]}`;
					});
					const links = Array.from(new Set(array)).map(v => {
						const [teacher, link] = v.split('##');
						return { link, teacher: decode(teacher) };
					});
					vEvents = vEvents.map(event => {
						const oldSummary = event.summary;
						event.summary = oldSummary.split('-')[0].trim();
						event.organizer = oldSummary.split('-')[1].trim();
						event.location =
							links.find(link => {
								const teacher = (link.teacher.split(' ').pop() || '').toLowerCase();
								const organizer = (event.organizer.split(' ').pop() || '').toLowerCase();
								return teacher === organizer;
							})?.link || 'undefined';
						return event;
					});
					setVEvents(vEvents);
				});
			});
		}
	}, [files]);

	const eventsToday = vEvents?.filter(p => p.startDate.toJSDate().toDateString() === new Date().toDateString()) || [];
	const eventsFuture =
		vEvents?.filter(p => p.startDate.toJSDate().toDateString() !== new Date().toDateString()) || [];

	const elementMapping = (event: Event, i: number, a: Event[]) => {
		const date = event.startDate.toJSDate();
		return (
			<>
				<ListItemButton onClick={() => setShowDialog(event.location)} disabled={event.location === 'undefined'}>
					<ListItemAvatar>
						<Avatar
							sx={{
								bgcolor: [theme.palette.secondary.dark, theme.palette.primary.dark][
									(date.getDay() % 3) - 1
								]
							}}>
							{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][date.getDay() - 1]}
						</Avatar>
					</ListItemAvatar>
					<ListItemText
						primary={
							<>
								<Typography variant='body1'>{event.summary}</Typography>
							</>
						}
						secondary={
							<Stack direction='row' spacing={1}>
								<Typography variant='body2' color='black'>
									{verbalizeDate(date)}
								</Typography>
								<Typography variant='body2'>{event.organizer}</Typography>
							</Stack>
						}
					/>
				</ListItemButton>
				{i + 1 !== a.length && <Divider />}
			</>
		);
	};

	return (
		<>
			{!files && (
				<Alert variant='filled' severity='warning'>
					<AlertTitle>Kein Stundenplan-Ordner festgelegt!</AlertTitle>
					Markiere einen Ordner als Stundenplan-Ordner um die Stundenpläne daraus hier anzuzeigen. <br />
					<i>
						Es werden dann die aktuelleste .html und .ics Datei des Ordners ausgelesen und hier dargestellt.
						Ein Klick auf das jeweilige Listen-Element springt zum Meeting-Raum.
					</i>
				</Alert>
			)}
			<Typography
				variant='h6'
				sx={{
					mt: theme.spacing(2),
					display: 'flex',
					alignItems: 'center',
					gap: theme.spacing(1)
				}}>
				<Icon name='calendar' style='line' size='sm' />
				Heute
			</Typography>
			{eventsToday.length > 0 ? (
				<List
					component={Paper}
					dense={true}
					sx={{
						mt: theme.spacing(2)
					}}>
					{eventsToday.map(elementMapping)}
				</List>
			) : (
				<Typography
					sx={{
						m: theme.spacing(2),
						textAlign: 'center',
						color: theme.palette.grey[400]
					}}>
					Heute keine Termine 🥳
				</Typography>
			)}
			<Typography
				variant='h6'
				sx={{
					mt: theme.spacing(2),
					display: 'flex',
					alignItems: 'center',
					gap: theme.spacing(1)
				}}>
				<Icon name='calendar-2' style='line' size='sm' />
				Sonstige
			</Typography>
			{eventsFuture.length > 0 ? (
				<List
					component={Paper}
					dense={true}
					sx={{
						mt: theme.spacing(2)
					}}>
					{eventsFuture.map(elementMapping)}
				</List>
			) : (
				<Typography
					sx={{
						m: theme.spacing(2),
						textAlign: 'center',
						color: theme.palette.grey[400]
					}}>
					Keine Termine 🥳
				</Typography>
			)}
			<OpenLinkDialog link={showDialog ?? ''} onClose={() => setShowDialog(null)} open={showDialog !== null} />
		</>
	);
}