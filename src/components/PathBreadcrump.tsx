import * as React from 'react';
import {Record} from 'pocketbase';
import {Breadcrumbs, useTheme, Typography, Link, Box, IconButton} from '@mui/material';
import FolderTwoToneIcon from '@mui/icons-material/FolderTwoTone';

function getBreadcrumb(record: Record): JSX.Element[] {
	if (!record.expand?.parent) {
		if (record.name) return [];
	}
	return [...getBreadcrumb(record.expand.parent as Record), <Link href={`?dir=${record.id}`}>{record.name}</Link>];
}

export default function PathBreadcrumb({directory}: {directory: Record | undefined}) {
	const theme = useTheme();
	
	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center'
			}}
		>
			<IconButton size='small' href='?dir='>
				<FolderTwoToneIcon />
			</IconButton>
			<Typography variant="body1" color="grey">/</Typography>
			{directory && (
				<Breadcrumbs
				separator='/'
				maxItems={3}
				sx={{
					ml: theme.spacing(1)
				}}>
				{directory.expand?.parent && getBreadcrumb(directory.expand.parent as Record).map(v => v)}
				{directory.name !== 'root' && (
					<Typography variant='body1' color='initial'>
						{directory.name}
					</Typography>
				)}
			</Breadcrumbs>
			)}
		</Box>
	);
}
