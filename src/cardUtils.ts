import fetch from 'node-fetch';

const cardURL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const banlistRows = 'A2:E';
const banlistURL = `https://sheets.googleapis.com/v4/spreadsheets/1zJcbfYTG8HF_p3HmJYi_2M7kQ9JhpdJ8UcbJZc5H4ZM/values/${banlistRows}?key=${
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

type GoogleSheetResponse = {
  majorDimension: string;
  range: string;
  values: string[][];
};

export const getAllCards = async (): Promise<CardDB> => {
  const res = await fetch(cardURL);
  const allCards = (await res.json()) as { data: YGOPROAPICard[] };
  // NOTE: This reduce takes a while due to reformatting tens of thousands of entries.
  // May want to look into optimization. This is only run once on startup.
  const cardDB: CardDB = allCards.data.reduce((db, card) => {
    return {
      ...db,
      [card.name]: {
        id: card.id,
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
      },
    };
  }, {});
  return cardDB;
};

export const getBanlist = async (cardDB: Record<string, Card>): Promise<BanlistItem[]> => {
  const res = await fetch(banlistURL);
  const banlist = (await res.json()) as GoogleSheetResponse;
  const formattedBanlist: BanlistItem[] = banlist.values
    .filter((val) => !!val[0])
    .map((val) => {
      const cardDBCard = cardDB[val[0]];
      return {
        id: cardDBCard.id,
        name: val[0],
        images: cardDB[val[0]].images,
        legality: val[1],
        remark: val[2],
        notes: val[3],
      };
    });
  return formattedBanlist;
};
