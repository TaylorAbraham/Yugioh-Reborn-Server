import fetch from 'node-fetch';

const cardURL = 'https://db.ygoprodeck.com/api/v7/cardinfo.php';

export const getAllCards = async () => {
  const res = await fetch(cardURL);
  const body = await res.json();
  return body;
};
