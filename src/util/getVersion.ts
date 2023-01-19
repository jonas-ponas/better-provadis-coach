export async function getVersions(): Promise<[string, string]> {
	const response = await fetch('/version.json');
	const [ui, pb] = await response.json();
	return [ui, pb];
}
