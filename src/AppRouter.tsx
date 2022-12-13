import pocketbaseEs, { ClientResponseError } from 'pocketbase';
import { createBrowserRouter, json, Navigate, redirect } from 'react-router-dom';
import { DirectoryRecord } from './records';
import Files from './views/Files';
import Layout from './views/Layout';
import Login from './views/Login';
import ErrorAlert from './components/Error';
import UserSettings from './views/UserSettings';
import { ThreeMpOutlined } from '@mui/icons-material';

const expand =
	'parent,parent.parent,parent.parent.parent,parent.parent.parent.parent,parent.parent.parent.parent.parent,parent.parent.parent.parent.parent.parent';

const router = (client: pocketbaseEs) =>
	createBrowserRouter([
		{
			path: '/',
			element: <Layout />,
			loader: () => {
				if (!client.authStore.isValid) throw redirect('/login');
			},
			children: [
				{
					path:'/',
					element: <Navigate to='/dir' />
				},
				{
					path: '/dir/:dirId',
					element: <Files />,
					loader: async ({ params }) => {
						const record = await client.collection('directory').getOne<DirectoryRecord>(params.dirId!!, {
							expand
						});
						return record;
					},
					errorElement: (
						<ErrorAlert title='Fehler' description='Das angeforderte Verzeichnis wurde nicht gefunden.' />
					)
				},
				{
					path: '/dir',
					loader: async () => {
						if (client.authStore.model?.rootDirectory) {
							throw redirect('/dir/' + client.authStore.model?.rootDirectory);
						} else {
							try {
								const record = await client
								.collection('directory')
								.getFirstListItem<DirectoryRecord>(`parent = null`);
								throw redirect('/dir/' + record.id);
							} catch(e) {
								if(e instanceof Error) {
									console.log(e)
									if((e as ClientResponseError).status == 404) {
										console.log('hier!')
										throw json({
											name: 'Kein Wurzel-Ordner gefunden',
											description: `Es wurde kein Wurzelordner gefunden. Haben Sie einen Coach verbunden?
											(Ein Coach kann in den Einstellungen mit Expert-Giggle verbunden werden)`
										})
									}
								}
								throw e;
							}
							
						}
					},
					errorElement: <ErrorAlert title='Fehler' description='Das angeforderte Verzeichnis wurde nicht gefunden.' />
				},
				{
					path: '/settings',
					element: <UserSettings />,
					loader: async () => {
						let rootDir = null
						if(client.authStore.model?.rootDirectory) {
							rootDir = await client.collection('directory').getOne(client.authStore.model?.rootDirectory)
						}
						try {
							let state = await client.collection('state').getFirstListItem(`user.id = "${client.authStore.model?.id||''}"`)
							return {
								state, rootDir
							}
						} catch(e) {
							if(e instanceof Error) {
								if((e as ClientResponseError).status == 404) {
									return {
										state: null,
										rootDir
									}
								}
							}
							throw e
						}
					}
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
			loader: async request => {
				const url = new URL(request.request.url);
				const code = url.searchParams.get('code');
				const state = url.searchParams.get('state');
				console.log(localStorage.getItem('provider'))
				const provider = JSON.parse(localStorage.getItem('provider') || '{}');
				if (!code || !state || !provider)
					throw new Error('Der O-Auth Provider hat nicht genug Parameter zurückgeliefert!');
				await client
					?.collection('users')
					.authWithOAuth2(provider.name, code, provider.codeVerifier, provider.redirectUrl);
				throw redirect('/');
			},
			errorElement: (
				<ErrorAlert title='Fehler!' description={`Es ist ein Fehler bei der Anmeldung unterlaufen!`} />
			)
		}
	]);

export default router;
