import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';

dotenv.config();

import { getAllCards, getFLList } from './cardUtils';

const PORT = process.env.PORT || 8080;
let startingUp = true;
const startTime = Date.now();

let cardDB: CardDB;
let fllist: FLList;

/* SECTION: CORS */
const allowedOrigins = ['https://ygo-reborn.xyz', 'http://localhost:3000'];
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
  fllist = await getFLList(cardDB);
  startingUp = false;
  console.log(`Server finished starting up! Took ${(Date.now() - startTime) / 1000} seconds.`);
};

setup().catch(console.log);

/* SECTION: ROUTES */
app.get('/ping', (_req, res) => res.send('pong'));

app.get('/fllist', (_req, res) => {
  if (startingUp) {
    res.status(500).send({ error: { msg: 'Server has not finished started up.', type: 'SERVER_NOT_STARTED' } });
  } else {
    res.send(fllist);
  }
});

app.listen(PORT);
