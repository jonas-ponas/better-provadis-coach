import React, { useContext } from 'react';
import { Record } from 'pocketbase';
import { IconButton, Link, ListItemIcon, Menu, MenuItem, TableCell, TableRow, useTheme } from '@mui/material';
import { AccountTreeTwoTone, FolderTwoTone, MoreVert, PinTwoTone, PushPinTwoTone } from '@mui/icons-material';
import verbalizeDate from '../util/verbalizeDate';
import PocketBaseContext from '../hooks/PocketbaseContext';

export default function DirectoryItemRow({ record }: { record: Record }) {
	const theme = useTheme();
	const client = useContext(PocketBaseContext);

	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);
	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		setAnchorEl(event.currentTarget);
	}

	function setAsRootDirectory() {
		client
			?.collection('users')
			.update(client.authStore.model?.id || '', {
				rootDirectory: record.id
			})
			.then(() => {
				setAnchorEl(null);
			})
			.catch(e => {
				console.error(e);
			});
	}

	function pinDirectory() {
		// client?.collection('users').update(client.authStore.model?.id||'', {
		//     pinned: record.id
		// }).then(() => {
		//     setAnchorEl(null)
		// }).catch(e => {
		//     console.error(e)
		// })
		setAnchorEl(null);
	}

	return (
		<TableRow
			sx={{
				'&:hover': {
					bgcolor: theme.palette.grey[100],
					cursor: 'pointer'
				}
			}}
			onDoubleClick={() => (window.location.href = `?dir=${record.id}`)}
		>
			<TableCell>
				<FolderTwoTone />
			</TableCell>
			<TableCell>
				<Link
					href={`?dir=${record.id}`}
					sx={{
						color: theme.palette.common.black,
						textDecorationColor: theme.palette.grey[500]
					}}
				>
					{record.name}
				</Link>
				{/* {record.name} */}
			</TableCell>
			<TableCell></TableCell>
			<TableCell>{verbalizeDate(record.timestamp)}</TableCell>
			<TableCell>
				<IconButton onClick={handleClick}>
					<MoreVert />
				</IconButton>
			</TableCell>
			<Menu
				id='basic-menu'
				anchorEl={anchorEl}
				open={open}
				onClose={() => setAnchorEl(null)}
				MenuListProps={{
					'aria-labelledby': 'basic-button'
				}}
			>
				<MenuItem onClick={pinDirectory} disabled={true}>
					<ListItemIcon>
						<PushPinTwoTone />
					</ListItemIcon>
					Anheften
				</MenuItem>
				<MenuItem onClick={setAsRootDirectory} disabled={false}>
					<ListItemIcon>
						<AccountTreeTwoTone />
					</ListItemIcon>
					Wurzelordner
				</MenuItem>
			</Menu>
		</TableRow>
	);
}
