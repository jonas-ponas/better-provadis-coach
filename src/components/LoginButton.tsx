import { Button } from '@mui/material';
import { AuthProviderInfo } from 'pocketbase';
import React from 'react';
import Icon, { IconProps } from './Icon';

const REDIRECT_PATH = '/callback';

const ICON_MAP: { [key: string]: { name: string; style: IconProps['style'] } } = {
	google: { name: 'google', style: 'line' },
	github: { name: 'github', style: 'line' }
};

export default function LoginButton({ authProvider }: { authProvider: AuthProviderInfo }) {
	const redirectUrl = `${window.location.origin}${REDIRECT_PATH}`;
	const authUrl = new URL(authProvider.authUrl);
	authUrl.searchParams.set('redirect_uri', redirectUrl);
	const icon = ICON_MAP[authProvider.name];
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
