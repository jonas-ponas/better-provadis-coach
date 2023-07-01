import { useEffect, useRef, useState } from 'react';
import { AppShell, Header, Text, MediaQuery, Burger, useMantineTheme, Code } from '@mantine/core';
import Navigation from './Navigation';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { usePocketbase } from '../pocketbase';
import { SnackbarKey, closeSnackbar, enqueueSnackbar } from 'notistack';
import navigationItems from './_navigation';
import { ClientResponseError } from 'pocketbase';
import { Collections, SystemMessagesResponse } from '../pocketbase-types';
import Announcement, { AnnouncementRef } from '../components/Announcement';

export default function AppShellDemo() {
	const theme = useMantineTheme();
	const location = useLocation();
	const [opened, setOpened] = useState(false);
	const snackbarId = useRef<SnackbarKey | null>();
	const pocketbase = usePocketbase();
	const navigate = useNavigate();
	const [latestMessage, setLatestMessage] = useState<SystemMessagesResponse>();
	const announcementDialogRef = useRef<AnnouncementRef>(null);

	useEffect(() => {
		if (!pocketbase.authStore.isValid) {
			navigate('/login', {});
		} else {
			pocketbase
				.collection(Collections.LatestSystemMessage)
				.getFullList<SystemMessagesResponse>()
				.then(result => {
					if (result.length > 0) {
						if (!result[0]) return;
						setLatestMessage(result[0]);
						const announcement = localStorage.getItem('bpc-announcement');
						if (announcement === null || announcement !== result[0].id) {
							announcementDialogRef.current?.open();
						}
					}
				});
		}
	}, []);

	useEffect(() => {
		if (opened) setOpened(false);
		pocketbase.health
			.check()
			.then(result => {
				if (result.code !== 200) {
					snackbarId.current = enqueueSnackbar('Hintergrunddienst ist nicht erreichbar!', {
						variant: 'error',
						persist: true,
						preventDuplicate: true,
						key: 'backend-unhealthy'
					});
				} else {
					closeSnackbar(snackbarId.current ?? '');
					snackbarId.current = null;
				}
			})
			.catch(e => {
				if (e instanceof ClientResponseError && e.isAbort) return;
				console.error(e);
				snackbarId.current = enqueueSnackbar('Hintergrunddienst ist nicht erreichbar!', {
					variant: 'error',
					persist: true,
					preventDuplicate: true,
					key: 'backend-unhealthy'
				});
			});
	}, [location.pathname]);

	// @ts-expect-error  // todo
	const VERSION = import.meta.env.VITE_UI_VERSION || 'UNKNOWN';

	return (
		<AppShell
			styles={{
				main: {
					background: theme.colorScheme === 'dark' ? theme.colors.dark[8] : theme.colors.gray[0]
				}
			}}
			navbarOffsetBreakpoint='sm'
			navbar={<Navigation opened={opened} items={navigationItems} />}
			header={
				<Header height={{ base: 40 }} p='md'>
					<div style={{ display: 'flex', alignItems: 'center', height: '100%' }}>
						<MediaQuery largerThan='sm' styles={{ display: 'none' }}>
							<Burger
								opened={opened}
								onClick={() => setOpened(o => !o)}
								size='sm'
								color={theme.colors.gray[6]}
								mr='xl'
							/>
						</MediaQuery>
						<Text weight={'bold'}>Better Provadis Coach</Text>
						<Code sx={{ fontWeight: 700 }} ml={10}>
							{VERSION}
						</Code>
					</div>
				</Header>
			}>
			<Outlet />
			<Announcement
				ref={announcementDialogRef}
				announcement={latestMessage}
				onClose={() => {
					if (latestMessage) localStorage.setItem('bpc-announcement', latestMessage?.id);
				}}
			/>
		</AppShell>
	);
}
