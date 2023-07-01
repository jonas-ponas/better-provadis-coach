import { ActionIcon, Box, Text, Title, useMantineTheme, Group, Button } from '@mantine/core';
import { useFiles, useFolders, useOneFolder, usePocketbase } from '../pocketbase';
import { useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Collections, DirectoryResponse, UserFilesResponse } from '../pocketbase-types';
import { DataTable, DataTableColumn } from 'mantine-datatable';
import { ArrowUpCircle, File, Folder } from '../components/RemixIcon';
import { enqueueSnackbar } from 'notistack';

export default function Files() {
	const [searchParams, setSearchParams] = useSearchParams();
	const pocketbase = usePocketbase();
	const d = searchParams.get('d');
	const theme = useMantineTheme();

	const [files, fetchFiles] = useFiles();
	const [folders, fetchFolders] = useFolders();
	const [currentFolder, fetchCurrentFolder] = useOneFolder();

	useEffect(() => {
		if (!d) {
			pocketbase
				.collection(Collections.Directory)
				.getFirstListItem<DirectoryResponse>('parent = null')
				.then(dir => {
					fetchFiles(dir.id);
					fetchFolders(dir.id);
					fetchCurrentFolder(dir.id);
				});
			return;
		}
		fetchFiles(d);
		fetchFolders(d);
		fetchCurrentFolder(d);
	}, [d]);

	type RowData = {
		type: 'file' | 'folder';
		name: string;
		timestamp: string;
		size: number | undefined;
		originalData: UserFilesResponse | DirectoryResponse;
	};

	const rows: RowData[] | undefined = useMemo(() => {
		if (files.data && folders.data) {
			const fileRows: RowData[] = files.data.map(
				file =>
					({
						type: 'file',
						name: file.name,
						timestamp: file.timestamp,
						size: file.size,
						originalData: file
					} as RowData)
			);
			const folderRows: RowData[] = folders.data.map(
				folder =>
					({
						type: 'folder',
						name: folder.name,
						timestamp: folder.timestamp,
						size: undefined,
						originalData: folder
					} as RowData)
			);
			return [...fileRows, ...folderRows];
		}
		return undefined;
	}, [files.data, folders.data]);

	const columns: DataTableColumn<RowData>[] = [
		{
			accessor: 'type',
			textAlignment: 'left',
			title: (
				<ActionIcon
					onClick={() =>
						setSearchParams(params => {
							if (currentFolder.data?.parent) params.set('d', currentFolder.data?.parent);
							else params.delete('d');
							return params;
						})
					}
					disabled={currentFolder.data?.parent === ''}>
					<ArrowUpCircle />
				</ActionIcon>
			),
			width: 30,
			render: ({ type }) => (type === 'file' ? <File /> : <Folder />)
		},
		{ accessor: 'name' },
		{ accessor: 'size' },
		{ accessor: 'timestamp', render: ({ timestamp }) => <Text>{new Date(timestamp).toLocaleString('de')}</Text> }
	];

	const loading = files.loading || files.loading || currentFolder.loading;

	return (
		<>
			<Group sx={{ maxWidth: 'calc(100%)' }}>
				<Title size='h3'>Dateien</Title>
				<Text lineClamp={1}>{currentFolder.data?.name}</Text>
				<Button
					onClick={() => {
						enqueueSnackbar('', { variant: 'syncBanner', persist: true });
					}}>
					Sync now
				</Button>
			</Group>
			<Box sx={{ marginTop: theme.spacing.sm }}>
				<DataTable
					withBorder
					borderRadius='sm'
					striped
					highlightOnHover
					records={rows ?? []}
					columns={columns}
					onRowClick={record => {
						if (record.type === 'folder') {
							setSearchParams(params => {
								params.set('d', record.originalData.id);
								return params;
							});
						} else {
							const url = pocketbase.getFileUrl(
								record.originalData,
								(record.originalData as UserFilesResponse).content
							);
							window.open(url, '_blank');
						}
					}}
					fetching={loading}
				/>
			</Box>
		</>
	);
}
