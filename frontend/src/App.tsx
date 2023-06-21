import { RouterProvider } from 'react-router-dom';
import PocketBase from 'pocketbase';
import { PocketBaseProvider } from './util/PocketbaseContext';
import router from './Router';

const client = new PocketBase();
export default function App() {
	return (
		<PocketBaseProvider value={client}>
			<RouterProvider router={router(client)} />
		</PocketBaseProvider>
	);
}
