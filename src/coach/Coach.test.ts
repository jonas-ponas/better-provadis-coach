import Coach from './Coach';
import dotenv from 'dotenv';
import {writeFile, readFile} from 'fs/promises';

dotenv.config();

async function main() {
	if (!process.env.CLIENT_SECRET || !process.env.CLIENT_ID) throw Error('Client-Id or Client-Secret not found');
	let coach: Coach;
	try {
		const stateData = await readFile('./data/state.json');
		const stateJson = JSON.parse(stateData.toString());
		console.log('stateJson', stateJson);
		coach = await Coach.createFromState({
			...stateJson,
			clientId: process.env.CLIENT_ID || '',
			clientSecret: process.env.CLIENT_SECRET || ''
		});
	} catch (e) {
		console.log('Could not read from state.json. Trying to read from Env-Variables...');
		coach = await Coach.createFromQrCode(
			{
				token: process.env.ACCESS_TOKEN || '',
				expires: process.env.ACCESS_TOKEN_EXPIRES || '0',
				refreshToken: process.env.REFRESH_TOKEN || '',
				domainId: 2
			},
			process.env.CLIENT_SECRET || '',
			process.env.CLIENT_ID || ''
		);
	}
	try {
		const directories = await coach.getDirectories();
		const files = await coach.getFiles();
		const news = await coach.getNews();

		await writeFile('./data/dirs.json', JSON.stringify(directories));
		await writeFile('./data/files.json', JSON.stringify(files));
		await writeFile('./data/news.json', JSON.stringify(news));
	} catch (e) {
		throw e;
	} finally {
		await writeFile('./data/state.json', JSON.stringify(coach.exportFromState()));
	}
}

main()
	.then(() => {})
	.catch((e: Error) => {
		console.error(e);
	});
