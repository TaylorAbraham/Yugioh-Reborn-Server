import fetch from 'node-fetch';
import {
  LEGALITY,
  LEGAL_SETS,
  MAX_REQUEST_ATTEMPTS,
  SHONEN_JUMP_CUTOFF,
  YCSW_CUTOFF,
} from './constants';

const cardURL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const flListRows = 'A2:E';
const addListRows = 'Added!A2:D';
const getSheetsURL = (rows: string) =>
  `https://sheets.googleapis.com/v4/spreadsheets/1zJcbfYTG8HF_p3HmJYi_2M7kQ9JhpdJ8UcbJZc5H4ZM/values/${rows}?key=${
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
  card_sets?: CardSetInfo[];
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
): Promise<{ cardDB: CardDB; flList: FLList; addList: AddList }> => {
  console.log('[STARTUP] Fetching from YGOPRO API and Google Sheets...');
  if (!process.env.GOOGLE_API_KEY) {
    console.error('[FATAL] GOOGLE_API_KEY is not set.');
    process.exit(1);
  }
  const cardFetch = fetch(cardURL);
  const flListFetch = fetch(getSheetsURL(flListRows));
  const addListFetch = fetch(getSheetsURL(addListRows));
  const {
    cardDB: tempCardDB,
    flList: tempFLList,
    addList: tempAddList,
  } = await Promise.all([cardFetch, flListFetch, addListFetch])
    .then(([cardRes, flRes, addListRes]) => {
      console.log('[STARTUP] Done!');
      console.log('[STARTUP] Getting JSON from responses...');
      const cardJSON = cardRes.json() as Promise<{ data: YGOPROAPICard[] }>;
      const flJSON = flRes.json() as Promise<GoogleSheetResponse>;
      const addListJSON = addListRes.json() as Promise<GoogleSheetResponse>;
      console.log('[STARTUP] Done!');
      return Promise.all([cardJSON, flJSON, addListJSON]);
    })
    .then(([cardJSON, flListJSON, addListJSON]) => {
      if (isSheetsError(flListJSON)) {
        throw new Error(flListJSON.error.message);
      }
      if (isSheetsError(addListJSON)) {
        throw new Error(addListJSON.error.message);
      }

      const addedCardNames: Record<string, boolean> = {};
      const tempCardDB: CardDB = {};
      const tempFLList: FLList = { forbidden: [], limited: [], semiLimited: [], unlimited: [] };
      const tempAddList: AddList = [];

      console.log('[STARTUP] Pulling names from Add List...');
      addListJSON.values
        .filter((row) => !!row[0])
        .map((row) => {
          addedCardNames[row[0]] = true;
        });
      console.log('[STARTUP] Done!');

      /**
       * This code uses index-based for loops as this is a massive operation on tens of thousands
       * of rows of data, and index-based for loops are the most performant by a large margin.
       */
      console.log('[STARTUP] Generating card DB...');
      for (let i = 0; i < cardJSON.data.length; i++) {
        const card = cardJSON.data[i];
        if (card.card_sets === undefined) {
          continue;
        }
        for (let j = 0; j < card.card_sets.length; j++) {
          const [cardSetCode, cardSetID] = card.card_sets[j].set_code.split('-');
          let legalCard = false;
          if (LEGAL_SETS[cardSetCode]) {
            legalCard = true;
          } else if (addedCardNames[card.name]) {
            // This is a card added to the format via the Add List
            legalCard = true;
          } else if (
            cardSetCode === 'JUMP' &&
            parseInt(cardSetID.replace(/\D/g, '')) < SHONEN_JUMP_CUTOFF
          ) {
            legalCard = true;
          } else if (
            cardSetCode === 'YCSW' &&
            parseInt(cardSetID.replace(/\D/g, '')) < YCSW_CUTOFF
          ) {
            legalCard = true;
          }
          if (legalCard) {
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
            break; // Avoid adding the same card multiple times
          }
        }
      }
      console.log('[STARTUP] Done!');
      console.log('[STARTUP] Generating FLList...');
      flListJSON.values
        .filter((row) => !!row[0])
        .map((row) => {
          const cardDBCard = tempCardDB[row[0]];
          const cardObj = {
            id: cardDBCard.id,
            card: cardDBCard,
            legality: row[1],
            remark: row[2],
            notes: row[3],
          };
          switch (row[1].toLowerCase()) {
            case 'forbidden':
              tempFLList.forbidden.push(cardObj);
              cardDBCard.legality = LEGALITY.FORBIDDEN;
              break;
            case 'limited':
              tempFLList.limited.push(cardObj);
              cardDBCard.legality = LEGALITY.LIMITED;
              break;
            case 'semi-limited':
              tempFLList.semiLimited.push(cardObj);
              cardDBCard.legality = LEGALITY.SEMILIMITED;
              break;
            case 'unlimited':
              tempFLList.unlimited.push(cardObj);
              break;
          }
        });
      console.log('[STARTUP] Done!');
      console.log('[STARTUP] Generating Add List...');
      addListJSON.values
        .filter((row) => !!row[0])
        .map((row) => {
          const cardDBCard = tempCardDB[row[0]];
          tempAddList.push({
            id: cardDBCard.id,
            card: cardDBCard,
            setCode: row[1],
            releaseDate: row[2],
            notes: row[3],
          });
        });
      console.log('[STARTUP] Done!');
      return { cardDB: tempCardDB, flList: tempFLList, addList: tempAddList };
    })
    .catch((err) => {
      console.error(`[ERROR] ${err}`);
      if (failedRequestCount + 1 >= MAX_REQUEST_ATTEMPTS) {
        console.error(
          `[FATAL]: Exceeded the maximum number of ${MAX_REQUEST_ATTEMPTS} API call attempts for Google Sheets/YGOPRO API.`,
        );
        process.exit(1);
      } else {
        return createCardDB(failedRequestCount + 1);
      }
    });

  return { cardDB: tempCardDB, flList: tempFLList, addList: tempAddList };
};
