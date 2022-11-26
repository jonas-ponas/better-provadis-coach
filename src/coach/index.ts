import Coach from './Coach';
import dotenv from 'dotenv';
import {writeFile} from 'fs';
dotenv.config();

const data = {
	token: process.env.ACCESS_TOKEN || '',
	expires: process.env.ACCESS_TOKEN_EXPIRES || '0', // Force to get a new token immedeatly
	refreshToken: process.env.REFRESH_TOKEN || '',
	clientId: process.env.CLIENT_ID || '',
	clientSecret: process.env.CLIENT_SECRET || '',
	domainId: 2
};
let coach: Coach = new Coach(data);

async function main() {
	const init = await coach.getUserInfo();
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
