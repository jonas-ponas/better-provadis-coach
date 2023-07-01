import {
	TextInput,
	PasswordInput,
	Paper,
	Title,
	Container,
	Button,
	Group,
	Divider,
	Loader,
	Center,
	Alert
} from '@mantine/core';
import { useAuthMethods, usePocketbase } from '../pocketbase';
import { Error } from '../components/RemixIcon';
import { AuthProviderInfo } from 'pocketbase';
import { useRef, useState } from 'react';
import { Collections } from '../pocketbase-types';
import { useNavigate } from 'react-router-dom';

export default function Login() {
	const authMethods = useAuthMethods();
	const pocketbase = usePocketbase();
	const userRef = useRef<HTMLInputElement>(null);
	const passwordRef = useRef<HTMLInputElement>(null);
	const [isAuthenticating, setIsAuthenticating] = useState(false);
	const [authError, setAuthError] = useState<string>();
	const navigate = useNavigate();

	const emailPassword = authMethods.data?.emailPassword || authMethods.data?.usernamePassword;
	const externalAuth = authMethods.data?.authProviders.length ?? 0 > 0;

	function loginWithPassword() {
		const username = userRef.current?.value ?? '';
		const password = passwordRef.current?.value ?? '';
		setIsAuthenticating(true);
		setAuthError(undefined);
		pocketbase
			.collection(Collections.Users)
			.authWithPassword(username, password)
			.then(() => {
				setIsAuthenticating(false);
				navigate('/');
			})
			.catch(e => {
				setAuthError('Nutzername oder Passwort falsch.');
				setIsAuthenticating(false);
			});
	}

	function loginWithProvider(provider: AuthProviderInfo) {
		return () => {
			// todo
		};
	}

	return (
		<Container size={420} my={40}>
			<Title align='center' sx={theme => ({ fontFamily: `Open Sans, ${theme.fontFamily}`, fontWeight: 900 })}>
				Better Provadis Coach
			</Title>
			<Paper withBorder shadow='md' p={30} mt={30} radius='md' h={300}>
				{authError && <Alert color='red'>{authError}</Alert>}
				{authMethods.loading && (
					<Center h='100%'>
						<Loader />
					</Center>
				)}
				{!authMethods.loading && authMethods.data && (
					<>
						{externalAuth ? (
							<Group grow mb='md' mt='md'>
								{authMethods.data.authProviders.map(provider => (
									<Button onClick={loginWithProvider(provider)}>Login with {provider.name}</Button>
								))}
							</Group>
						) : undefined}
						{emailPassword && externalAuth ? (
							<Divider label='Oder mit E-Mail und Passwort' labelPosition='center' my='lg' />
						) : undefined}
						{emailPassword && (
							<>
								<TextInput ref={userRef} label='Benutzername' placeholder='' required />
								<PasswordInput ref={passwordRef} label='Passwort' placeholder='' required mt='md' />
								<Button fullWidth mt='xl' onClick={loginWithPassword} loading={isAuthenticating}>
									Anmelden
								</Button>
							</>
						)}
						{!(emailPassword || externalAuth) && (
							<Alert
								icon={<Error size='lg' />}
								title='Anmeldung aktuell leider nicht möglich!'
								color='red'>
								Anmeldung ist aktuell leider nicht möglich. Bitte versuche es zu einem späteren
								Zeitpunkt erneut!
							</Alert>
						)}
					</>
				)}
				{!authMethods.loading && authMethods.error && (
					<Alert icon={<Error size='lg' />} title='Anmeldung aktuell leider nicht möglich!' color='red'>
						Hintergrunddienst nicht erreichbar. Bitte versuche es später erneut. Falls Problem wiederholt
						auftritt kontaktiere bitte den <a href='mailto:webmaster@j0nas.xyz'>Administrator</a> (
						{JSON.stringify(authMethods.error)})
					</Alert>
				)}
			</Paper>
		</Container>
	);
}
