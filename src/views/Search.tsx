import { Box, useTheme, Icon as MuiIcon, Link, Paper } from '@mui/material';
import pocketbaseEs, { ListResult, Record } from 'pocketbase';
import React from 'react';
import { LoaderFunctionArgs, redirect, useLoaderData, Link as RouterLink } from 'react-router-dom';
import Icon from '../components/Icon';
import SortableTable, { SortableTableProps } from '../components/SortableTable';
import { iconMapping } from '../icons/icons';
import { DirectoryRecord, FileRecord } from '../records';
import verbalizeDate from '../util/verbalizeDate';
import verbalizeFileSize from '../util/verbalizeFileSize';

export function loadSearch(client: pocketbaseEs) {
	return async function ({
		request
	}: LoaderFunctionArgs): Promise<{ files: ListResult<FileRecord>; dirs: ListResult<DirectoryRecord> }> {
		const url = new URL(request.url);
		const q = url.searchParams.get('q');
		if (!q)
			return {
				files: { items: [], page: 0, perPage: 0, totalItems: 0, totalPages: 0 },
				dirs: { items: [], page: 0, perPage: 0, totalItems: 0, totalPages: 0 }
			};

		const inFileName = decodeURIComponent(q)
			.split(' ')
			.map(v => `name ~ "${v}"`)
			.join(' && ');
		const inDirName = decodeURIComponent(q)
			.split(' ')
			.map(v => `name ~ "${v}"`)
			.join(' && ');

		const files = await client.collection('file').getList<FileRecord>(0, 200, {
			filter: inFileName,
			expand: 'parent, parent.parent, parent.parent.parent'
		});
		const dirs = await client.collection('directory').getList<DirectoryRecord>(0, 200, {
			filter: inDirName,
			expand: 'parent, parent.parent, parent.parent.parent'
		});

		return {
			files,
			dirs
		};
	};
}

export default function Search(props: {}) {
	const theme = useTheme();
	const { files, dirs } = useLoaderData() as { files: ListResult<FileRecord>; dirs: ListResult<DirectoryRecord> };

	const tableHeaders: SortableTableProps['header'] = [
		{
			title: '',
			key: 'icon',
			padding: 'checkbox',
			generator: row => {
				if (row.type == 'file') {
					const icon = iconMapping[row.mime || ''];
					if (icon) {
						return (
							<MuiIcon sx={{ fontSize: '1.5em ' }}>
								<img src={icon} />
							</MuiIcon>
						);
					}
					return <Icon name='file' style='line' size='xl' />;
				}
				return <Icon name={'folder'} style='line' size='xl' />;
			}
		},
		{
			title: 'Name',
			key: 'name',
			sortable: true,
			generator(row) {
				return (
					<Link
						component={RouterLink}
						to={`/dir/${row.type === 'file' ?  `${row.directoryId}#${row.id}` : row.id}`}
						sx={{
							color: theme.palette.text.primary,
							textDecorationColor: theme.palette.text.primary
						}}>
						{row.name}
					</Link>
				);
			}
		},
		{
			title: 'Ordner',
			key: 'directory',
			sortable: true
		},
		{
			title: 'Geändert',
			key: 'timestamp',
			sortable: true,
			stringify(value: string) {
				return verbalizeDate(new Date(value));
			}
		}
	];

	function getPath(record: DirectoryRecord): string {
		if(record.name == 'root') return ""
		if (!record.expand?.parent) {
			if (record.name) return "... /" + record.name;
		}
		return getPath(record.expand.parent as DirectoryRecord)+ "/" + record.name
;
	}

	const data = [
		...dirs.items.map(({ name, timestamp, id, collectionId, expand }: DirectoryRecord) => {
			return {
				name,
				timestamp,
				type: 'directory',
				size: undefined,
				id,
				directory: getPath(expand!!.parent as DirectoryRecord)
			};
		}),
		...files.items.map(({ name, size, timestamp, id, expand }: FileRecord) => {
			return {
				name,
				timestamp,
				type: 'file',
				id,
				mime: name.split('.').at(-1),
				directoryId: (expand.parent as Record).id,
				directory: getPath(expand!!.parent as DirectoryRecord)
			};
		})
	];

	return (
		<Box component={Paper}>
			<SortableTable header={tableHeaders} data={data} uniqueKey='id'/>
		</Box>
	);
}
