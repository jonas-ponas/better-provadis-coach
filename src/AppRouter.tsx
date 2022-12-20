import pocketbaseEs, { ClientResponseError, ExternalAuth } from 'pocketbase';
import { createBrowserRouter, json, Navigate, redirect } from 'react-router-dom';
import { DirectoryRecord, StateRecord, UserRecord } from './records';
import Files, { loadFiles, loadRootDirectory } from './views/Files';
import Layout from './views/Layout';
import Login from './views/Login';
import ErrorAlert from './components/Error';
import UserSettings, { loadUserSettings } from './views/UserSettings';
import Search, { loadSearch } from './views/Search';

const expand =
	'parent,parent.parent,parent.parent.parent,parent.parent.parent.parent,parent.parent.parent.parent.parent,parent.parent.parent.parent.parent.parent';

export default (client: pocketbaseEs) =>
	createBrowserRouter([
		{
			path: '/',
			element: <Layout />,
			loader: async () => {
				if (!client.authStore.isValid) throw redirect('/login');
				try {
					// await client.collection('users').authRefresh();
					return null;
				} catch (e) {
					if (e instanceof ClientResponseError && e.status === 401) {
						throw redirect('/login');
					}
				}
			},
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
					errorElement: (
						<ErrorAlert title='Fehler!' description={`Es ist ein Fehler bei der Anmeldung unterlaufen!`} />
					)
				} // Add here
			]
		},
		{
			path: '/login',
			element: <Login />,
			loader: async () => {
				return await client.collection('users').listAuthMethods();
			},
			errorElement: (
				<ErrorAlert title='Fehler!' description={`Es ist ein Fehler bei der Anmeldung unterlaufen!`} />
			)
		},
		{
			path: '/callback/*',
			element: <></>,
			loader: async request => {
				const url = new URL(request.request.url);
				const code = url.searchParams.get('code');
				const state = url.searchParams.get('state');
				const provider = JSON.parse(localStorage.getItem('provider') || '{}');
				if (!code || !state || !provider)
					throw new Error('Der O-Auth Provider hat nicht genug Parameter zurückgeliefert!');
				let response = await client
					?.collection('users')
					.authWithOAuth2<UserRecord>(provider.name, code, provider.codeVerifier, provider.redirectUrl);
				const avatarUrlChanged = response.record.avatarUrl === '' && response.meta?.avatarUrl;
				const nameChanged = response.record.name !== response.meta?.name;
				if (nameChanged || avatarUrlChanged) {
					client.collection('users').update(response.record.id, {
						avatarUrl: response.meta?.avatarUrl || response.record.avatarUrl,
						name: response.meta?.name || response.record.name
					});
				}
				throw redirect('/');
			},
			errorElement: (
				<ErrorAlert title='Fehler!' description={`Es ist ein Fehler bei der Anmeldung unterlaufen!`} />
			)
		}
	]);
