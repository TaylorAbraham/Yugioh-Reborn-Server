/* eslint-disable @typescript-eslint/no-unsafe-member-access */
import fetch from 'node-fetch';

const cardURL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';
const banlistRows = 'A2:E';
const banlistURL = `https://sheets.googleapis.com/v4/spreadsheets/1zJcbfYTG8HF_p3HmJYi_2M7kQ9JhpdJ8UcbJZc5H4ZM/values/${banlistRows}?key=${
  process.env.GOOGLE_API_KEY || ''
}`;

type Card = {
  id: number;
  type: string;
  desc: string;
  atk?: number;
  def?: number;
  level?: number;
  race?: string;
  attribute?: string;
  card_sets: CardSetInfo[];
  card_images: CardImageInfo[];
};

type CardWithName = Card & {
  name: string;
};

type CardSetInfo = {
  set_name: string;
  set_code: string;
  set_rarity: string;
  set_rarity_code: string;
  set_price: string;
};

type CardImageInfo = {
  id: number;
  image_url: string;
  image_url_small: string;
};

type BanlistItem = {
  id: number;
  name: string;
  legality: string;
  remark: string;
  notes: string;
};

type GoogleSheetResponse = {
  majorDimension: string;
  range: string;
  values: string[][];
};

export const getAllCards = async (): Promise<Record<string, Card>> => {
  const res = await fetch(cardURL);
  const allCards = (await res.json()) as { data: CardWithName[] };
  // NOTE: This reduce takes a while due to reformatting tens of thousands of entries.
  // May want to look into optimization. This is only run once on startup.
  const cardDB = allCards.data.reduce((db, card) => {
    const { name: _name, ...cardWithoutName } = card;
    return { ...db, [card.name]: { ...cardWithoutName } };
  }, {});
  return cardDB;
};

export const getBanlist = async (cardDB: Record<string, Card>): Promise<BanlistItem[]> => {
  const res = await fetch(banlistURL);
  const banlist = (await res.json()) as GoogleSheetResponse;
  const formattedBanlist: BanlistItem[] = banlist.values
    .filter((val) => !!val[0])
    .map((val) => {
      return {
        id: cardDB[val[0]].id,
        name: val[0],
        legality: val[1],
        remark: val[2],
        notes: val[3],
      };
    });
  return formattedBanlist;
};
