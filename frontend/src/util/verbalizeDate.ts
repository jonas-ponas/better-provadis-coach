export default function verbalizeDate(date: Date | string) {
	if (typeof date == 'string') {
		date = new Date(date);
	}
	const now = new Date();
	const diff = Math.abs(date.getTime() - now.getTime()) / 1000;
	const verb = date.getTime() > now.getTime() ? 'in' : 'vor';
	if (diff < 7 * 24 * 60 * 60) {
		if (diff < 60 * 60) return `${verb} ${Math.floor(diff / 60)} Minuten`;
		if (diff < 24 * 60 * 60) return `${verb} ${Math.floor(diff / (60 * 60))} Stunden`;
		return `${verb} ${Math.floor(diff / (24 * 60 * 60))} Tagen`;
	}
	return `${date.toLocaleDateString('de-de')}, ${date.toLocaleTimeString('de-de').slice(0, 5)}`;
}
