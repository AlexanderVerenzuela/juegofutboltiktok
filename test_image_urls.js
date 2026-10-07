import https from 'node:https';

const testUrls = [
  'https://cdn.futwiz.com/assets/img/fc26/cards/33.png',
  'https://cdn.futwiz.com/assets/img/fc26/faces/33.png',
  'https://cdn.futwiz.com/assets/img/fc26/players/33.png',
  'https://cdn.futwiz.com/assets/img/fc26/render/33.png',
  'https://cdn.futwiz.com/assets/img/fc26/cutouts/33.png',
  'https://cdn.futwiz.com/assets/img/fc25/cards/33.png',
  'https://cdn.futwiz.com/assets/img/fc25/faces/33.png',
  'https://cdn.futwiz.com/assets/img/fc26/faces/231747.png',
  'https://cdn.futwiz.com/assets/img/fc26/cards/231747.png',
  'https://cdn.futwiz.com/assets/img/fc25/faces/231747.png',
  'https://cdn.futwiz.com/assets/img/fc25/cards/231747.png',
  'https://www.futwiz.com/assets/img/fc26/faces/33.png',
  'https://www.futwiz.com/assets/img/fc26/cards/33.png'
];

function testUrl(url) {
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      resolve({ url, status: res.statusCode, contentType: res.headers['content-type'], length: res.headers['content-length'] });
    }).on('error', err => resolve({ url, error: err.message }));
  });
}

async function run() {
  for (const u of testUrls) {
    const res = await testUrl(u);
    console.log(res);
  }
}

run();
