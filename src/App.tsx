import {createBrowserRouter, RouterProvider} from 'react-router-dom';
import Login from './routes/Login';
import PocketBase from 'pocketbase'
import PocketBaseContext from './hooks/PocketbaseContext';
import Callback from './routes/Callback';
import Home from './routes/Home';

const router = createBrowserRouter([
	{
		path: '/login',
		element: <Login />
	},
	{
		path: '/callback',
		element: <Callback />
	},
  {
    path: '/',
    element: <Home />
  }
]);

const client = new PocketBase('https://coach.***REMOVED***')

export default function App() {
	return <PocketBaseContext.Provider value={client}>
    <RouterProvider router={router} />
  </PocketBaseContext.Provider>;
}

