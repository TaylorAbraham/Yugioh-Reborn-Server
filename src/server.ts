import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';

dotenv.config();

import { getAllCards, getBanlist } from './cardUtils';

const PORT = process.env.PORT || 8080;

let cardDB: CardDB;
let banlist: BanlistItem[];

/* SECTION: CORS */
const allowedOrigins = ['https://localhost:8080'];
const corsOptions = {
  origin: allowedOrigins,
};

/* SECTION: SERVER SETUP */
const app = express();
app.use(cors(corsOptions));
app.use(morgan('tiny'));

const setup = async (): Promise<void> => {
  console.log(`Server is starting up on port ${PORT}...`);
  cardDB = await getAllCards();
  banlist = await getBanlist(cardDB);
  console.log('Server finished starting up!');
};

setup().catch(console.log);

/* SECTION: ROUTES */
app.get('/ping', (_req, res) => res.send('pong'));

app.listen(PORT);
