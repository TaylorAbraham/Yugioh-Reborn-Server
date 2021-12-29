type Card = {
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
  sets: CardSetInfo[];
  images: CardImageInfo[];
};

type CardDB = Record<string, Card>;

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

type FLListItem = {
  id: number;
  card: Card;
  legality: string;
  remark: string;
  notes: string;
};

type FLList = {
  forbidden: FLListItem[];
  limited: FLListItem[];
  semiLimited: FLListItem[];
  unlimited: FLListItem[];
};
