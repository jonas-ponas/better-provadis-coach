import * as React from 'react';
import { Record } from 'pocketbase';
import { IconButton, Link, ListItemIcon, Menu, MenuItem, TableCell, TableRow, useTheme } from '@mui/material';
import verbalizeFileSize from '../util/verbalizeFileSize';
import verbalizeDate from '../util/verbalizeDate';
import { InsertDriveFileTwoTone, MoreVert, StarTwoTone } from '@mui/icons-material';

export default function FileItemRow({ record }: { record: Record }) {
	const theme = useTheme();
	const url = `https://coach.***REMOVED***/api/files/${record.collectionId}/${record.id}/${record.cachedFile}`;

	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		setAnchorEl(event.currentTarget);
	};
	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
		<TableRow
			sx={{
				'&:hover': {
					bgcolor: theme.palette.grey[100],
					cursor: 'pointer'
				}
			}}
			onDoubleClick={() => window.open(url, '_blank')}
		>
			<TableCell>
				<InsertDriveFileTwoTone />
			</TableCell>
			<TableCell>
				<Link
					href={url}
					target='_blank'
					sx={{
						color: theme.palette.common.black,
						textDecorationColor: theme.palette.grey[500]
					}}
				>
					{record.name}
				</Link>
			</TableCell>
			<TableCell>{verbalizeFileSize(record.size)}</TableCell>
			<TableCell>{verbalizeDate(record.timestamp)}</TableCell>
			<TableCell>
				<IconButton id='basic-button' onClick={handleClick}>
					<MoreVert />
				</IconButton>
			</TableCell>
			<Menu
				id='basic-menu'
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				MenuListProps={{
					'aria-labelledby': 'basic-button'
				}}
			>
				<MenuItem onClick={handleClose} disabled={true}>
					<ListItemIcon>
						<StarTwoTone />
					</ListItemIcon>
					Favorit
				</MenuItem>
			</Menu>
		</TableRow>
	);
}
