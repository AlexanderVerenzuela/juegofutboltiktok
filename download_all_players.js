import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
const CHAR_FILE = path.join(__dirname, 'characters.json');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const players = [
  ["player_1", "Lionel Messi", "Inter Miami / Argentina", "https://upload.wikimedia.org/wikipedia/commons/c/c1/Lionel_Messi_20180626.jpg"],
  ["player_2", "Cristiano Ronaldo", "Al Nassr / Portugal", "https://upload.wikimedia.org/wikipedia/commons/8/8c/Cristiano_Ronaldo_2018.jpg"],
  ["player_3", "Kylian Mbappé", "Real Madrid / France", "https://upload.wikimedia.org/wikipedia/commons/5/57/2019-06-11_The_Euro_2020_qualifier_match_Andorra_vs._France_-_Kylian_Mbapp%C3%A9_%28cropped%29.jpg"],
  ["player_4", "Erling Haaland", "Manchester City / Norway", "https://upload.wikimedia.org/wikipedia/commons/0/07/Erling_Haaland_2023.jpg"],
  ["player_5", "Vinícius Júnior", "Real Madrid / Brazil", "https://upload.wikimedia.org/wikipedia/commons/f/f3/Vinicius_Jr_2021.jpg"],
  ["player_6", "Jude Bellingham", "Real Madrid / England", "https://upload.wikimedia.org/wikipedia/commons/1/1d/Jude_Bellingham_2023.jpg"],
  ["player_7", "Lamine Yamal", "FC Barcelona / Spain", "https://upload.wikimedia.org/wikipedia/commons/b/b5/Lamine_Yamal_2024.jpg"],
  ["player_8", "Robert Lewandowski", "FC Barcelona / Poland", "https://upload.wikimedia.org/wikipedia/commons/0/03/Robert_Lewandowski_2018.jpg"],
  ["player_9", "Kevin De Bruyne", "Manchester City / Belgium", "https://upload.wikimedia.org/wikipedia/commons/4/40/Kevin_De_Bruyne_2018.jpg"],
  ["player_10", "Neymar Jr", "Al Hilal / Brazil", "https://upload.wikimedia.org/wikipedia/commons/b/bb/Neymar_Jr._with_PSG_in_2018.jpg"],
  ["player_11", "Mohamed Salah", "Liverpool / Egypt", "https://upload.wikimedia.org/wikipedia/commons/c/c1/Mohamed_Salah_2018.jpg"],
  ["player_12", "Harry Kane", "Bayern Munich / England", "https://upload.wikimedia.org/wikipedia/commons/2/29/Harry_Kane_2018.jpg"],
  ["player_13", "Luka Modrić", "Real Madrid / Croatia", "https://upload.wikimedia.org/wikipedia/commons/e/e9/Luka_Modri%C4%87_2018.jpg"],
  ["player_14", "Bukayo Saka", "Arsenal / England", "https://upload.wikimedia.org/wikipedia/commons/b/b8/Bukayo_Saka_2022.jpg"],
  ["player_15", "Phil Foden", "Manchester City / England", "https://upload.wikimedia.org/wikipedia/commons/1/1d/Phil_Foden_2021.jpg"],
  ["player_16", "Pedri", "FC Barcelona / Spain", "https://upload.wikimedia.org/wikipedia/commons/2/23/Pedri_2021.jpg"],
  ["player_17", "Gavi", "FC Barcelona / Spain", "https://upload.wikimedia.org/wikipedia/commons/a/a2/Gavi_2022.jpg"],
  ["player_18", "Lautaro Martínez", "Inter Milan / Argentina", "https://upload.wikimedia.org/wikipedia/commons/d/d4/Lautaro_Mart%C3%ADnez_2018.jpg"],
  ["player_19", "Julián Álvarez", "Atlético Madrid / Argentina", "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop"],
  ["player_20", "Rodri", "Manchester City / Spain", "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&auto=format&fit=crop"],
  ["player_21", "Federico Valverde", "Real Madrid / Uruguay", "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&auto=format&fit=crop"],
  ["player_22", "Son Heung-min", "Tottenham / South Korea", "https://upload.wikimedia.org/wikipedia/commons/c/c1/Son_Heung-min_2022.jpg"],
  ["player_23", "Florian Wirtz", "Bayer Leverkusen / Germany", "https://upload.wikimedia.org/wikipedia/commons/8/87/Florian_Wirtz_2024.jpg"],
  ["player_24", "Jamal Musiala", "Bayern Munich / Germany", "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop"],
  ["player_25", "Cole Palmer", "Chelsea / England", "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=600&auto=format&fit=crop"],
  ["player_26", "Emiliano Martínez", "Aston Villa / Argentina", "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&auto=format&fit=crop"],
  ["player_27", "Virgil van Dijk", "Liverpool / Netherlands", "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&auto=format&fit=crop"],
  ["player_28", "Raphinha", "FC Barcelona / Brazil", "https://images.unsplash.com/photo-1543326727-cf6c39e8f84c?w=600&auto=format&fit=crop"],
  ["player_29", "Antoine Griezmann", "Atlético Madrid / France", "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=600&auto=format&fit=crop"],
  ["player_30", "Nico Williams", "Athletic Bilbao / Spain", "https://images.unsplash.com/photo-1489944440615-453fc2b6a9a9?w=600&auto=format&fit=crop"],
  ["player_31", "Thibaut Courtois", "Real Madrid / Belgium", "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop"],
  ["player_32", "Bruno Fernandes", "Manchester United / Portugal", "https://images.unsplash.com/photo-1517466787929-bc90951d0974?w=600&auto=format&fit=crop"],
  ["player_33", "Bernardo Silva", "Manchester City / Portugal", "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=600&auto=format&fit=crop"],
  ["player_34", "Paulo Dybala", "AS Roma / Argentina", "https://images.unsplash.com/photo-1518091043644-c1d4457512c6?w=600&auto=format&fit=crop"],
  ["player_35", "Luis Díaz", "Liverpool / Colombia", "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&auto=format&fit=crop"],
  ["player_36", "Federico Chiesa", "Liverpool / Italy", "https://images.unsplash.com/photo-1522778119026-d647f0596c20?w=600&auto=format&fit=crop"]
];

function download(url, dest) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return download(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode !== 200) return resolve(false);
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(true); });
    }).on('error', () => resolve(false));
  });
}

async function run() {
  const chars = [];
  for (const [pid, name, team, url] of players) {
    const filename = `${pid}.jpg`;
    const dest = path.join(UPLOAD_DIR, filename);
    const webPath = `/uploads/${filename}`;
    
    console.log(`Downloading ${name}...`);
    const ok = await download(url, dest);
    console.log(`  -> ${ok ? 'OK' : 'FAILED'}`);
    
    chars.push({ id: pid, name, series: team, image: webPath });
  }
  fs.writeFileSync(CHAR_FILE, JSON.stringify(chars, null, 2), 'utf8');
  console.log('DONE!');
}

run();
