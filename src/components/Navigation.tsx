import React from 'react';
import { Box, List, ListItemButton, ListItemIcon, ListItemText, Paper, Tooltip, useTheme } from '@mui/material';
import { Link as RouterLink, useNavigate } from 'react-router-dom';
import Icon from './Icon';
import { usePocketbase } from '../util/PocketbaseContext';
import icons from '../icons/icons';

interface MenuItem {
	name: string
	icon: string
	href?: string
	disabled?: boolean
	onClick?: string
}

const primaryMenu: MenuItem[] = [
	{ name: 'Dateien', icon: 'folders', href: '/dir' },
	{ name: 'Stundenplan', icon: 'calendar-todo', href: '/schedule', disabled: true },
	{ name: 'News', icon: 'rss', href: '/news', disabled: true }
];

const secondaryMenu: MenuItem[] = [
	{ name: 'Einstellungen', icon: 'user-settings', href: '/settings' },
	{ name: 'Abmelden', icon: 'logout-box', onClick: 'logout' }
];

export default function Navigation({ iconsOnly }: { iconsOnly?: boolean }) {
	const theme = useTheme();
	const client = usePocketbase();
	const navigate = useNavigate();

	function logout() {
		client?.authStore.clear();
		navigate('/login');
	}

	function mapping(v: MenuItem) {
		const functions: {[key: string]: (()=>void)} = {
			'logout': logout
		}
		return (
			<ListItemButton disabled={v?.disabled || false} LinkComponent={RouterLink} href={v?.href||''} onClick={functions[(v?.onClick||'')]||(()=>{})}>
				{iconsOnly ? (
					<Icon name={v.icon} style='line' size='lg' />
				) : (
					<>
						<ListItemIcon>
							<Icon name={v.icon} style='line' size='lg' />
						</ListItemIcon>
						<ListItemText primary={v.name} />
					</>
				)}
			</ListItemButton>
		);
	}

	return (
		<nav>
			<Box sx={iconsOnly ? { display: 'flex', flexDirection: 'row' } : {}}>
				<List component={Paper} sx={iconsOnly ? { display: 'flex', flexDirection: 'row' } : {}}>
					{primaryMenu.map(mapping)}
				</List>
				<List
					component={Paper}
					sx={
						iconsOnly
							? { display: 'flex', flexDirection: 'row', ml: theme.spacing(2) }
							: { mt: theme.spacing(2) }
					}>
					{secondaryMenu.map(mapping)}
				</List>
			</Box>
		</nav>
	);
}
