/*
 * Taken from: https://ui.mantine.dev/component/navbar-links-group
 */
import { useState } from 'react';
import { Group, Box, Collapse, ThemeIcon, Text, UnstyledButton, rem, Sx, useMantineTheme } from '@mantine/core';
import { ArrowDropLeft, ArrowDropRight } from '../components/RemixIcon';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { NavigationItem } from './Navigation';

interface LinksGroupProps extends NavigationItem {}

export default function LinksGroup({ icon: Icon, label, children, link, color }: LinksGroupProps) {
	const theme = useMantineTheme();
	color = color ?? theme.primaryColor;
	const location = useLocation();
	const hasLinks = Array.isArray(children);
	const isActive = link ? location.pathname.startsWith(link) : false;
	const [opened, setOpened] = useState(isActive ?? false);
	const navigate = useNavigate();
	const ChevronIcon = theme.dir === 'ltr' ? ArrowDropRight : ArrowDropLeft;

	const styles: Sx = {
		fontWeight: 500,
		display: 'block',
		width: '100%',
		fontSize: theme.fontSizes.sm,
		padding: `${theme.spacing.xs} ${theme.spacing.md}`,
		'&:hover': {
			backgroundColor: theme.colorScheme === 'dark' ? theme.colors[color][7] : theme.colors[color][0],
			color: theme.colorScheme === 'dark' ? theme.white : theme.black
		}
	};

	const items = (hasLinks ? children : []).map(child => {
		const isChildActive = location.pathname.startsWith(child.link);
		return (
			<Text<typeof Link>
				component={Link}
				sx={{
					...styles,
					textDecoration: 'none',
					paddingLeft: rem(31),
					marginLeft: rem(30),
					color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.colors.gray[7],
					borderLeft: `${rem(1)} solid ${
						theme.colorScheme === 'dark' ? theme.colors.dark[4] : theme.colors.gray[3]
					}`,
					backgroundColor: isChildActive ? theme.colors.gray[0] : 'inherit'
				}}
				to={child.link}
				key={child.label}>
				{child.label}
			</Text>
		);
	});

	return (
		<>
			<UnstyledButton
				onClick={() => {
					setOpened(o => !o);
					if (link) {
						navigate(link);
					}
				}}
				sx={{
					...styles,
					color: theme.colorScheme === 'dark' ? theme.colors.dark[0] : theme.black,
					backgroundColor: isActive ? theme.colors[color][0] : 'inherit'
				}}>
				<Group position='apart' spacing={0}>
					<Box sx={{ display: 'flex', alignItems: 'center' }}>
						<ThemeIcon variant='light' size={30} color={color}>
							<Icon size='1x' />
						</ThemeIcon>
						<Box ml='md'>{label}</Box>
					</Box>
					{hasLinks && (
						<ChevronIcon
							size='lg'
							style={{
								transform: opened ? `rotate(${theme.dir === 'rtl' ? -90 : 90}deg)` : 'none'
							}}
						/>
					)}
				</Group>
			</UnstyledButton>
			{hasLinks ? <Collapse in={opened}>{items}</Collapse> : null}
		</>
	);
}
