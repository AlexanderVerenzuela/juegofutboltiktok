import fs from 'node:fs';
import path from 'node:path';
import https from 'node:https';
import http from 'node:http';
import { fileURLToPath } from 'node:url';
import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');
const CHAR_FILE = path.join(__dirname, 'characters.json');

if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// 10 LEYENDAS HISTÓRICAS ANTIGUAS (Cat 4: 96-99)
const cat4_leyendas = [
  { name: "Pelé", series: "Brasil / Leyenda Santos", rating: 99, position: "DC", flag: "🇧🇷", club: "Santos", tier: "LEYENDA (96-99)", eaId: 237067 },
  { name: "Diego Maradona", series: "Argentina / Leyenda Napoli", rating: 98, position: "MCO", flag: "🇦🇷", club: "Napoli", tier: "LEYENDA (96-99)", eaId: 190043 },
  { name: "Ronaldo Nazário (R9)", series: "Brasil / Leyenda Real Madrid", rating: 98, position: "DC", flag: "🇧🇷", club: "Real Madrid", tier: "LEYENDA (96-99)", eaId: 37576 },
  { name: "Johan Cruyff", series: "Países Bajos / Leyenda Barcelona", rating: 97, position: "SD", flag: "🇳🇱", club: "FC Barcelona", tier: "LEYENDA (96-99)", eaId: 242516 },
  { name: "Zinedine Zidane", series: "Francia / Leyenda Real Madrid", rating: 97, position: "MCO", flag: "🇫🇷", club: "Real Madrid", tier: "LEYENDA (96-99)", eaId: 242519 },
  { name: "Ronaldinho", series: "Brasil / Leyenda Barcelona", rating: 97, position: "EI", flag: "🇧🇷", club: "FC Barcelona", tier: "LEYENDA (96-99)", eaId: 28130 },
  { name: "Franz Beckenbauer", series: "Alemania / Leyenda Bayern", rating: 96, position: "DFC", flag: "🇩🇪", club: "Bayern", tier: "LEYENDA (96-99)", eaId: 238437 },
  { name: "Paolo Maldini", series: "Italia / Leyenda Milan", rating: 96, position: "DFC", flag: "🇮🇹", club: "AC Milan", tier: "LEYENDA (96-99)", eaId: 238435 },
  { name: "Ferenc Puskás", series: "Hungría / Leyenda Real Madrid", rating: 96, position: "DC", flag: "🇭🇺", club: "Real Madrid", tier: "LEYENDA (96-99)", eaId: 242517 },
  { name: "Lev Yashin", series: "URSS / La Araña Negra", rating: 96, position: "PO", flag: "🧤", club: "D. Moscú", tier: "LEYENDA (96-99)", eaId: 238439 }
];

// 20 ESTRELLAS MUNDIALES (Cat 3: 90-95)
const cat3_estrellas = [
  { name: "Lionel Messi", series: "Inter Miami / Argentina", rating: 93, position: "DC", flag: "🇦🇷", club: "Inter Miami", tier: "ESTRELLA (90-95)", eaId: 158023 },
  { name: "Cristiano Ronaldo", series: "Al Nassr / Portugal", rating: 91, position: "DC", flag: "🇵🇹", club: "Al Nassr", tier: "ESTRELLA (90-95)", eaId: 20801 },
  { name: "Kylian Mbappé", series: "Real Madrid / France", rating: 92, position: "DC", flag: "🇫🇷", club: "Real Madrid", tier: "ESTRELLA (90-95)", eaId: 231747 },
  { name: "Erling Haaland", series: "Manchester City / Norway", rating: 91, position: "DC", flag: "🇳🇴", club: "Man City", tier: "ESTRELLA (90-95)", eaId: 239085 },
  { name: "Vinícius Júnior", series: "Real Madrid / Brazil", rating: 90, position: "EI", flag: "🇧🇷", club: "Real Madrid", tier: "ESTRELLA (90-95)", eaId: 238794 },
  { name: "Jude Bellingham", series: "Real Madrid / England", rating: 90, position: "MC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Real Madrid", tier: "ESTRELLA (90-95)", eaId: 252371 },
  { name: "Lamine Yamal", series: "FC Barcelona / Spain", rating: 91, position: "ED", flag: "🇪🇸", club: "FC Barcelona", tier: "ESTRELLA (90-95)", eaId: 277255 },
  { name: "Rodri", series: "Manchester City / Spain", rating: 91, position: "MCD", flag: "🇪🇸", club: "Man City", tier: "ESTRELLA (90-95)", eaId: 231866 },
  { name: "Kevin De Bruyne", series: "Manchester City / Belgium", rating: 91, position: "MCO", flag: "🇧🇪", club: "Man City", tier: "ESTRELLA (90-95)", eaId: 192985 },
  { name: "Harry Kane", series: "Bayern Munich / England", rating: 90, position: "DC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Bayern", tier: "ESTRELLA (90-95)", eaId: 202126 },
  { name: "Mohamed Salah", series: "Liverpool / Egypt", rating: 90, position: "ED", flag: "🇪🇬", club: "Liverpool", tier: "ESTRELLA (90-95)", eaId: 209331 },
  { name: "Virgil van Dijk", series: "Liverpool / Netherlands", rating: 90, position: "DFC", flag: "🇳🇱", club: "Liverpool", tier: "ESTRELLA (90-95)", eaId: 203376 },
  { name: "Thibaut Courtois", series: "Real Madrid / Belgium", rating: 90, position: "PO", flag: "🇧🇪", club: "Real Madrid", tier: "ESTRELLA (90-95)", eaId: 192119 },
  { name: "Neymar Jr", series: "Al Hilal / Brazil", rating: 90, position: "EI", flag: "🇧🇷", club: "Al Hilal", tier: "ESTRELLA (90-95)", eaId: 190871 },
  { name: "Alisson Becker", series: "Liverpool / Brazil", rating: 90, position: "PO", flag: "🇧🇷", club: "Liverpool", tier: "ESTRELLA (90-95)", eaId: 212831 },
  { name: "Jan Oblak", series: "Atlético Madrid / Slovenia", rating: 90, position: "PO", flag: "🇸🇮", club: "Atlético Madrid", tier: "ESTRELLA (90-95)", eaId: 200389 },
  { name: "Marc-André ter Stegen", series: "FC Barcelona / Germany", rating: 90, position: "PO", flag: "🇩🇪", club: "FC Barcelona", tier: "ESTRELLA (90-95)", eaId: 192448 },
  { name: "Joshua Kimmich", series: "Bayern Munich / Germany", rating: 90, position: "MC", flag: "🇩🇪", club: "Bayern", tier: "ESTRELLA (90-95)", eaId: 212622 },
  { name: "Antonio Rüdiger", series: "Real Madrid / Germany", rating: 90, position: "DFC", flag: "🇩🇪", club: "Real Madrid", tier: "ESTRELLA (90-95)", eaId: 205452 },
  { name: "Toni Kroos", series: "Real Madrid / Germany", rating: 90, position: "MC", flag: "🇩🇪", club: "Real Madrid", tier: "ESTRELLA (90-95)", eaId: 182521 }
];

// 30 CRACKS (Cat 2: 81-89)
const cat2_cracks = [
  { name: "Martin Ødegaard", series: "Arsenal / Norway", rating: 89, position: "MCO", flag: "🇳🇴", club: "Arsenal", tier: "CRACK (81-89)", eaId: 222665 },
  { name: "Robert Lewandowski", series: "FC Barcelona / Poland", rating: 88, position: "DC", flag: "🇵🇱", club: "FC Barcelona", tier: "CRACK (81-89)", eaId: 188545 },
  { name: "Luka Modrić", series: "Real Madrid / Croatia", rating: 88, position: "MC", flag: "🇭🇷", club: "Real Madrid", tier: "CRACK (81-89)", eaId: 177003 },
  { name: "Phil Foden", series: "Manchester City / England", rating: 88, position: "EI", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Man City", tier: "CRACK (81-89)", eaId: 237692 },
  { name: "Bernardo Silva", series: "Manchester City / Portugal", rating: 88, position: "MC", flag: "🇵🇹", club: "Man City", tier: "CRACK (81-89)", eaId: 218667 },
  { name: "Federico Valverde", series: "Real Madrid / Uruguay", rating: 88, position: "MC", flag: "🇺🇾", club: "Real Madrid", tier: "CRACK (81-89)", eaId: 239053 },
  { name: "Florian Wirtz", series: "Bayer Leverkusen / Germany", rating: 88, position: "MCO", flag: "🇩🇪", club: "Leverkusen", tier: "CRACK (81-89)", eaId: 256630 },
  { name: "Jamal Musiala", series: "Bayern Munich / Germany", rating: 88, position: "MCO", flag: "🇩🇪", club: "Bayern", tier: "CRACK (81-89)", eaId: 256790 },
  { name: "Bukayo Saka", series: "Arsenal / England", rating: 87, position: "ED", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Arsenal", tier: "CRACK (81-89)", eaId: 246669 },
  { name: "Lautaro Martínez", series: "Inter Milan / Argentina", rating: 87, position: "DC", flag: "🇦🇷", club: "Inter Milan", tier: "CRACK (81-89)", eaId: 231478 },
  { name: "Son Heung-min", series: "Tottenham / South Korea", rating: 87, position: "EI", flag: "🇰🇷", club: "Tottenham", tier: "CRACK (81-89)", eaId: 200104 },
  { name: "Bruno Fernandes", series: "Manchester United / Portugal", rating: 87, position: "MCO", flag: "🇵🇹", club: "Man United", tier: "CRACK (81-89)", eaId: 212198 },
  { name: "Antoine Griezmann", series: "Atlético Madrid / France", rating: 87, position: "SD", flag: "🇫🇷", club: "Atlético Madrid", tier: "CRACK (81-89)", eaId: 194765 },
  { name: "Emiliano Martínez", series: "Aston Villa / Argentina", rating: 87, position: "PO", flag: "🇦🇷", club: "Aston Villa", tier: "CRACK (81-89)", eaId: 202652 },
  { name: "Declan Rice", series: "Arsenal / England", rating: 87, position: "MCD", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Arsenal", tier: "CRACK (81-89)", eaId: 234378 },
  { name: "William Saliba", series: "Arsenal / France", rating: 87, position: "DFC", flag: "🇫🇷", club: "Arsenal", tier: "CRACK (81-89)", eaId: 243715 },
  { name: "Theo Hernández", series: "AC Milan / France", rating: 87, position: "LI", flag: "🇫🇷", club: "AC Milan", tier: "CRACK (81-89)", eaId: 232656 },
  { name: "Khvicha Kvaratskhelia", series: "Napoli / Georgia", rating: 87, position: "EI", flag: "🇬🇪", club: "Napoli", tier: "CRACK (81-89)", eaId: 247635 },
  { name: "Pedri", series: "FC Barcelona / Spain", rating: 86, position: "MC", flag: "🇪🇸", club: "FC Barcelona", tier: "CRACK (81-89)", eaId: 251852 },
  { name: "Julián Álvarez", series: "Atlético Madrid / Argentina", rating: 86, position: "DC", flag: "🇦🇷", club: "Atlético Madrid", tier: "CRACK (81-89)", eaId: 246186 },
  { name: "Cole Palmer", series: "Chelsea / England", rating: 86, position: "MCO", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Chelsea", tier: "CRACK (81-89)", eaId: 260109 },
  { name: "Raphinha", series: "FC Barcelona / Brazil", rating: 86, position: "ED", flag: "🇧🇷", club: "FC Barcelona", tier: "CRACK (81-89)", eaId: 233419 },
  { name: "Paulo Dybala", series: "AS Roma / Argentina", rating: 86, position: "SD", flag: "🇦🇷", club: "AS Roma", tier: "CRACK (81-89)", eaId: 211110 },
  { name: "Luis Díaz", series: "Liverpool / Colombia", rating: 86, position: "EI", flag: "🇨🇴", club: "Liverpool", tier: "CRACK (81-89)", eaId: 241084 },
  { name: "Rafael Leão", series: "AC Milan / Portugal", rating: 86, position: "EI", flag: "🇵🇹", club: "AC Milan", tier: "CRACK (81-89)", eaId: 241721 },
  { name: "Gavi", series: "FC Barcelona / Spain", rating: 85, position: "MC", flag: "🇪🇸", club: "FC Barcelona", tier: "CRACK (81-89)", eaId: 264240 },
  { name: "Nico Williams", series: "Athletic Bilbao / Spain", rating: 85, position: "EI", flag: "🇪🇸", club: "Athletic Club", tier: "CRACK (81-89)", eaId: 262334 },
  { name: "Achraf Hakimi", series: "PSG / Morocco", rating: 85, position: "LD", flag: "🇲🇦", club: "PSG", tier: "CRACK (81-89)", eaId: 235212 },
  { name: "Eduardo Camavinga", series: "Real Madrid / France", rating: 85, position: "MC", flag: "🇫🇷", club: "Real Madrid", tier: "CRACK (81-89)", eaId: 254083 },
  { name: "Federico Chiesa", series: "Liverpool / Italy", rating: 84, position: "ED", flag: "🇮🇹", club: "Liverpool", tier: "CRACK (81-89)", eaId: 235805 }
];

// 40 PROMESAS JÓVENES (Cat 1: 70-80)
const cat1_promesas = [
  { name: "Warren Zaïre-Emery", series: "PSG / France", rating: 80, position: "MC", flag: "🇫🇷", club: "PSG", tier: "PROMESA (70-80)", eaId: 268421 },
  { name: "Savinho", series: "Manchester City / Brazil", rating: 80, position: "ED", flag: "🇧🇷", club: "Man City", tier: "PROMESA (70-80)", eaId: 268800 },
  { name: "Benjamin Šeško", series: "RB Leipzig / Slovenia", rating: 80, position: "DC", flag: "🇸🇮", club: "RB Leipzig", tier: "PROMESA (70-80)", eaId: 261271 },
  { name: "Destiny Udogie", series: "Tottenham / Italy", rating: 80, position: "LI", flag: "🇮🇹", club: "Tottenham", tier: "PROMESA (70-80)", eaId: 257121 },
  { name: "Bradley Barcola", series: "PSG / France", rating: 80, position: "EI", flag: "🇫🇷", club: "PSG", tier: "PROMESA (70-80)", eaId: 263620 },
  { name: "Alejandro Garnacho", series: "Manchester United / Argentina", rating: 79, position: "EI", flag: "🇦🇷", club: "Man United", tier: "PROMESA (70-80)", eaId: 268420 },
  { name: "Castello Lukeba", series: "RB Leipzig / France", rating: 79, position: "DFC", flag: "🇫🇷", club: "RB Leipzig", tier: "PROMESA (70-80)", eaId: 263300 },
  { name: "Yan Couto", series: "Borussia Dortmund / Brazil", rating: 79, position: "LD", flag: "🇧🇷", club: "Dortmund", tier: "PROMESA (70-80)", eaId: 256516 },
  { name: "Arda Güler", series: "Real Madrid / Türkiye", rating: 78, position: "MCO", flag: "🇹🇷", club: "Real Madrid", tier: "PROMESA (70-80)", eaId: 271540 },
  { name: "Harvey Elliott", series: "Liverpool / England", rating: 78, position: "MCO", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Liverpool", tier: "PROMESA (70-80)", eaId: 246416 },
  { name: "Lucas Beraldo", series: "PSG / Brazil", rating: 78, position: "DFC", flag: "🇧🇷", club: "PSG", tier: "PROMESA (70-80)", eaId: 271375 },
  { name: "Malo Gusto", series: "Chelsea / France", rating: 78, position: "LD", flag: "🇫🇷", club: "Chelsea", tier: "PROMESA (70-80)", eaId: 260275 },
  { name: "Endrick", series: "Real Madrid / Brazil", rating: 77, position: "DC", flag: "🇧🇷", club: "Real Madrid", tier: "PROMESA (70-80)", eaId: 280036 },
  { name: "Kobbie Mainoo", series: "Manchester United / England", rating: 77, position: "MC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Man United", tier: "PROMESA (70-80)", eaId: 271578 },
  { name: "Mathys Tel", series: "Bayern Munich / France", rating: 77, position: "DC", flag: "🇫🇷", club: "Bayern", tier: "PROMESA (70-80)", eaId: 267833 },
  { name: "Arthur Vermeeren", series: "RB Leipzig / Belgium", rating: 77, position: "MC", flag: "🇧🇪", club: "RB Leipzig", tier: "PROMESA (70-80)", eaId: 270830 },
  { name: "Adam Wharton", series: "Crystal Palace / England", rating: 77, position: "MCD", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Crystal Palace", tier: "PROMESA (70-80)", eaId: 269850 },
  { name: "Antonio Nusa", series: "RB Leipzig / Norway", rating: 77, position: "EI", flag: "🇳🇴", club: "RB Leipzig", tier: "PROMESA (70-80)", eaId: 264440 },
  { name: "Bilal El Khannouss", series: "Leicester City / Morocco", rating: 77, position: "MCO", flag: "🇲🇦", club: "Leicester", tier: "PROMESA (70-80)", eaId: 268297 },
  { name: "Fermín López", series: "FC Barcelona / Spain", rating: 76, position: "MC", flag: "🇪🇸", club: "FC Barcelona", tier: "PROMESA (70-80)", eaId: 276709 },
  { name: "Rico Lewis", series: "Manchester City / England", rating: 76, position: "LD", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Man City", tier: "PROMESA (70-80)", eaId: 269229 },
  { name: "Jamie Bynoe-Gittens", series: "Borussia Dortmund / England", rating: 76, position: "EI", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Dortmund", tier: "PROMESA (70-80)", eaId: 266853 },
  { name: "Kenan Yıldız", series: "Juventus / Türkiye", rating: 76, position: "SD", flag: "🇹🇷", club: "Juventus", tier: "PROMESA (70-80)", eaId: 273060 },
  { name: "Jorrel Hato", series: "Ajax / Netherlands", rating: 76, position: "DFC", flag: "🇳🇱", club: "Ajax", tier: "PROMESA (70-80)", eaId: 274350 },
  { name: "Carlos Baleba", series: "Brighton / Cameroon", rating: 76, position: "MCD", flag: "🇨🇲", club: "Brighton", tier: "PROMESA (70-80)", eaId: 271290 },
  { name: "Evan Ferguson", series: "Brighton / Ireland", rating: 76, position: "DC", flag: "🇮🇪", club: "Brighton", tier: "PROMESA (70-80)", eaId: 265218 },
  { name: "Yaser Asprilla", series: "Girona / Colombia", rating: 76, position: "MCO", flag: "🇨🇴", club: "Girona", tier: "PROMESA (70-80)", eaId: 263590 },
  { name: "Conor Bradley", series: "Liverpool / Northern Ireland", rating: 76, position: "LD", flag: "🇬🇧", club: "Liverpool", tier: "PROMESA (70-80)", eaId: 263657 },
  { name: "Pau Cubarsí", series: "FC Barcelona / Spain", rating: 75, position: "DFC", flag: "🇪🇸", club: "FC Barcelona", tier: "PROMESA (70-80)", eaId: 279062 },
  { name: "Oscar Bobb", series: "Manchester City / Norway", rating: 75, position: "ED", flag: "🇳🇴", club: "Man City", tier: "PROMESA (70-80)", eaId: 268285 },
  { name: "Lamine Camara", series: "Monaco / Senegal", rating: 75, position: "MC", flag: "🇸🇳", club: "Monaco", tier: "PROMESA (70-80)", eaId: 270180 },
  { name: "Archie Gray", series: "Tottenham / England", rating: 75, position: "MC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Tottenham", tier: "PROMESA (70-80)", eaId: 271615 },
  { name: "Roony Bardghji", series: "FC Copenhagen / Sweden", rating: 75, position: "ED", flag: "🇸🇪", club: "Copenhagen", tier: "PROMESA (70-80)", eaId: 266453 },
  { name: "Assane Diao", series: "Real Betis / Spain", rating: 75, position: "EI", flag: "🇪🇸", club: "Real Betis", tier: "PROMESA (70-80)", eaId: 276680 },
  { name: "Lewis Miley", series: "Newcastle United / England", rating: 75, position: "MC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Newcastle", tier: "PROMESA (70-80)", eaId: 274290 },
  { name: "Semih Kılıçsoy", series: "Beşiktaş / Türkiye", rating: 75, position: "DC", flag: "🇹🇷", club: "Beşiktaş", tier: "PROMESA (70-80)", eaId: 274530 },
  { name: "Claudio Echeverri", series: "River Plate / Argentina", rating: 75, position: "MCO", flag: "🇦🇷", club: "River Plate", tier: "PROMESA (70-80)", eaId: 278910 },
  { name: "Jobe Bellingham", series: "Sunderland / England", rating: 74, position: "MC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Sunderland", tier: "PROMESA (70-80)", eaId: 265268 },
  { name: "Estêvão Willian", series: "Palmeiras / Brazil", rating: 74, position: "ED", flag: "🇧🇷", club: "Palmeiras", tier: "PROMESA (70-80)", eaId: 281200 },
  { name: "Franco Mastantuono", series: "River Plate / Argentina", rating: 74, position: "MCO", flag: "🇦🇷", club: "River Plate", tier: "PROMESA (70-80)", eaId: 280510 }
];

console.log(`Cat 4 (Leyendas): ${cat4_leyendas.length}`);
console.log(`Cat 3 (Estrellas): ${cat3_estrellas.length}`);
console.log(`Cat 2 (Cracks): ${cat2_cracks.length}`);
console.log(`Cat 1 (Promesas): ${cat1_promesas.length}`);
console.log(`TOTAL EXACTO: ${cat4_leyendas.length + cat3_estrellas.length + cat2_cracks.length + cat1_promesas.length}`);

// Combine all 100 players
const raw100 = [
  ...cat4_leyendas,
  ...cat3_estrellas,
  ...cat2_cracks,
  ...cat1_promesas
];

// Helper to download image
function downloadFile(url, dest) {
  return new Promise((resolve) => {
    try {
      https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)' } }, (res) => {
        if (res.statusCode === 301 || res.statusCode === 302) {
          const loc = res.headers.location;
          if (!loc) return resolve(false);
          return downloadFile(loc, dest).then(resolve);
        }
        if (res.statusCode !== 200) return resolve(false);
        const stream = fs.createWriteStream(dest);
        res.pipe(stream);
        stream.on('finish', () => { stream.close(); resolve(true); });
        stream.on('error', () => resolve(false));
      }).on('error', () => resolve(false));
    } catch {
      resolve(false);
    }
  });
}

async function main() {
  console.log('--- INICIANDO PROCESO DE 100 JUGADORES ---');
  
  // Sort by rating DESC
  raw100.sort((a, b) => (b.rating || 0) - (a.rating || 0) || a.name.localeCompare(b.name));

  const finalPlayers = [];

  for (let i = 0; i < raw100.length; i++) {
    const p = raw100[i];
    const id = `player_${i + 1}`;
    const filename = `${id}.png`;
    const dest = path.join(UPLOAD_DIR, filename);
    const webPath = `/uploads/${filename}`;

    let fileExists = false;
    if (fs.existsSync(dest) && fs.statSync(dest).size > 2000) {
      fileExists = true;
    }

    if (!fileExists) {
      console.log(`[${i + 1}/100] Descargando imagen para ${p.name} (EA ID: ${p.eaId})...`);
      
      const urls = [
        `https://cdn.futwiz.com/assets/img/fc25/faces/${p.eaId}.png`,
        `https://cdn.futwiz.com/assets/img/fc26/faces/${p.eaId}.png`,
        `https://cdn.futwiz.com/assets/img/fc24/faces/${p.eaId}.png`,
        `https://cdn.futwiz.com/assets/img/fifa23/faces/${p.eaId}.png`
      ];

      let downloaded = false;
      for (const u of urls) {
        downloaded = await downloadFile(u, dest);
        if (downloaded && fs.existsSync(dest) && fs.statSync(dest).size > 1000) {
          break;
        } else {
          downloaded = false;
        }
      }

      // Fallback: If Futwiz didn't have it, copy from existing avatar or fallback player
      if (!downloaded || !fs.existsSync(dest) || fs.statSync(dest).size < 1000) {
        console.log(`  -> Fallback cutout para ${p.name}`);
        const fallbackSource = path.join(UPLOAD_DIR, 'player_3.png');
        if (fs.existsSync(fallbackSource)) {
          fs.copyFileSync(fallbackSource, dest);
        }
      }
    }

    finalPlayers.push({
      id,
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

  // Guardar en characters.json local
  fs.writeFileSync(CHAR_FILE, JSON.stringify(finalPlayers, null, 2), 'utf8');
  console.log(`✅ Archivo characters.json actualizado con ${finalPlayers.length} jugadores.`);

  // Actualizar en Supabase si está disponible
  if (process.env.DATABASE_URL) {
    try {
      console.log('📡 Sincronizando los 100 jugadores con Supabase...');
      const pool = new pg.Pool({
        connectionString: process.env.DATABASE_URL,
        ssl: { rejectUnauthorized: false }
      });
      const client = await pool.connect();

      // Limpiar y resubir los 100 jugadores ordenados
      await client.query(`DELETE FROM tiktok_futbol_characters;`);

      for (const c of finalPlayers) {
        const charData = { ...c };
        delete charData.id;
        delete charData.name;
        delete charData.rating;
        delete charData.image;

        await client.query(
          `INSERT INTO tiktok_futbol_characters (id, name, rating, image, data, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW())`,
          [c.id, c.name, c.rating, c.image, JSON.stringify(charData)]
        );
      }

      client.release();
      await pool.end();
      console.log('✅ ¡Los 100 jugadores han sido sincronizados exitosamente en Supabase!');
    } catch (e) {
      console.error('⚠️ Error sincronizando en Supabase:', e.message);
    }
  }

  console.log('🎉 ¡PROCESO DE 100 JUGADORES COMPLETADO CON ÉXITO!');
}

main();
