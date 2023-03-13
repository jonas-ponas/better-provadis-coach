import React, { useState } from 'react';

import PocketBase, { ListResult } from 'pocketbase';
import { Link as RouterLink, LoaderFunctionArgs, useLoaderData, useSearchParams } from 'react-router-dom';
import { NewsItemRecord } from '../records';
import {
	Alert,
	AlertTitle,
	Box,
	Button,
	Card,
	CardActions,
	CardContent,
	Collapse,
	Link,
	Typography
} from '@mui/material';
import verbalizeDate from '../util/verbalizeDate';
import Icon from '../components/Icon';

interface LoaderResult {
	items?: ListResult<NewsItemRecord>;
}
export function loadNews(client: PocketBase) {
	return async function ({ request }: LoaderFunctionArgs): Promise<LoaderResult> {
		const authorFilter = new URL(request.url).searchParams.get('author');
		const items = await client.collection('news').getList<NewsItemRecord>(0, 20, {
			sort: '-dateCreated',
			filter: authorFilter ? `author = '${decodeURIComponent(authorFilter)}'` : ''
		});
		return {
			items
		};
	};
}

export default function News() {
	const { items } = useLoaderData() as LoaderResult;
	const [searchParams] = useSearchParams();
	const filter = searchParams.get('author');

	return (
		<>
			{items?.items.length == 0 && (
				<Alert icon={<Icon name='information' style='line' />} severity='info'>
					<AlertTitle>Keine News Elemente</AlertTitle>
					News Elemente werden nur im <b>Automatischen Sync</b> synchronisiert. Aktiviere den automatischen
					Sync für News
				</Alert>
			)}
			{filter ? (
				<Box sx={{ mb: 2 }}>
					<Button
						size='small'
						startIcon={<Icon name='close-circle' style='line' />}
						component={RouterLink}
						to=''>
						Filter löschen
					</Button>
				</Box>
			) : undefined}
			{items?.items.map(v => (
				<NewsItem
					title={v.title ?? ''}
					dateCreated={v.dateCreated ?? ''}
					author={v.author ?? ''}
					text={v.text ?? ''}
				/>
			))}
		</>
	);
}

function NewsItem({
	title,
	dateCreated,
	author,
	text
}: {
	title: string;
	dateCreated: string;
	author: string;
	text: string;
}) {
	const [showMore, setShowMore] = useState(false);
	return (
		<Card sx={{ mb: 2 }}>
			<CardContent>
				<Typography variant='h6'>{title}</Typography>
				<Typography sx={{ fontSize: 14 }} color='text.secondary' gutterBottom>
					<b>{verbalizeDate(dateCreated)}</b> von{' '}
					<Link component={RouterLink} to={`?author=${encodeURIComponent(author)}`}>
						{author}
					</Link>
				</Typography>
				<Collapse in={showMore}>
					<Typography sx={{ p: 2 }} variant='body2' dangerouslySetInnerHTML={{ __html: text }} />
				</Collapse>
			</CardContent>
			<CardActions disableSpacing>
				<Button
					size='small'
					onClick={() => setShowMore(x => !x)}
					startIcon={<Icon name={showMore ? 'arrow-up-s' : 'arrow-down-s'} style='line' />}>
					Inhalt {showMore ? 'verstecken' : 'anzeigen'}
				</Button>
			</CardActions>
		</Card>
	);
}
