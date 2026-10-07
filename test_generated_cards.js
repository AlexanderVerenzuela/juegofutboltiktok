import https from 'node:https';

const testUrls = [
  'https://www.futwiz.com/generatedcards/fc26/33.png',
  'https://www.futwiz.com/generatedcards/fc26/231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/generated/231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/generatedcards/231747.png',
  'https://www.futwiz.com/fc26/player/kylian-mbappe/33/card',
  'https://www.futwiz.com/fc26/player/kylian-mbappe/33/image',
  'https://cdn.futwiz.com/assets/img/fc26/cards/gold-rare/231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/cards/gold_rare/231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/cards/gold/231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/fullcards/231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/card/231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/cards/large/231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/faces/full/231747.png'
];

function check(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, res => {
      resolve({ url, status: res.statusCode, type: res.headers['content-type'], length: res.headers['content-length'] });
    }).on('error', err => resolve({ url, error: err.message }));
  });
}

async function run() {
  for (const u of testUrls) {
    const res = await check(u);
    console.log(res);
  }
}

run();
