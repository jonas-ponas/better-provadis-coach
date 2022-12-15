import React from 'react';
import { Breadcrumbs, useTheme, Typography, Link, Box } from '@mui/material';
import { Link as RouterLink } from 'react-router-dom';
import { DirectoryRecord } from '../records';

export default function PathBreadcrumb({
	directory,
	textVariant
}: {
	directory: DirectoryRecord | undefined;
	textVariant?: 'body1' | 'body2';
}) {
	const theme = useTheme();

	function getBreadcrumb(record: DirectoryRecord): JSX.Element[] {
		if (!record.expand?.parent) {
			if (record.name) return [];
		}
		return [
			...getBreadcrumb(record.expand.parent as DirectoryRecord),
			<Link component={RouterLink} to={`/dir/${record.id}`} variant={textVariant || 'body1'} key={record.id}>
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
			<Typography variant={textVariant || 'body1'} color='grey'>
				/
			</Typography>
			{directory && (
				<Breadcrumbs
					separator='/'
					maxItems={3}
					sx={{
						ml: theme.spacing(1)
					}}>
					{directory.expand?.parent && getBreadcrumb(directory.expand.parent as DirectoryRecord).map(v => v)}
					{directory.name !== 'root' && (
						<Typography variant={textVariant || 'body1'} color='initial'>
							{directory.name}
						</Typography>
					)}
				</Breadcrumbs>
			)}
		</Box>
	);
}
