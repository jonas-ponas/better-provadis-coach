import { Box, useTheme } from '@mui/material';
import React, { useState } from 'react';
import { useLoaderData, useNavigate } from 'react-router-dom';
import { DirectoryRecord } from '../records';
import SyncButton from '../components/SyncButton';
import FileTable from '../components/FileTable';

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
				<FileTable directory={loaderData} />
			</Box>
		</Box>
	);
}
