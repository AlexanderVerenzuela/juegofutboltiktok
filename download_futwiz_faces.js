import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
const CHAR_FILE = path.join(__dirname, 'characters.json');

const playersData = [
  { id: "player_1", name: "Lionel Messi", series: "Inter Miami / Argentina", eaId: 158023, rating: 93, position: "DC", flag: "🇦🇷", club: "Inter Miami", tier: "LEYENDA" },
  { id: "player_2", name: "Cristiano Ronaldo", series: "Al Nassr / Portugal", eaId: 20801, rating: 91, position: "DC", flag: "🇵🇹", club: "Al Nassr", tier: "LEYENDA" },
  { id: "player_3", name: "Kylian Mbappé", series: "Real Madrid / France", eaId: 231747, rating: 92, position: "DC", flag: "🇫🇷", club: "Real Madrid", tier: "ÉLITE" },
  { id: "player_4", name: "Erling Haaland", series: "Manchester City / Norway", eaId: 239085, rating: 91, position: "DC", flag: "🇳🇴", club: "Man City", tier: "ÉLITE" },
  { id: "player_5", name: "Vinícius Júnior", series: "Real Madrid / Brazil", eaId: 238794, rating: 89, position: "EI", flag: "🇧🇷", club: "Real Madrid", tier: "ÉLITE" },
  { id: "player_6", name: "Jude Bellingham", series: "Real Madrid / England", eaId: 252371, rating: 90, position: "MC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Real Madrid", tier: "ÉLITE" },
  { id: "player_7", name: "Lamine Yamal", series: "FC Barcelona / Spain", eaId: 277255, rating: 91, position: "ED", flag: "🇪🇸", club: "FC Barcelona", tier: "ÉLITE" },
  { id: "player_8", name: "Robert Lewandowski", series: "FC Barcelona / Poland", eaId: 188545, rating: 88, position: "DC", flag: "🇵🇱", club: "FC Barcelona", tier: "ORO" },
  { id: "player_9", name: "Kevin De Bruyne", series: "Manchester City / Belgium", eaId: 192985, rating: 91, position: "MCO", flag: "🇧🇪", club: "Man City", tier: "ÉLITE" },
  { id: "player_10", name: "Neymar Jr", series: "Al Hilal / Brazil", eaId: 190871, rating: 90, position: "EI", flag: "🇧🇷", club: "Al Hilal", tier: "LEYENDA" },
  { id: "player_11", name: "Mohamed Salah", series: "Liverpool / Egypt", eaId: 209331, rating: 89, position: "ED", flag: "🇪🇬", club: "Liverpool", tier: "ÉLITE" },
  { id: "player_12", name: "Harry Kane", series: "Bayern Munich / England", eaId: 202126, rating: 90, position: "DC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Bayern", tier: "ÉLITE" },
  { id: "player_13", name: "Luka Modrić", series: "Real Madrid / Croatia", eaId: 177003, rating: 88, position: "MC", flag: "🇭🇷", club: "Real Madrid", tier: "LEYENDA" },
  { id: "player_14", name: "Bukayo Saka", series: "Arsenal / England", eaId: 246669, rating: 87, position: "ED", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Arsenal", tier: "ORO" },
  { id: "player_15", name: "Phil Foden", series: "Manchester City / England", eaId: 237692, rating: 88, position: "EI", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Man City", tier: "ORO" },
  { id: "player_16", name: "Pedri", series: "FC Barcelona / Spain", eaId: 251852, rating: 86, position: "MC", flag: "🇪🇸", club: "FC Barcelona", tier: "ORO" },
  { id: "player_17", name: "Gavi", series: "FC Barcelona / Spain", eaId: 264240, rating: 85, position: "MC", flag: "🇪🇸", club: "FC Barcelona", tier: "ORO" },
  { id: "player_18", name: "Lautaro Martínez", series: "Inter Milan / Argentina", eaId: 231478, rating: 87, position: "DC", flag: "🇦🇷", club: "Inter Milan", tier: "ORO" },
  { id: "player_19", name: "Julián Álvarez", series: "Atlético Madrid / Argentina", eaId: 246186, rating: 86, position: "DC", flag: "🇦🇷", club: "Atlético Madrid", tier: "ORO" },
  { id: "player_20", name: "Rodri", series: "Manchester City / Spain", eaId: 231866, rating: 91, position: "MCD", flag: "🇪🇸", club: "Man City", tier: "ÉLITE" },
  { id: "player_21", name: "Federico Valverde", series: "Real Madrid / Uruguay", eaId: 239053, rating: 88, position: "MC", flag: "🇺🇾", club: "Real Madrid", tier: "ORO" },
  { id: "player_22", name: "Son Heung-min", series: "Tottenham / South Korea", eaId: 200104, rating: 87, position: "EI", flag: "🇰🇷", club: "Tottenham", tier: "ORO" },
  { id: "player_23", name: "Florian Wirtz", series: "Bayer Leverkusen / Germany", eaId: 256630, rating: 88, position: "MCO", flag: "🇩🇪", club: "Leverkusen", tier: "ORO" },
  { id: "player_24", name: "Jamal Musiala", series: "Bayern Munich / Germany", eaId: 256790, rating: 88, position: "MCO", flag: "🇩🇪", club: "Bayern", tier: "ORO" },
  { id: "player_25", name: "Cole Palmer", series: "Chelsea / England", eaId: 260109, rating: 86, position: "MCO", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Chelsea", tier: "ORO" },
  { id: "player_26", name: "Emiliano Martínez", series: "Aston Villa / Argentina", eaId: 202652, rating: 87, position: "PO", flag: "🇦🇷", club: "Aston Villa", tier: "ORO" },
  { id: "player_27", name: "Virgil van Dijk", series: "Liverpool / Netherlands", eaId: 203376, rating: 89, position: "DFC", flag: "🇳🇱", club: "Liverpool", tier: "ÉLITE" },
  { id: "player_28", name: "Raphinha", series: "FC Barcelona / Brazil", eaId: 233419, rating: 86, position: "ED", flag: "🇧🇷", club: "FC Barcelona", tier: "ORO" },
  { id: "player_29", name: "Antoine Griezmann", series: "Atlético Madrid / France", eaId: 194765, rating: 87, position: "SD", flag: "🇫🇷", club: "Atlético Madrid", tier: "ORO" },
  { id: "player_30", name: "Nico Williams", series: "Athletic Bilbao / Spain", eaId: 262334, rating: 85, position: "EI", flag: "🇪🇸", club: "Athletic", tier: "ORO" },
  { id: "player_31", name: "Thibaut Courtois", series: "Real Madrid / Belgium", eaId: 192119, rating: 89, position: "PO", flag: "🇧🇪", club: "Real Madrid", tier: "ÉLITE" },
  { id: "player_32", name: "Bruno Fernandes", series: "Manchester United / Portugal", eaId: 212198, rating: 87, position: "MCO", flag: "🇵🇹", club: "Man United", tier: "ORO" },
  { id: "player_33", name: "Bernardo Silva", series: "Manchester City / Portugal", eaId: 218667, rating: 88, position: "MC", flag: "🇵🇹", club: "Man City", tier: "ORO" },
  { id: "player_34", name: "Paulo Dybala", series: "AS Roma / Argentina", eaId: 211110, rating: 86, position: "SD", flag: "🇦🇷", club: "AS Roma", tier: "ORO" },
  { id: "player_35", name: "Luis Díaz", series: "Liverpool / Colombia", eaId: 241084, rating: 86, position: "EI", flag: "🇨🇴", club: "Liverpool", tier: "ORO" },
  { id: "player_36", name: "Federico Chiesa", series: "Liverpool / Italy", eaId: 235805, rating: 84, position: "ED", flag: "🇮🇹", club: "Liverpool", tier: "ORO" }
];

function downloadFile(url, dest) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return downloadFile(res.headers.location, dest).then(resolve);
      }
      if (res.statusCode !== 200) return resolve(false);
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => { stream.close(); resolve(true); });
    }).on('error', () => resolve(false));
  });
}

async function run() {
  const characters = [];

  for (const p of playersData) {
    const filename = `${p.id}.png`;
    const dest = path.join(UPLOAD_DIR, filename);
    const webPath = `/uploads/${filename}`;

    const fc26Url = `https://cdn.futwiz.com/assets/img/fc26/faces/${p.eaId}.png`;
    const fc25Url = `https://cdn.futwiz.com/assets/img/fc25/faces/${p.eaId}.png`;

    console.log(`Descargando ${p.name} (EA ID: ${p.eaId}) desde Futwiz...`);
    
    let ok = await downloadFile(fc26Url, dest);
    let version = 'FC 26';
    
    if (!ok) {
      ok = await downloadFile(fc25Url, dest);
      version = 'FC 25 (Fallback)';
    }

    console.log(`  -> ${ok ? 'ÉXITO (' + version + ')' : 'FALLIDO'}`);

    characters.push({
      id: p.id,
      name: p.name,
      series: p.series,
      image: webPath,
      rating: p.rating,
      position: p.position,
      flag: p.flag,
      club: p.club,
      tier: p.tier,
      eaId: p.eaId
    });
  }

  fs.writeFileSync(CHAR_FILE, JSON.stringify(characters, null, 2), 'utf8');
  console.log('¡TODOS LOS JUGADORES ACTUALIZADOS CON IMÁGENES FUTWIZ!');
}

run();
