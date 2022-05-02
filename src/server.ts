import express, { Response } from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';

dotenv.config();

import { createCardDB } from './cardUtils';
import { ERRORS } from './constants';

const PORT = process.env.PORT || 8080;
let startingUp = true;
const startTime = Date.now();

let cardDB: CardDB;
let decklists: Decklists;
let flList: FLList;
let addList: AddList;

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
  const createdVals = await createCardDB();
  cardDB = createdVals.cardDB;
  decklists = createdVals.decklists;
  flList = createdVals.flList;
  addList = createdVals.addList;
  startingUp = false;
  console.log(`Server finished starting up! Took ${(Date.now() - startTime) / 1000} seconds.`);
};

setup().catch(console.log);

/* SECTION: ROUTES */
app.get('/ping', (_req, res) => res.send('pong'));

const sendStartupError = (res: Response): void => {
  res.status(500).send({
    error: {
      msg: 'Server has not finished started up.',
      type: ERRORS.SERVER_NOT_STARTED,
    },
  });
};

app.get('/allcardinfo', (_req, res) => {
  if (startingUp) {
    sendStartupError(res);
  } else {
    res.send({
      cardDB,
      decklists,
      flList,
      addList,
    });
  }
});

app.get('/carddb', (_req, res) => {
  if (startingUp) {
    sendStartupError(res);
  } else {
    res.send(cardDB);
  }
});

app.get('/decklists', (_req, res) => {
  if (startingUp) {
    sendStartupError(res);
  } else {
    res.send(decklists);
  }
});

app.get('/fllist', (_req, res) => {
  if (startingUp) {
    sendStartupError(res);
  } else {
    res.send(flList);
  }
});

app.get('/addlist', (_req, res) => {
  if (startingUp) {
    sendStartupError(res);
  } else {
    res.send(addList);
  }
});

app.listen(PORT);
