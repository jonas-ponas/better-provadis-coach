export function getIcalServiceUrl() {
	const serviceUrlEnv = import.meta.env.VITE_ICAL_SERVICE_URI as string;
	let serviceUrl: string;
	if (!serviceUrlEnv) {
		serviceUrl = `${window.location.protocol}//${window.location.host}/ical`;
	} else if (serviceUrlEnv.startsWith('/')) {
		serviceUrl = `${window.location.protocol}//${window.location.host}${serviceUrlEnv}`;
	} else {
		serviceUrl = serviceUrlEnv;
	}
	return serviceUrl;
}
