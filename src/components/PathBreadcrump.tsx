import * as React from 'react';
import { Record } from 'pocketbase';
import { Breadcrumbs, useTheme, Typography, Link, Box, IconButton } from '@mui/material';
import FolderTwoToneIcon from '@mui/icons-material/FolderTwoTone';
import { useNavigate, Link as RouterLink } from 'react-router-dom';

export default function PathBreadcrumb({ directory }: { directory: Record | undefined }) {
	const theme = useTheme();
	const navigate = useNavigate();

	function getBreadcrumb(record: Record): JSX.Element[] {
		if (!record.expand?.parent) {
			if (record.name) return [];
		}
		return [
			...getBreadcrumb(record.expand.parent as Record),
			<Link component={RouterLink} to={`/dir/${record.id}`} variant='body2' key={record.id}>
				{record.name}
			</Link>
		];
	}

	return (
		<Box
			sx={{
				display: 'flex',
				alignItems: 'center'
			}}>
			<Typography variant='body2' color='grey'>
				/
			</Typography>
			{directory && (
				<Breadcrumbs
					separator='/'
					maxItems={3}
					sx={{
						ml: theme.spacing(1)
					}}>
					{directory.expand?.parent && getBreadcrumb(directory.expand.parent as Record).map(v => v)}
					{directory.name !== 'root' && (
						<Typography variant='body2' color='initial'>
							{directory.name}
						</Typography>
					)}
				</Breadcrumbs>
			)}
		</Box>
	);
}
