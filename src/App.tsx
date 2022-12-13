import { RouterProvider } from 'react-router-dom';
import PocketBase from 'pocketbase';
import { PocketBaseProvider } from './util/PocketbaseContext';
import router from './AppRouter';

const client = new PocketBase('https://coach.***REMOVED***');

export default function App() {
	return (
		<PocketBaseProvider value={client}>
			<RouterProvider router={router(client)} />
		</PocketBaseProvider>
	);
}
