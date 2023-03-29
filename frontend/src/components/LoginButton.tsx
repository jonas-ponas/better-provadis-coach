import { Button } from '@mui/material';
import { AuthProviderInfo } from 'pocketbase';
import React from 'react';
import { ICON_MAP } from '../icons/providerIcons';
import Icon from './Icon';

const REDIRECT_PATH = '/callback';

export default function LoginButton({ authProvider }: { authProvider: AuthProviderInfo }) {
	const redirectUrl =
		window.location.hostname == 'localhost'
			? import.meta.env.VITE_REDIRECT
			: `${window.location.origin}${REDIRECT_PATH}`;
	const authUrl = new URL(authProvider.authUrl);
	authUrl.searchParams.set('redirect_uri', redirectUrl);
	const icon = ICON_MAP[authProvider.name];
	console.log(redirectUrl, authUrl.href, window.location.hostname);
	return (
		<Button
			LinkComponent={'a'}
			href={authUrl.href}
			onClick={() => localStorage.setItem('provider', JSON.stringify({ ...authProvider, redirectUrl }))}
			variant='outlined'
			color='primary'
			startIcon={<Icon {...icon} />}>
			Sign in with {authProvider.name}
		</Button>
	);
}
