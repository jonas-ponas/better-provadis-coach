import {
	IconButton,
	Link,
	useTheme,
	Icon as MuiIcon,
	TableContainer,
	Paper,
	Box
} from '@mui/material';
import React, { useEffect, useState } from 'react';
import { useNavigate, Link as RouterLink } from 'react-router-dom';
import { DirectoryRecord, FileRecord } from '../records';
import { usePocketbase } from '../util/PocketbaseContext';
import verbalizeDate from '../util/verbalizeDate';
import verbalizeFileSize from '../util/verbalizeFileSize';
import Icon from './Icon';
import SortableTable, { SortableTableProps } from './SortableTable';

import icons from '../icons/icons';
import PathBreadcrumb from './PathBreadcrump';
const iconMapping: { [key: string]: string | undefined } = {
	pdf: icons.pdf,
	png: icons.img,
	jpg: icons.img,
	jpeg: icons.img,
	gif: icons.img,
	rkt: icons.rkt,
	java: icons.java,
	py: icons.py,
	zip: icons.zip,
	pptx: icons.ppt,
	doc: icons.doc,
	docx: icons.doc,
	mp4: icons.video,
	mov: icons.video
};

type RowData = {
	id: string;
	name: string;
	timestamp: string;
	type: string;
	size?: number;
	mime?: string;
	collectionId: string;
	fileName?: string;
};

export default function FileTable({ directory }: { directory: DirectoryRecord }) {
	const theme = useTheme();
	const client = usePocketbase();
	const navigate = useNavigate();

	const [data, setData] = useState<RowData[]>([]);

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
				const transformFiles = files.map(
					({ name, size, timestamp, id, collectionId, cachedFile }: FileRecord) => {
						return {
							name,
							size,
							timestamp,
							type: 'file',
							id,
							collectionId,
							mime: name.split('.').at(-1),
							fileName: cachedFile
						};
					}
				);
				const transformDirectories = directories.map(
					({ name, timestamp, id, collectionId }: DirectoryRecord) => {
						return { name, timestamp, type: 'directory', size: undefined, id, collectionId };
					}
				);
				setData([...transformFiles, ...transformDirectories]);
			})
			.catch(e => {
				// setError(e.message);
			});
	}, [directory]);

	function onRowClick(row: RowData) {
		if (row.type == 'directory') {
			return navigate(`/dir/${row.id}`);
		} else {
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
				return (
					<Icon
						name={row.id == client?.authStore.model?.rootDirectory ? 'folder-user' : 'folder'}
						style='line'
						size='xl'
					/>
				);
			}
		},
		{
			title: 'Name',
			key: 'name',
			sortable: true,
			generator(row: RowData) {
				if (row.type == 'file') {
					const url = `https://coach.***REMOVED***/api/files/${row.collectionId}/${row.id}/${row.fileName}`;
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
		}
	];

	return (
		<TableContainer component={Paper} elevation={1}>
			<Box
				sx={{
					display: 'flex',
					p: theme.spacing(1)
				}}>
				{directory.parent ? <IconButton
					sx={{
						height: 24,
						width: 24
					}}
					onClick={() => navigate('/dir/' + directory.parent)}>
					<Icon name='folder-upload' style='line' />
				</IconButton>
				: <Box sx={{width: 24}}/>
				}
				<Box sx={{ml: theme.spacing(1)}}>
				<PathBreadcrumb directory={directory} textVariant='body2' />
				</Box>
			</Box>
			<SortableTable header={tableHeaders} data={data} onRowClick={onRowClick} size='small' />
		</TableContainer>
	);
}