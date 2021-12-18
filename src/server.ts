import express from 'express';
import dotenv from 'dotenv';
import morgan from 'morgan';
import cors from 'cors';

import { getAllCards } from './cardUtils';

dotenv.config();

/* SECTION: CORS */
const allowedOrigins = ['https://localhost:8080'];
const corsOptions = {
  origin: allowedOrigins,
};

/* SECTION: SERVER SETUP */
const app = express();
app.use(cors(corsOptions));
app.use(morgan('tiny'));

const cardDB = getAllCards();

/* SECTION: ROUTES */
app.get('/ping', (_req, res) => res.send('pong'));

app.listen(process.env.PORT || 8080);
