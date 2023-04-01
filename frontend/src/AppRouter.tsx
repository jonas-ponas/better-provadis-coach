import pocketbaseEs, { ClientResponseError, ExternalAuth } from 'pocketbase';
import { createBrowserRouter, json, Navigate, redirect } from 'react-router-dom';
import { DirectoryRecord, StateRecord, UserRecord } from './records';
import Files, { loadFiles, loadRootDirectory } from './views/Files';
import Layout from './views/Layout';
import Login from './views/Login';
import ErrorAlert from './components/Error';
import UserSettings, { loadUserSettings } from './views/UserSettings';
import Search, { loadSearch } from './views/Search';
import TimeTable, { loadTimeTable } from './views/Timetable';
import News, { loadNews } from './views/News';
import { loadCallback, loadLayout } from './util/routeLoaders';
import { Box } from '@mui/material';
import Calendar from './views/Calendar';

const expand =
	'parent,parent.parent,parent.parent.parent,parent.parent.parent.parent,parent.parent.parent.parent.parent,parent.parent.parent.parent.parent.parent';

export default (client: pocketbaseEs) =>
	createBrowserRouter([
		{
			path: '/',
			element: <Layout />,
			loader: loadLayout(client),
			errorElement: (
				<Box sx={{ p: 5 }}>
					<ErrorAlert title='Fehler!' description={`Es ist ein Fehler bei der Anmeldung unterlaufen!`} />
				</Box>
			),
			children: [
				{
					path: '/',
					element: <Navigate to='/dir' />
				},
				{
					path: '/dir/:dirId',
					element: <Files />,
					loader: loadFiles(client, expand),
					errorElement: (
						<ErrorAlert title='Fehler' description='Das angeforderte Verzeichnis wurde nicht gefunden.' />
					)
				},
				{
					path: '/dir',
					loader: loadRootDirectory(client),
					errorElement: (
						<ErrorAlert title='Fehler' description='Das angeforderte Verzeichnis wurde nicht gefunden.' />
					)
				},
				{
					path: '/settings',
					element: <UserSettings />,
					errorElement: <ErrorAlert title='Fehler!' description='Es ist ein Fehler aufgetreten!' />,
					loader: loadUserSettings(client)
				},
				{
					path: '/search',
					element: <Search />,
					loader: loadSearch(client),
					errorElement: <ErrorAlert title='Fehler!' description='Es ist ein Fehler aufgetreten!' />
				},
				{
					path: '/schedule',
					element: <TimeTable />,
					loader: loadTimeTable(client),
					errorElement: <ErrorAlert title='Fehler!' description='Es ist ein Fehler aufgetreten!' />
				},
				{
					path: '/calendar',
					element: <Calendar />,
					errorElement: <ErrorAlert title='Fehler!' description='Es ist ein Fehler aufgetreten!' />
				},
				{
					path: '/news',
					element: <News />,
					loader: loadNews(client),
					errorElement: <ErrorAlert title='Fehler!' description='Es ist ein Fehler aufgetreten!' />
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
			loader: loadCallback(client),
			errorElement: (
				<Box sx={{ p: 5 }}>
					<ErrorAlert title='Fehler!' description={`Es ist ein Fehler bei der Anmeldung unterlaufen!`} />
				</Box>
			)
		}
	]);
