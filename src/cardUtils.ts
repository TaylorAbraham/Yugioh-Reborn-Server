import fetch from 'node-fetch';
import { LEGALITY, MAX_REQUEST_ATTEMPTS } from './constants';

const cardURL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const fllistRows = 'A2:E';
const fllistURL = `https://sheets.googleapis.com/v4/spreadsheets/1zJcbfYTG8HF_p3HmJYi_2M7kQ9JhpdJ8UcbJZc5H4ZM/values/${fllistRows}?key=${
  process.env.GOOGLE_API_KEY || ''
}`;

type YGOPROAPICard = {
  id: number;
  name: string;
  type: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
  scale?: number;
  linkval?: number;
  linkmarkers?: string[];
  archetype?: string;
  card_sets: CardSetInfo[];
  card_images: CardImageInfo[];
};

type GoogleSheetSuccess = {
  majorDimension: string;
  range: string;
  values: string[][];
};
type GoogleSheetError = {
  error: {
    code: number;
    message: string;
    status: string;
  };
};
type GoogleSheetResponse = GoogleSheetSuccess | GoogleSheetError;
// Custom type guard
const isSheetsError = (json: GoogleSheetResponse): json is GoogleSheetError => {
  return (json as GoogleSheetError).error !== undefined;
};

export const createCardDB = async (
  failedRequestCount = 0,
): Promise<{ cardDB: CardDB; fllist: FLList }> => {
  console.log('[STARTUP] Fetching from YGOPRO API and Google Sheets...');
  const cardFetch = fetch(cardURL);
  const flFetch = fetch(fllistURL);
  const { cardDB: tempCardDB, fllist: tempFLList } = await Promise.all([cardFetch, flFetch])
    .then(([cardRes, flRes]) => {
      console.log('[STARTUP] Done!');
      console.log('[STARTUP] Getting JSON from responses...');
      const cardJSON = cardRes.json() as Promise<{ data: YGOPROAPICard[] }>;
      const flJSON = flRes.json() as Promise<GoogleSheetResponse>;
      console.log('[STARTUP] Done!');
      return Promise.all([cardJSON, flJSON]);
    })
    .then(([cardJSON, flJSON]) => {
      console.log(`[DEBUG]: flJSON ${JSON.stringify(flJSON)}`);
      console.log('[STARTUP] Generating card DB...');
      if (isSheetsError(flJSON)) {
        throw new Error(flJSON.error.message);
      }

      const tempCardDB: CardDB = {};
      const tempFLList: FLList = { forbidden: [], limited: [], semiLimited: [], unlimited: [] };
      for (let i = 0; i < cardJSON.data.length; i++) {
        const card = cardJSON.data[i];
        // TODO: Filter out if not legal in format
        tempCardDB[card.name] = {
          id: card.id,
          name: card.name,
          type: card.type,
          desc: card.desc,
          atk: card.atk,
          def: card.def,
          level: card.level,
          race: card.race,
          attribute: card.attribute,
          scale: card.scale,
          linkval: card.linkval,
          linkmarkers: card.linkmarkers,
          archetype: card.archetype,
          sets: card.card_sets,
          images: card.card_images,
          legality: LEGALITY.UNLIMITED,
        };
      }
      console.log('[STARTUP] Done!');
      console.log('[STARTUP] Generating FLList...');
      flJSON.values
        .filter((val) => !!val[0])
        .map((val) => {
          const cardDBCard = tempCardDB[val[0]];
          const cardObj = {
            id: cardDBCard.id,
            card: cardDBCard,
            legality: val[1],
            remark: val[2],
            notes: val[3],
          };
          switch (val[1].toLowerCase()) {
            case 'forbidden':
              tempFLList.forbidden.push(cardObj);
              break;
            case 'limited':
              tempFLList.limited.push(cardObj);
              break;
            case 'semi-limited':
              tempFLList.semiLimited.push(cardObj);
              break;
            case 'unlimited':
              tempFLList.unlimited.push(cardObj);
              break;
          }
        });
      console.log('[STARTUP] Done!');
      return { cardDB: tempCardDB, fllist: tempFLList };
    })
    .catch((err) => {
      console.error(err);
      if (failedRequestCount + 1 >= MAX_REQUEST_ATTEMPTS) {
        console.error(
          `[FATAL]: Exceeded the maximum number of ${MAX_REQUEST_ATTEMPTS} API call attempts for Google Sheets/YGOPRO API.`,
        );
        process.exit(1);
      } else {
        return createCardDB(failedRequestCount + 1);
      }
    });

  return { cardDB: tempCardDB, fllist: tempFLList };
};
