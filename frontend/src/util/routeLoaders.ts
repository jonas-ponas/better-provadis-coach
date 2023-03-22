import { LoaderFunctionArgs, redirect } from 'react-router-dom';
import PocketBase, { ClientResponseError } from 'pocketbase';
import { UserRecord } from '../records';

export function loadLayout(client: PocketBase) {
	return async () => {
		if (!client.authStore.isValid) throw redirect('/login');
		else return null;
	};
}

export function loadCallback(client: PocketBase) {
	return async (request: LoaderFunctionArgs) => {
		const url = new URL(request.request.url);
		const code = url.searchParams.get('code');
		const state = url.searchParams.get('state');
		const error = url.searchParams.get('error');
		const provider = JSON.parse(localStorage.getItem('provider') || '{}');

		if (error) {
			throw new Error(error);
		}

		if (!code || !state || !provider) {
			throw new Error('Der O-Auth Provider hat nicht genug Parameter zurückgeliefert!');
		}

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
	};
}
