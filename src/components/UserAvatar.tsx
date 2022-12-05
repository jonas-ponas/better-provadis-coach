import { FolderDeleteTwoTone, HelpCenterTwoTone, LogoutTwoTone } from '@mui/icons-material';
import { Avatar, Menu, useTheme, MenuItem, IconButton, ListItemIcon } from '@mui/material';
import React, { useContext } from 'react';
import PocketBaseContext from '../hooks/PocketbaseContext';

export default function UserAvatar(props: {}) {
	const theme = useTheme();
	const client = useContext(PocketBaseContext);

	const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

    const avatar = `https://coach.***REMOVED***/api/files/${client?.authStore.model?.collectionId}/${client?.authStore.model?.id}/${client?.authStore.model?.avatar}`;
	const firstLetter = (client?.authStore.model?.username[0] || '?').toUpperCase();

	function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
		setAnchorEl(event.currentTarget);
	}

    function handleLogout() {
        client?.authStore.clear()
        window.location.href = '/'
    }

	return (
		<>
			<IconButton aria-label='' onClick={handleClick} sx={{
                p: 0
            }}>
				<Avatar src={avatar}  alt={firstLetter} sx={{
                    height: 30,
                    width: 30
                }}/>
			</IconButton>
			<Menu open={open} anchorEl={anchorEl} onClose={() => setAnchorEl(null)}>
				<MenuItem onClick={() => setAnchorEl(null)} disabled={true}>
                    <ListItemIcon>
                        <HelpCenterTwoTone />
                    </ListItemIcon>
                    Information
                </MenuItem>
				<MenuItem onClick={() => setAnchorEl(null)} disabled={true}>
                    <ListItemIcon>
                        <FolderDeleteTwoTone />
                    </ListItemIcon>
                    Wurzelordner zurücksetzen
                </MenuItem>
				<MenuItem onClick={handleLogout}>
                    <ListItemIcon>
                        <LogoutTwoTone />
                    </ListItemIcon>
                    Abmelden
                </MenuItem>
			</Menu>
		</>
	);
}
