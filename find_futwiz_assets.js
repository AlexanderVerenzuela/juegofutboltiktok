import https from 'node:https';

const futwizBase = 'https://cdn.futwiz.com/assets/img';
const eaIds = {
  'Kylian Mbappé': 231747,
  'Lionel Messi': 158023,
  'Cristiano Ronaldo': 20801,
  'Erling Haaland': 239085,
  'Vinícius Júnior': 238794,
  'Jude Bellingham': 252371,
  'Lamine Yamal': 277255,
  'Robert Lewandowski': 188545,
  'Kevin De Bruyne': 192985,
  'Neymar Jr': 190871,
  'Mohamed Salah': 209331,
  'Harry Kane': 202126,
  'Luka Modrić': 177003,
  'Bukayo Saka': 246669,
  'Phil Foden': 237692,
  'Pedri': 251852,
  'Gavi': 264240,
  'Lautaro Martínez': 231478,
  'Julián Álvarez': 246186,
  'Rodri': 231866,
  'Federico Valverde': 239053,
  'Son Heung-min': 200104,
  'Florian Wirtz': 256630,
  'Jamal Musiala': 256790,
  'Cole Palmer': 260109,
  'Emiliano Martínez': 202652,
  'Virgil van Dijk': 203376,
  'Raphinha': 233419,
  'Antoine Griezmann': 194765,
  'Nico Williams': 262334,
  'Thibaut Courtois': 192119,
  'Bruno Fernandes': 212198,
  'Bernardo Silva': 218667,
  'Paulo Dybala': 211110,
  'Luis Díaz': 241084,
  'Federico Chiesa': 235805
};

const pathsToTest = [
  'fc26/faces/231747.png',
  'fc26/cards/231747.png',
  'fc26/render/231747.png',
  'fc26/renders/231747.png',
  'fc26/items/231747.png',
  'fc26/gold-rare/231747.png',
  'fc26/gold_rare/231747.png',
  'fc26/cardfaces/231747.png',
  'fc26/players/231747.png',
  'fc26/cards/gold-rare.png',
  'fc26/cards/gold_rare.png',
  'fc26/cards/gold.png',
  'fc26/cards/card-gold-rare.png',
  'fc26/cards/card-gold-rare.webp',
  'fc26/cards/card_gold_rare.png',
  'fc25/faces/231747.png',
  'fc25/cards/231747.png',
  'fc25/render/231747.png'
];

function check(pathStr) {
  const url = `${futwizBase}/${pathStr}`;
  return new Promise(resolve => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, res => {
      resolve({ pathStr, status: res.statusCode, size: res.headers['content-length'] });
    }).on('error', err => resolve({ pathStr, error: err.message }));
  });
}

async function main() {
  console.log('Testing Futwiz CDN Asset paths for FC 26 / FC 25...');
  for (const p of pathsToTest) {
    const r = await check(p);
    console.log(r);
  }
}

main();
