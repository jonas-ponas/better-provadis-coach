import { createBrowserRouter, Navigate, RouterProvider } from 'react-router-dom';
import Home from './views/Home';
import { Alert } from '@mantine/core';
import Layout from './layout';
import Login from './views/Login';
import { PocketBaseContext } from './pocketbase';
import PocketBase from 'pocketbase';
import { Error } from './components/RemixIcon';
import Files from './views/Files';
import { SnackbarProvider } from 'notistack';
import Notification, { ErrorNotification, SuccessNotification, WarnNotification } from './components/Notification';
import SyncProcessBanner from './components/SyncProcessBanner';

export default function Router() {
	const pocketbase = new PocketBase('/');

	const router = createBrowserRouter([
		{
			path: '/',
			element: <Layout />,
			children: [
				{
					path: '/',
					element: <Navigate to='/home' />
				},
				{
					path: '/home',
					element: <Home />
				},
				{
					path: '/files',
					element: <Files />
				},
				{
					path: '*',
					element: (
						<Alert color='red' icon={<Error size='lg' />}>
							Oopsie Whoopsie! We cawnt find thwat pwage :3 Sowwy
						</Alert>
					)
				}
			]
		},
		{
			path: '/login',
			element: <Login />
		},
		{
			path: '/callback'
		}
	]);

	return (
		<PocketBaseContext.Provider value={pocketbase}>
			<SnackbarProvider
				anchorOrigin={{
					vertical: 'bottom',
					horizontal: 'right'
				}}
				Components={{
					default: Notification,
					error: ErrorNotification,
					warning: WarnNotification,
					success: SuccessNotification,
					syncBanner: SyncProcessBanner
				}}
			/>
			<RouterProvider router={router} />
		</PocketBaseContext.Provider>
	);
}
