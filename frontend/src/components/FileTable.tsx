import React, { useEffect, useState } from 'react';
import {
	IconButton,
	Link,
	useTheme,
	Icon as MuiIcon,
	TableContainer,
	Paper,
	Box,
	Menu,
	MenuItem,
	ListItemIcon,
	modalClasses,
	Tooltip
} from '@mui/material';
import { useNavigate, Link as RouterLink, useLocation } from 'react-router-dom';
import { DirectoryRecord, FileRecord } from '../records';
import { usePocketbase } from '../util/PocketbaseContext';
import verbalizeDate from '../util/verbalizeDate';
import verbalizeFileSize from '../util/verbalizeFileSize';
import Icon from './Icon';
import SortableTable, { SortableTableProps } from './SortableTable';

import icons, { iconMapping } from '../icons/icons';
import PathBreadcrumb from './PathBreadcrump';

type RowData = {
	id: string;
	name: string;
	timestamp: string;
	type: string;
	size?: number;
	mime?: string;
	record: FileRecord | DirectoryRecord;
};

export default function FileTable({ directory }: { directory: DirectoryRecord }) {
	const theme = useTheme();
	const client = usePocketbase();
	const navigate = useNavigate();
	const location = useLocation();

	const [data, setData] = useState<RowData[]>([]);
	const [menuAnchorEl, setMenuAnchorEl] = useState<null | { target: HTMLElement; id: string }>(null);

	useEffect(() => {
		setData([]);
		const p1 = client?.collection('file').getFullList<FileRecord>(undefined, {
			filter: `parent.id = "${directory.id}"`
		});

		const p2 = client?.collection('directory').getFullList<DirectoryRecord>(undefined, {
			filter: `parent.id = "${directory.id}"`
		});

		Promise.all([p1, p2])
			.then(([files, directories]) => {
				if (!files || !directories) return;
				const transformFiles = files.map((record: FileRecord) => {
					return {
						name: record.name,
						size: record.size,
						timestamp: record.timestamp,
						type: 'file',
						id: record.id,
						mime: record.name.split('.').at(-1),
						record
					};
				});
				const transformDirectories = directories.map((record: DirectoryRecord) => {
					return {
						name: record.name,
						timestamp: record.timestamp,
						type: 'directory',
						size: undefined,
						id: record.id,
						record
					};
				});
				setData([...transformFiles, ...transformDirectories]);
			})
			.catch(e => {
				// TODO: Error Handling
			});
	}, [directory]);

	function onRowClick(row: RowData) {
		if (row.type == 'directory') {
			return navigate(`/dir/${row.id}`);
		}
	}

	function onMenuClick(recordId: string) {
		return function (event: React.MouseEvent) {
			event.stopPropagation();
			if (event.currentTarget instanceof HTMLElement) {
				setMenuAnchorEl({ target: event.currentTarget, id: recordId });
			}
		};
	}

	async function onSetRootDir(event: React.MouseEvent) {
		if (menuAnchorEl === null) return;
		try {
			await client?.collection('users').update(client.authStore.model!!.id, {
				rootDirectory: menuAnchorEl.id
			});
		} catch (e) {
			console.error(e);
		} finally {
			setMenuAnchorEl(null);
		}
	}

	const tableHeaders: SortableTableProps['header'] = [
		{
			title: '',
			key: 'icon',
			padding: 'checkbox',
			generator: (row: RowData) => {
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
				const isRootDir = row.id == client?.authStore.model?.rootDirectory;
				if (isRootDir) return <Icon name='folder-user' style='fill' size='xl' />;
				return <Icon name='folder' style='line' size='xl' />;
			}
		},
		{
			title: 'Name',
			key: 'name',
			sortable: true,
			generator(row: RowData) {
				if (row.type == 'file') {
					if (!client) return <>{row.name}</>;
					const url = client.getFileUrl(row.record, row.record.cachedFile);
					if (row.record.cachedFile === '') {
						return (
							<Tooltip
								title={
									<>
										Datei-Format wird nicht unterstützt. Bitte lade diese Datei im richtigen Coach
										runter
									</>
								}>
								<Box
									sx={{
										color: theme.palette.text.primary,
										textDecorationColor: theme.palette.text.primary
									}}>
									{row.name}
								</Box>
							</Tooltip>
						);
					}
					return (
						<Link
							href={url}
							target='_blank'
							sx={{
								color: theme.palette.text.primary,
								textDecorationColor: theme.palette.text.primary
							}}>
							{row.name}
						</Link>
					);
				}
				return (
					<Link
						component={RouterLink}
						to={`/dir/${row.id}`}
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
			title: 'Größe',
			key: 'size',
			sortable: true,
			stringify(value: number) {
				if (!value) return '';
				return verbalizeFileSize(value);
			}
		},
		{
			title: 'Geändert',
			key: 'timestamp',
			sortable: true,
			stringify(value: string) {
				return verbalizeDate(new Date(value));
			}
		},
		{
			title: '',
			key: 'action',
			align: 'right',
			padding: 'checkbox',
			generator(row) {
				return (
					<IconButton
						sx={{ p: 0, visibility: row.type == 'file' ? 'hidden' : 'visible' }}
						disabled={row.type == 'file'}
						onClick={onMenuClick(row.id)}>
						<Icon name='more-2' style='line' />
					</IconButton>
				);
			}
		}
	];

	const isRootDir = menuAnchorEl?.id == client?.authStore.model?.rootDirectory;
	return (
		<TableContainer component={Paper} elevation={1}>
			<Box
				sx={{
					display: 'flex',
					p: theme.spacing(1)
				}}>
				{directory.parent ? (
					<IconButton
						sx={{
							height: 24,
							width: 24
						}}
						onClick={() => navigate('/dir/' + directory.parent)}>
						<Icon name='folder-upload' style='line' />
					</IconButton>
				) : (
					<Box sx={{ width: 24 }} />
				)}
				<Box sx={{ ml: theme.spacing(1) }}>
					<PathBreadcrumb directory={directory} textVariant='body1' />
				</Box>
			</Box>
			<SortableTable
				header={tableHeaders}
				uniqueKey='id'
				data={data}
				onRowClick={onRowClick}
				size='small'
				initialSortKey='timestamp'
				highlight={location.hash !== '' ? location.hash.slice(1) : ''}
			/>
			<Menu open={menuAnchorEl !== null} onClose={() => setMenuAnchorEl(null)} anchorEl={menuAnchorEl?.target}>
				<MenuItem onClick={onSetRootDir} disabled={isRootDir}>
					<ListItemIcon>
						<Icon name='folder-user' style={isRootDir ? 'fill' : 'line'} size='lg' />
					</ListItemIcon>
					Wurzelknoten
				</MenuItem>
			</Menu>
		</TableContainer>
	);
}
