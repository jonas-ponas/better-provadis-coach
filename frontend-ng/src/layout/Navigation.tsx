import { MantineColor, Navbar, ScrollArea, createStyles } from '@mantine/core';
import LinksGroup from './LinksGroup';

const useStyles = createStyles(theme => ({
	navbar: {
		backgroundColor: theme.colorScheme === 'dark' ? theme.colors.dark[6] : theme.white,
		paddingBottom: 0
	},
	links: {
		marginLeft: `calc(${theme.spacing.md} * -1)`,
		marginRight: `calc(${theme.spacing.md} * -1)`
	}
}));

export interface NavigationItem {
	label: string;
	link?: string;
	icon: React.FC<any>;
	color?: MantineColor;
	children?: Required<Omit<NavigationItem, 'children' | 'icon' | 'color'>>[];
}

export default function Navigation({ opened, items }: { opened: boolean; items: NavigationItem[] }) {
	const { classes } = useStyles();

	return (
		<Navbar
			px='md'
			hiddenBreakpoint='sm'
			hidden={!opened}
			width={{ sm: 200, lg: 300 }}
			height={'100%'}
			className={classes.navbar}>
			<Navbar.Section grow className={classes.links} component={ScrollArea}>
				<div>
					{items.map(item => (
						<LinksGroup {...item} key={item.label} />
					))}
				</div>
			</Navbar.Section>
		</Navbar>
	);
}
