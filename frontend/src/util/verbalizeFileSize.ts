export default function verbalizeFileSize(size: number) {
	if (size < Math.pow(10, 3)) return `${size} B`;
	if (size < Math.pow(10, 6)) return `${Math.round(size / Math.pow(10, 2)) / 10} KB`;
	if (size < Math.pow(10, 9)) return `${Math.round(size / Math.pow(10, 5)) / 10} MB`;
	return `${Math.round(size / Math.pow(10, 8)) / 10} GB`;
}
