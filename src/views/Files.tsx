import { Box, Button, Paper, Typography, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import DirectoryTable from '../components/DirectoryTable';
import { DirectoryRecord } from '../records';
import { Record } from 'pocketbase';
import SyncButton from '../components/SyncButton';

export default function Files(props: {}) {
	const theme = useTheme();
	const loaderData = useLoaderData() as DirectoryRecord;
	const navigate = useNavigate();

	return (
		<Box>
			<Box>
				<SyncButton callback={() => navigate(0)} />
			</Box>
			<Box
				sx={{
					mt: theme.spacing(1)
				}}>
				<DirectoryTable record={loaderData} />
			</Box>
		</Box>
	);
}
