import express from 'express';
import router from './router';

const BASENAME = process.env.BASENAME ?? '/';
const PORT = process.env.PORT ?? 8080;

const app = express();
app.use(BASENAME, router);

app.listen(PORT, () => {
	console.log(`Listening on ${PORT} on path ${BASENAME}`);
});
