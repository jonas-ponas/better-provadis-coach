import React from 'react';
import { Box, Paper, Table, TableBody, TableCell, TableContainer, TableHead, TableRow, useTheme } from '@mui/material';
import { StateRecord } from '../records';

export default function CoachDataTable({
	data,
	syncNow,
	callback
}: {
	data: StateRecord;
	syncNow?: boolean;
	callback?: () => void;
}) {
	const theme = useTheme();

	return (
		<TableContainer component={Paper}>
			<Table sx={{ minWidth: 650 }} size='small'>
				<TableHead>
					<TableRow>
						<TableCell colSpan={2} sx={{ fontWeight: 'bold' }}>
							Gespeicherte Coach-Daten
						</TableCell>
					</TableRow>
				</TableHead>
				<TableBody>
					<TableRow>
						<TableCell width={200}>Benutzername / ID</TableCell>
						<TableCell>
							{data?.coachUsername} / {data?.coachUserId}
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>URL / Domänen-ID</TableCell>
						<TableCell>
							{data?.url} / {data?.domainId}
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Letzte Synchronisierung</TableCell>
						<TableCell>
							{data?.lastSync ? new Date(data?.lastSync).toLocaleString('de-de') : 'undefined'}
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Zugriffs-Token</TableCell>
						<TableCell>
							<Box
								sx={{
									bgcolor: theme.palette.grey[900],
									color: theme.palette.grey[900],
									userSelect: 'none',
									display: 'inline-block',
									'&:hover': {
										bgcolor: 'inherit',
										userSelect: 'all'
									}
								}}>
								{data?.token}
							</Box>
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Ablaufdatum</TableCell>
						<TableCell>{new Date(data?.expires).toLocaleString('de-de')}</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Erneuerungs-Token</TableCell>
						<TableCell>
							<Box
								sx={{
									bgcolor: theme.palette.grey[900],
									color: theme.palette.grey[900],
									userSelect: 'none',
									display: 'inline-block',
									'&:hover': {
										bgcolor: 'inherit',
										userSelect: 'all'
									}
								}}>
								{data?.refreshToken}
							</Box>
						</TableCell>
					</TableRow>
					<TableRow>
						<TableCell>Letzter Antwort-Hash</TableCell>
						<TableCell>{data?.lastFilesHash}</TableCell>
					</TableRow>
				</TableBody>
			</Table>
		</TableContainer>
	);
}
