import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const CHAR_FILE = path.join(__dirname, 'characters.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

const playersList = [
  { name: 'Lionel Messi', team: 'Inter Miami / Argentina', wiki: 'Lionel_Messi' },
  { name: 'Cristiano Ronaldo', team: 'Al Nassr / Portugal', wiki: 'Cristiano_Ronaldo' },
  { name: 'Kylian Mbappé', team: 'Real Madrid / France', wiki: 'Kylian_Mbappé' },
  { name: 'Erling Haaland', team: 'Manchester City / Norway', wiki: 'Erling_Haaland' },
  { name: 'Vinícius Júnior', team: 'Real Madrid / Brazil', wiki: 'Vinícius_Júnior' },
  { name: 'Jude Bellingham', team: 'Real Madrid / England', wiki: 'Jude_Bellingham' },
  { name: 'Lamine Yamal', team: 'FC Barcelona / Spain', wiki: 'Lamine_Yamal' },
  { name: 'Robert Lewandowski', team: 'FC Barcelona / Poland', wiki: 'Robert_Lewandowski' },
  { name: 'Kevin De Bruyne', team: 'Manchester City / Belgium', wiki: 'Kevin_De_Bruyne' },
  { name: 'Neymar Jr', team: 'Al Hilal / Brazil', wiki: 'Neymar' },
  { name: 'Mohamed Salah', team: 'Liverpool / Egypt', wiki: 'Mohamed_Salah' },
  { name: 'Harry Kane', team: 'Bayern Munich / England', wiki: 'Harry_Kane' },
  { name: 'Luka Modrić', team: 'Real Madrid / Croatia', wiki: 'Luka_Modrić' },
  { name: 'Bukayo Saka', team: 'Arsenal / England', wiki: 'Bukayo_Saka' },
  { name: 'Phil Foden', team: 'Manchester City / England', wiki: 'Phil_Foden' },
  { name: 'Pedri', team: 'FC Barcelona / Spain', wiki: 'Pedri' },
  { name: 'Gavi', team: 'FC Barcelona / Spain', wiki: 'Gavi_(footballer)' },
  { name: 'Lautaro Martínez', team: 'Inter Milan / Argentina', wiki: 'Lautaro_Martínez' },
  { name: 'Julián Álvarez', team: 'Atlético Madrid / Argentina', wiki: 'Julián_Álvarez_(footballer)' },
  { name: 'Rodri', team: 'Manchester City / Spain', wiki: 'Rodri_(footballer,_born_1996)' },
  { name: 'Federico Valverde', team: 'Real Madrid / Uruguay', wiki: 'Federico_Valverde' },
  { name: 'Son Heung-min', team: 'Tottenham / South Korea', wiki: 'Son_Heung-min' },
  { name: 'Florian Wirtz', team: 'Bayer Leverkusen / Germany', wiki: 'Florian_Wirtz' },
  { name: 'Jamal Musiala', team: 'Bayern Munich / Germany', wiki: 'Jamal_Musiala' },
  { name: 'Cole Palmer', team: 'Chelsea / England', wiki: 'Cole_Palmer' },
  { name: 'Emiliano Martínez', team: 'Aston Villa / Argentina', wiki: 'Emiliano_Martínez' },
  { name: 'Virgil van Dijk', team: 'Liverpool / Netherlands', wiki: 'Virgil_van_Dijk' },
  { name: 'Raphinha', team: 'FC Barcelona / Brazil', wiki: 'Raphinha' },
  { name: 'Antoine Griezmann', team: 'Atlético Madrid / France', wiki: 'Antoine_Griezmann' },
  { name: 'Nico Williams', team: 'Athletic Bilbao / Spain', wiki: 'Nico_Williams' },
  { name: 'Thibaut Courtois', team: 'Real Madrid / Belgium', wiki: 'Thibaut_Courtois' },
  { name: 'Bruno Fernandes', team: 'Manchester United / Portugal', wiki: 'Bruno_Fernandes' },
  { name: 'Bernardo Silva', team: 'Manchester City / Portugal', wiki: 'Bernardo_Silva' },
  { name: 'Paulo Dybala', team: 'AS Roma / Argentina', wiki: 'Paulo_Dybala' },
  { name: 'Luis Díaz', team: 'Liverpool / Colombia', wiki: 'Luis_Díaz_(footballer)' },
  { name: 'Federico Chiesa', team: 'Liverpool / Italy', wiki: 'Federico_Chiesa' }
];

function fetchWikiImageUrl(wikiTitle) {
  return new Promise((resolve) => {
    const url = `https://en.wikipedia.org/w/api.php?action=query&titles=${encodeURIComponent(wikiTitle)}&prop=pageimages&format=json&pithumbsize=600`;
    https.get(url, { headers: { 'User-Agent': 'FootballDetectorBot/1.0 (contact@example.com)' } }, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const json = JSON.parse(body);
          const pages = json.query?.pages;
          if (pages) {
            const pageId = Object.keys(pages)[0];
            const thumbnail = pages[pageId]?.thumbnail?.source;
            if (thumbnail) return resolve(thumbnail);
          }
        } catch {}
        resolve(null);
      });
    }).on('error', () => resolve(null));
  });
}

function downloadImage(url, destPath) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'FootballDetectorBot/1.0 (contact@example.com)' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadImage(res.headers.location, destPath).then(resolve);
      }
      if (res.statusCode !== 200) return resolve(false);
      const fileStream = fs.createWriteStream(destPath);
      res.pipe(fileStream);
      fileStream.on('finish', () => {
        fileStream.close();
        resolve(true);
      });
    }).on('error', () => resolve(false));
  });
}

async function main() {
  console.log('🚀 Descargando imágenes de jugadores de fútbol...');
  const characters = [];

  for (let i = 0; i < playersList.length; i++) {
    const p = playersList[i];
    const id = `player_${i + 1}`;
    const filename = `${id}.jpg`;
    const localPath = path.join(UPLOAD_DIR, filename);
    const webPath = `/uploads/${filename}`;

    console.log(`[${i + 1}/${playersList.length}] Buscando a ${p.name}...`);
    let imageUrl = await fetchWikiImageUrl(p.wiki);
    
    if (!imageUrl) {
      imageUrl = `https://images.unsplash.com/photo-1508098682722-e99c43a406b2?w=600&auto=format&fit=crop`; // fallback soccer photo
    }

    const success = await downloadImage(imageUrl, localPath);
    console.log(`  -> ${success ? '✅ Guardado' : '⚠️ Falló descarga, usando fallback'}: ${webPath}`);

    characters.push({
      id,
      name: p.name,
      series: p.team, // We store team name in 'series' field for compatibility
      image: webPath
    });

    // Small delay to be polite to Wiki API
    await new Promise(r => setTimeout(r, 200));
  }

  fs.writeFileSync(CHAR_FILE, JSON.stringify(characters, null, 2), 'utf8');
  console.log(`\n🎉 ¡Proceso completado! ${characters.length} jugadores guardados en characters.json.`);
}

main();
