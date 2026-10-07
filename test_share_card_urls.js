import https from 'node:https';

const candidateUrls = [
  'https://www.futwiz.com/generatedcards/fc26/33-1.png',
  'https://www.futwiz.com/generatedcards/fc26/33-2.png',
  'https://www.futwiz.com/generatedcards/fc26/33-3.png',
  'https://www.futwiz.com/generatedcards/fc26/33-4.png',
  'https://www.futwiz.com/generatedcards/fc26/33-5.png',
  'https://www.futwiz.com/generatedcards/fc26/231747-5.png',
  'https://cdn.futwiz.com/assets/img/fc26/share/33.png',
  'https://cdn.futwiz.com/assets/img/fc26/share/33-5.png',
  'https://cdn.futwiz.com/assets/img/fc26/share/231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/share/231747-5.png',
  'https://cdn.futwiz.com/assets/img/fc26/cards/share/33.png',
  'https://cdn.futwiz.com/assets/img/fc26/cards/share/231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/cards/gold/231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/cards/231747_gold.png',
  'https://cdn.futwiz.com/assets/img/fc26/cards/231747_rare.png',
  'https://cdn.futwiz.com/assets/img/fc26/cards/231747_gold_rare.png',
  'https://cdn.futwiz.com/assets/img/fc26/cards/1_231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/cards/0_231747.png',
  'https://www.futwiz.com/fc26/player/kylian-mbappe/33/download',
  'https://www.futwiz.com/fc26/player/kylian-mbappe/33/download/1',
  'https://www.futwiz.com/fc26/player/kylian-mbappe/33/download/5'
];

function check(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/128.0.0.0 Safari/537.36' } }, res => {
      resolve({ url, status: res.statusCode, contentType: res.headers['content-type'], length: res.headers['content-length'], location: res.headers['location'] });
    }).on('error', err => resolve({ url, error: err.message }));
  });
}

async function run() {
  for (const u of candidateUrls) {
    const res = await check(u);
    console.log(res);
  }
}

run();
