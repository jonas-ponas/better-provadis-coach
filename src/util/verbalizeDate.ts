export default function verbalizeDate(date: Date | string) {
	if (typeof date == 'string') {
		date = new Date(date);
	}
	const now = new Date();
	const diff = Math.abs(date.getTime() - now.getTime()) / 1000;
	if (diff < 7 * 24 * 60 * 60) {
		if (diff < 60 * 60) return `vor ${Math.floor(diff / 60)} Minuten`;
		if (diff < 24 * 60 * 60) return `vor ${Math.floor(diff / (60 * 60))} Stunden`;
		return `vor ${Math.floor(diff / (24 * 60 * 60))} Tagen`;
	}
	return date.toLocaleString('de-de');
}
