import fetch from 'node-fetch';
import { LEGALITY, LEGAL_SETS, SHONEN_JUMP_CUTOFF, YCSW_CUTOFF } from './constants';

const cardURL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const decklistsRows = 'Decklists!A2:B';
const flListRows = 'Forbidden & Limited!A2:E';
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

type createCardDBReturn = Promise<{
  cardDB: CardDB;
  decklists: Decklists;
  flList: FLList;
  addList: AddList;
}>;

export const createCardDB = async (): createCardDBReturn => {
  console.log('[STARTUP] Fetching from YGOPRO API and Google Sheets...');
  if (!process.env.GOOGLE_API_KEY) {
    console.error('[FATAL] GOOGLE_API_KEY is not set.');
    process.exit(1);
  }
  const cardFetch = fetch(cardURL);
  const decklistsFetch = fetch(getSheetsURL(decklistsRows));
  const flListFetch = fetch(getSheetsURL(flListRows));
  const addListFetch = fetch(getSheetsURL(addListRows));
  const {
    cardDB: tempCardDB,
    decklists: tempDecklists,
    flList: tempFLList,
    addList: tempAddList,
  } = await Promise.all([cardFetch, decklistsFetch, flListFetch, addListFetch])
    .then(([cardRes, decklistsRes, flRes, addListRes]) => {
      console.log('[STARTUP] Done!');
      console.log('[STARTUP] Getting JSON from responses...');
      const cardJSON = cardRes.json() as Promise<{ data: YGOPROAPICard[] }>;
      const decklistsJSON = decklistsRes.json() as Promise<GoogleSheetResponse>;
      const flJSON = flRes.json() as Promise<GoogleSheetResponse>;
      const addListJSON = addListRes.json() as Promise<GoogleSheetResponse>;
      console.log('[STARTUP] Done!');
      return Promise.all([cardJSON, decklistsJSON, flJSON, addListJSON]);
    })
    .then(([cardJSON, decklistsJSON, flListJSON, addListJSON]) => {
      if (isSheetsError(decklistsJSON)) {
        throw new Error(decklistsJSON.error.message);
      }
      if (isSheetsError(flListJSON)) {
        throw new Error(flListJSON.error.message);
      }
      if (isSheetsError(addListJSON)) {
        throw new Error(addListJSON.error.message);
      }

      const addedCardNames: Record<string, boolean> = {};
      const tempCardDB: CardDB = {};
      const tempDecklists: Decklists = [];
      const tempFLList: FLList = { forbidden: [], limited: [], semiLimited: [], unlimited: [] };
      const tempAddList: AddList = [];

      const getCardDBCard = (cardName: string): Card | undefined => {
        const cardDBCard = tempCardDB[cardName];
        if (!cardDBCard) {
          console.error(`[WARNING] Could not find card in database matching name "${cardName}"`);
          return undefined;
        }
        return cardDBCard;
      };

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
          const cardDBCard = getCardDBCard(row[0]);
          if (cardDBCard === undefined) {
            return;
          }
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
      let newSection = true;
      let currAddListGroup: AddListGroup = { name: '', cards: [] };
      addListJSON.values.map((row) => {
        if (newSection) {
          newSection = false;
          currAddListGroup = { name: row[0], cards: [] };
        } else if (!row[0]) {
          // Empty row, so we're about to start a new section
          newSection = true;
          tempAddList.push(currAddListGroup);
        } else {
          const cardDBCard = getCardDBCard(row[0]);
          if (cardDBCard === undefined) {
            return;
          }
          currAddListGroup.cards.push({
            id: cardDBCard.id,
            card: cardDBCard,
            setCode: row[1],
            releaseDate: row[2],
            notes: row[3],
          });
        }
      });
      tempAddList.push(currAddListGroup); // Push the last group
      console.log('[STARTUP] Done!');

      console.log('[STARTUP] Generating Decklists...');
      const validateMainDeckCount = (decklist: Decklist): void => {
        const mainDeckCount = decklist.mainDeck.reduce(
          (count, mainDeckItem) => count + mainDeckItem.quantity,
          0,
        );
        if (mainDeckCount < 40 || mainDeckCount > 60) {
          console.log(
            `[WARN] ${decklist.name} decklist contains ${mainDeckCount} cards in the main deck.`,
          );
        }
      };

      let state: 'newSection' | 'description' | 'imgURL' | 'main' | 'extra' = 'newSection';
      let currDecklist: Decklist = {
        name: '',
        description: '',
        imgURL: '',
        mainDeck: [],
        extraDeck: [],
      };
      decklistsJSON.values.map((row) => {
        switch (state) {
          case 'newSection':
            if (!row[0] && row[1]) {
              currDecklist.name = row[1];
              state = 'description';
            }
            break;
          // @ts-expect-error Because of explicit switch case fallthrough
          case 'description':
            if (!row[0] && row[1]) {
              currDecklist.description = row[1];
              state = 'imgURL';
              break;
            } else {
              state = 'main';
            }
          // @ts-expect-error Because of explicit switch case fallthrough
          case 'imgURL':
            if (!row[0] && row[1]) {
              currDecklist.imgURL = row[1];
              state = 'main';
              break;
            }
          case 'main':
            if (row[0] && row[1]) {
              const cardDBCard = getCardDBCard(row[1]);
              if (cardDBCard === undefined) {
                return;
              }
              currDecklist.mainDeck.push({
                quantity: parseInt(row[0]),
                card: cardDBCard,
              });
            } else {
              state = 'extra';
            }
            break;
          case 'extra':
            if (row[0] && row[1]) {
              const cardDBCard = getCardDBCard(row[1]);
              if (cardDBCard === undefined) {
                return;
              }
              currDecklist.extraDeck.push({ quantity: parseInt(row[0]), card: cardDBCard });
            } else {
              state = 'newSection';
              validateMainDeckCount(currDecklist);
              tempDecklists.push(currDecklist);
              currDecklist = {
                name: '',
                description: '',
                imgURL: '',
                mainDeck: [],
                extraDeck: [],
              };
            }
            break;
        }
      });
      validateMainDeckCount(currDecklist);
      tempDecklists.push(currDecklist);
      console.log('[STARTUP] Done!');

      return {
        cardDB: tempCardDB,
        decklists: tempDecklists,
        flList: tempFLList,
        addList: tempAddList,
      };
    })
    .catch((err) => {
      console.error(`[FATAL] ${err}`);
      process.exit(1);
    });

  return {
    cardDB: tempCardDB,
    decklists: tempDecklists,
    flList: tempFLList,
    addList: tempAddList,
  };
};
