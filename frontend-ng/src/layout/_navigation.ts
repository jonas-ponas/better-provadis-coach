import { Calendar, Folders, Home, LogoutBox, NewsPaper, Settings } from '../components/RemixIcon';
import { NavigationItem } from './Navigation';

const navigationItems: NavigationItem[] = [
	{ label: 'Übersicht', icon: Home, link: '/home', color: 'blue' },
	{
		label: 'Dateien',
		icon: Folders,
		link: '/files',
		color: 'lime',
		children: [{ label: 'Kürzlich hinzugefügt', link: '/files/new' }]
	},
	{
		label: 'Stundenplan',
		icon: Calendar,
		link: '/calendar',
		color: 'grape'
	},
	{
		label: 'Nachrichten',
		icon: NewsPaper,
		link: '/feed',
		color: 'orange'
	},

	{
		label: 'Einstellungen',
		color: 'pink',
		icon: Settings,
		link: '/user',
		children: [{ label: 'Sync-Log', link: '/user/changelog' }]
	},
	{
		label: 'Abmelden',
		icon: LogoutBox,
		color: 'red',
		link: '/login?logout'
	}
];

export default navigationItems;
