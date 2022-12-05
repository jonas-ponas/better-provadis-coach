import React, { useContext, useEffect, useState } from 'react';
import {
	IconButton,
	Link,
	Paper,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
	useTheme
} from '@mui/material';
import PocketBaseContext from '../hooks/PocketbaseContext';
import { Record } from 'pocketbase';
import ArrowUpwardIcon from '@mui/icons-material/ArrowUpward';
import FileItemRow from './FileItemRow';
import DirectoryItemRow from './DirectoryItemRow';

export default function DirectoryTable({ record }: { record: Record }) {
	const theme = useTheme();
	const client = useContext(PocketBaseContext);

	const [directories, setDirectories] = useState<Record[] | undefined>(undefined);
	const [files, setFiles] = useState<Record[] | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

	useEffect(() => {
		const p1 = client?.collection('file').getFullList(undefined, {
			filter: `parent.id = "${record.id}"`
		});

		const p2 = client?.collection('directory').getFullList(undefined, {
			filter: `parent.id = "${record.id}"`
		});

		Promise.all([p1, p2])
			.then(([files, directories]) => {
				setDirectories(directories);
				setFiles(files);
			})
			.catch(e => {
				setError(e.message);
			});
	}, []);

	return (
		<TableContainer component={Paper} elevation={1}>
			<Table size='small'>
				<TableHead>
					<TableRow>
						<TableCell width={24}>
							{record.parent && (
								<IconButton size='small' href={`?dir=${record.parent}`}>
									<ArrowUpwardIcon />
								</IconButton>
							)}
						</TableCell>
						<TableCell>Name</TableCell>
						<TableCell>Größe</TableCell>
						<TableCell>Zuletzt geändert</TableCell>
						<TableCell width={24} />
					</TableRow>
				</TableHead>
				<TableBody>
					{directories && files ? (
						directories.length == 0 && files.length == 0 ? (
							<TableCell
								colSpan={4}
								sx={{
									textAlign: 'center',
									color: theme.palette.grey[400]
								}}
							>
								<Typography variant='body2'>Verzeichnis ist leer</Typography>
							</TableCell>
						) : (
							<>
								{directories.map((directory: Record) => (
									<DirectoryItemRow record={directory} key={directory.id}/>
								))}
								{files.map((file: Record) => (
									<FileItemRow record={file} key={file.id}/>
								))}
							</>
						)
					) : (
						<TableCell
							colSpan={4}
							sx={{
								textAlign: 'center',
								color: theme.palette.grey[400]
							}}
						>
							{error ? error : 'Lade Daten ...'}
						</TableCell>
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
