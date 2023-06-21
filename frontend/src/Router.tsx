import pocketbaseEs, { ClientResponseError, ExternalAuth } from 'pocketbase';
import { createBrowserRouter, json, Navigate, redirect } from 'react-router-dom';
import { DirectoryRecord, StateRecord, UserRecord } from './records';
import Files, { loadFiles, loadRootDirectory } from './views/Files';
import Layout from './views/Layout';
import Login from './views/Login';
import ErrorAlert from './components/Error';
import UserSettings, { loadUserSettings } from './views/UserSettings';
import Search, { loadSearch } from './views/Search';
import News, { loadNews } from './views/News';
import { loadCallback, loadLayout } from './util/routeLoaders';
import { Box } from '@mui/material';
import Calendar from './views/Calendar';

const expand =
	'parent,parent.parent,parent.parent.parent,parent.parent.parent.parent,parent.parent.parent.parent.parent,parent.parent.parent.parent.parent.parent';

export default (client: pocketbaseEs) => {
	const errorElement = <ErrorAlert title='Fehler!' description='Es ist ein Fehler aufgetreten!' />;
	const errorLogin = (
		<ErrorAlert sx={{ m: 5 }} title='Fehler!' description={`Es ist ein Fehler bei der Anmeldung unterlaufen!`} />
	);
	const errorFolder = <ErrorAlert title='Fehler' description='Das angeforderte Verzeichnis wurde nicht gefunden.' />;
	return createBrowserRouter([
		{
			path: '/',
			element: <Layout />,
			loader: loadLayout(client),
			errorElement: errorLogin,
			children: [
				{
					path: '/',
					element: <Navigate to='/dir' />
				},
				{
					path: '/dir/:dirId',
					element: <Files />,
					loader: loadFiles(client, expand),
					errorElement: errorFolder
				},
				{
					path: '/dir',
					loader: loadRootDirectory(client),
					errorElement: errorFolder
				},
				{
					path: '/settings',
					element: <UserSettings />,
					errorElement,
					loader: loadUserSettings(client)
				},
				{
					path: '/search',
					element: <Search />,
					loader: loadSearch(client),
					errorElement
				},
				{
					path: '/calendar',
					element: <Calendar />,
					errorElement
				},
				{
					path: '/news',
					element: <News />,
					loader: loadNews(client),
					errorElement
				}
			]
		},
		{
			path: '/login',
			element: <Login />,
			loader: async () => {
				return await client.collection('users').listAuthMethods();
			}
		},
		{
			path: '/callback/*',
			element: <></>,
			loader: loadCallback(client)
		}
	]);
};
