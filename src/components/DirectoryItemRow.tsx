import React, { useContext } from 'react';
import { Record } from 'pocketbase';
import { IconButton, Link, ListItemIcon, Menu, MenuItem, TableCell, TableRow, useTheme } from '@mui/material';
import { AccountTreeTwoTone, FolderTwoTone, MoreVert, PinTwoTone, PushPinTwoTone } from '@mui/icons-material';
import verbalizeDate from '../util/verbalizeDate';
import { usePocketbase } from '../util/PocketbaseContext';
import { useLocation, useNavigate } from 'react-router-dom';
import Icon from './Icon';

export default function DirectoryItemRow({ record }: { record: Record }) {
	const theme = useTheme();
	const client = usePocketbase()
	const navigate = useNavigate();
	const location = useLocation();

	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	const isRootDirectory = client?.authStore.model?.rootDirectory == record.id

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
		<TableRow key={location.key}
			sx={{
				'&:hover': {
					bgcolor: theme.palette.grey[100],
					cursor: 'pointer'
				}
			}}
			onDoubleClick={() => navigate('/dir/'+record.id)}
		>
			<TableCell padding='checkbox'>
				<Icon name={isRootDirectory ? 'folder-user' : 'folder'} style='line' size='xl'/>
			</TableCell>
			<TableCell>
				<Link
					onClick={() => navigate('/dir/'+record.id)}
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
					<Icon name='more-2' style='line'/>
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
						<Icon name='pushpin-2' style='line' size='lg'/>
					</ListItemIcon>
					Anheften
				</MenuItem>
				<MenuItem onClick={setAsRootDirectory} disabled={false}>
					<ListItemIcon>
						<Icon name='folder-user' style='line' size='lg'/>
					</ListItemIcon>
					Wurzelordner
				</MenuItem>
			</Menu>
		</TableRow>
	);
}
