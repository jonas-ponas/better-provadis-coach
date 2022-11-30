import {Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme} from '@mui/material';
import React, {useContext, useEffect, useState} from 'react';
import PocketBaseContext from '../hooks/PocketbaseContext';
import {Record} from 'pocketbase';

import FolderTwoToneIcon from '@mui/icons-material/FolderTwoTone';
import InsertDriveFileTwoToneIcon from '@mui/icons-material/InsertDriveFileTwoTone';

function DirectoryItem({record}: {record: Record}) {
	return (
		<TableRow>
			<TableCell>
				<FolderTwoToneIcon />
			</TableCell>
			<TableCell>{record.name}</TableCell>
			<TableCell></TableCell>
			<TableCell>{record.timestamp}</TableCell>
		</TableRow>
	);
}

function FileItem({record}: {record: Record}) {
	return (
		<TableRow>
			<TableCell>
				<InsertDriveFileTwoToneIcon></InsertDriveFileTwoToneIcon>
			</TableCell>
			<TableCell>{record.name}</TableCell>
			<TableCell>{record.size}</TableCell>
			<TableCell>{record.timestamp}</TableCell>
		</TableRow>
	);
}

export default function DirectoryTable({directoryId}: {directoryId: string}) {
	const theme = useTheme();
	const client = useContext(PocketBaseContext);

	const [directories, setDirectories] = useState<Record[] | undefined>(undefined);
	const [files, setFiles] = useState<Record[] | undefined>(undefined);
	const [error, setError] = useState<string | undefined>(undefined);

	useEffect(() => {
		const p1 = client?.collection('file').getFullList(undefined, {
			filter: `parent.id = "${directoryId}"`
		});

		const p2 = client?.collection('directory').getFullList(undefined, {
			filter: `parent.id = "${directoryId}"`
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
		<TableContainer component={Paper}>
			<Table size="small">
				<TableHead>
					<TableCell></TableCell>
					<TableCell>Name</TableCell>
					<TableCell>Größe</TableCell>
					<TableCell>Zuletzt geändert</TableCell>
				</TableHead>
				<TableBody>
					{directories && files ? (
						<>
							{directories.map((directory: Record) => (
								<DirectoryItem record={directory} />
							))}
							{files.map((file: Record) => (
								<FileItem record={file} />
							))}
						</>
					) : (
						<TableCell colSpan={4}>{error ? error : 'Lade Daten ...'}</TableCell>
					)}
				</TableBody>
			</Table>
		</TableContainer>
	);
}
