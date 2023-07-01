import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import PocketBase, { AuthMethodsList, ClientResponseError } from 'pocketbase';
import { Collections, DirectoryResponse, FileResponse, UserFilesResponse } from './pocketbase-types';

export const PocketBaseContext = createContext({} as PocketBase);

export function usePocketbase() {
	return useContext(PocketBaseContext);
}

export function useAuthMethods() {
	const client = usePocketbase();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<AuthMethodsList>();
	const [error, setError] = useState<any>();

	useEffect(() => {
		setLoading(true);
		setError(undefined);
		client
			.collection(Collections.Users)
			.listAuthMethods()
			.then(result => {
				setLoading(false);
				setData(result);
			})
			.catch(e => {
				setLoading(false);
				if (e instanceof ClientResponseError && e.isAbort) return;
				setError(e);
			});
	}, []);

	return {
		loading,
		data,
		error
	};
}

export function useFiles(): [{ loading: boolean; data?: FileResponse[]; error?: any }, (directory: string) => void] {
	const client = usePocketbase();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<UserFilesResponse[]>();
	const [error, setError] = useState<any>();

	const fetchData = useCallback((directory: string) => {
		setLoading(true);
		setError(undefined);
		client
			.collection(Collections.UserFiles)
			.getFullList<UserFilesResponse>({
				filter: `directory = "${directory}"`,
				$cancelKey: 'files'
			})
			.then(result => {
				setLoading(false);
				setData(result);
			})
			.catch(e => {
				setLoading(false);
				setError(e);
			});
	}, []);

	return [
		{
			loading,
			data,
			error
		},
		fetchData
	];
}

export function useFolders(): [
	{ loading: boolean; data?: DirectoryResponse[]; error?: any },
	(parent: string | null) => void
] {
	const client = usePocketbase();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<DirectoryResponse[]>();
	const [error, setError] = useState<any>();

	const fetchData = useCallback((parent: string | null) => {
		setLoading(true);
		setError(undefined);
		client
			.collection(Collections.Directory)
			.getFullList<DirectoryResponse>({
				filter: parent === null ? `parent = null` : `parent = '${parent}'`,
				$cancelKey: 'directories'
			})
			.then(result => {
				setLoading(false);
				setData(result);
			})
			.catch(e => {
				setLoading(false);
				setError(e);
			});
	}, []);

	return [
		{
			loading,
			data,
			error
		},
		fetchData
	];
}

export function useOneFolder(): [
	{ loading: boolean; data?: DirectoryResponse | null; error?: any },
	(id: string) => void
] {
	const client = usePocketbase();
	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<DirectoryResponse>();
	const [error, setError] = useState<any>();

	const fetchData = useCallback((id: string) => {
		setLoading(true);
		setError(undefined);
		client
			.collection(Collections.Directory)
			.getOne<DirectoryResponse>(id, {
				$cancelKey: 'dir-' + id
			})
			.then(result => {
				setLoading(false);
				setData(result);
			})
			.catch(e => {
				setLoading(false);
				setError(e);
			});
	}, []);

	return [
		{
			loading,
			data,
			error
		},
		fetchData
	];
}
