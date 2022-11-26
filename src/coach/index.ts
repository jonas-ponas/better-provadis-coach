import Coach from './Coach';
import dotenv from 'dotenv';
import {writeFile} from 'fs';
dotenv.config();

async function main() {
	let coach: Coach = await Coach.fromQrCode(
		{
			token: process.env.ACCESS_TOKEN || '',
			expires: process.env.ACCESS_TOKEN_EXPIRES || '0',
			refreshToken: process.env.REFRESH_TOKEN || '',
			domainId: 2
		},
		process.env.CLIENT_SECRET || '',
		process.env.CLIENT_ID || ''
	);
	
	const directories = await coach.getDirectories();
	const files = await coach.getFiles();
	const news = await coach.getNews();

	writeFile('./data/dirs.json', JSON.stringify(directories), () => {});
	writeFile('./data/files.json', JSON.stringify(files), () => {});
	writeFile('./data/news.json', JSON.stringify(news), () => {});
}

main()
	.then(() => {})
	.catch((e: Error) => {
		console.error(e);
	});
