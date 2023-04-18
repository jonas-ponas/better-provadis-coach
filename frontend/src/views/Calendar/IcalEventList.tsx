import React, { useEffect, useMemo } from 'react';
import ICAL, { Event } from 'ical.js';
import {
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
import verbalizeDate, { dateToRelativeTimeString } from '../../util/verbalizeDate';
import Icon from '../../components/Icon';

export interface IcalEventListProps {
	data: string;
	onClick: (event: Event) => void;
}

export default function IcalEventList({ data, onClick }: IcalEventListProps) {
	const theme = useTheme();

	const vEvents = useMemo(() => {
		const jcal = ICAL.parse(data);
		const vCalendar = new ICAL.Component(jcal);
		let vComponents = vCalendar.getAllSubcomponents('vevent');
		let vEvents = vComponents
			.map(v => new Event(v, { strictExceptions: false, exceptions: [] }))
			.filter(event => {
				return event.endDate.toJSDate().getTime() > new Date().setHours(0, 0, 0, 0);
			});
		return vEvents;
	}, [data]);

	const eventsThisWeek = useMemo(() => {
		if (!vEvents) return [];
		const today = new Date();
		const weekStart = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay());
		const weekEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);

		return vEvents?.filter(p => {
			return p.startDate.toJSDate() >= weekStart && p.startDate.toJSDate() <= weekEnd;
		});
	}, [vEvents]);

	const eventsFuture = useMemo(() => {
		const today = new Date();
		const weekEnd = new Date(today.getFullYear(), today.getMonth(), today.getDate() - today.getDay() + 6);
		return vEvents?.filter(p => p.startDate.toJSDate() > weekEnd);
	}, [vEvents]);

	const Title = ({ text, icon }: { text: string; icon: string }) => (
		<Typography
			variant='h6'
			sx={{
				my: theme.spacing(1),
				display: 'flex',
				alignItems: 'center',
				gap: theme.spacing(1)
			}}>
			<Icon name={icon} style='line' size='sm' />
			{text}
		</Typography>
	);

	return (
		<Box
			sx={{
				mx: theme.spacing(2)
			}}>
			<Title text='Diese Woche' icon='calendar' />
			<EventList events={eventsThisWeek} onClick={onClick} />
			<Title text='Sonstige' icon='calendar-2' />
			<EventList events={eventsFuture} onClick={onClick} />
		</Box>
	);
}

function EventList({ events, onClick }: { events: Event[]; onClick: (event: Event) => void }) {
	const theme = useTheme();

	if (events.length === 0)
		return (
			<Typography
				sx={{
					m: theme.spacing(2),
					textAlign: 'center',
					color: theme.palette.grey[400]
				}}>
				Keine Termine 🥳
			</Typography>
		);
	return (
		<List component={Paper} dense={true}>
			{events.map((event, i, a) => {
				const date = event.startDate.toJSDate();
				const relative = dateToRelativeTimeString(date);
				const bgcolor = [theme.palette.secondary.dark, theme.palette.primary.dark][(date.getDay() % 3) - 1];
				return (
					<>
						<ListItemButton onClick={() => onClick(event)} disabled={event.location === 'undefined'}>
							<ListItemAvatar>
								<Avatar sx={{ bgcolor }}>
									{['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'][date.getDay() - 1]}
								</Avatar>
							</ListItemAvatar>
							<ListItemText
								primary={<Typography variant='body1'>{event.summary}</Typography>}
								secondary={
									<Stack direction='row' spacing={1}>
										<Typography variant='body2' color='black'>
											{date.toLocaleString('de', {
												minute: '2-digit',
												hour: '2-digit',
												day: 'numeric',
												month: 'long'
											})}
											{relative && ` (${relative})`}
										</Typography>
									</Stack>
								}
							/>
						</ListItemButton>
						{i + 1 !== a.length && <Divider />}
					</>
				);
			})}
		</List>
	);
}
