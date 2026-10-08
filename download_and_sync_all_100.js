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

// 100 PLAYERS ORDERED BY TIER & RATING
const rawPlayers = [
  // CAT 4: 10 LEYENDAS (96-99)
  { name: "Pelé", series: "Brasil / Leyenda Santos", rating: 99, position: "DC", flag: "🇧🇷", club: "Santos", tier: "LEYENDA (96-99)", category: "cat4", url: "https://cdn.futwiz.com/assets/img/fc25/faces/237067.png" },
  { name: "Diego Maradona", series: "Argentina / Leyenda Napoli", rating: 98, position: "MCO", flag: "🇦🇷", club: "Napoli", tier: "LEYENDA (96-99)", category: "cat4", url: "https://cdn.futwiz.com/assets/img/fifa21/faces/190042.png" },
  { name: "Ronaldo Nazário (R9)", series: "Brasil / Leyenda Real Madrid", rating: 98, position: "DC", flag: "🇧🇷", club: "Real Madrid", tier: "LEYENDA (96-99)", category: "cat4", url: "https://cdn.futwiz.com/assets/img/fc25/faces/37576.png" },
  { name: "Johan Cruyff", series: "Países Bajos / Leyenda Barcelona", rating: 97, position: "SD", flag: "🇳🇱", club: "FC Barcelona", tier: "LEYENDA (96-99)", category: "cat4", url: "https://cdn.futwiz.com/assets/img/fifa23/faces/190045.png" },
  { name: "Zinedine Zidane", series: "Francia / Leyenda Real Madrid", rating: 97, position: "MCO", flag: "🇫🇷", club: "Real Madrid", tier: "LEYENDA (96-99)", category: "cat4", url: "https://cdn.futwiz.com/assets/img/fifa23/faces/1397.png" },
  { name: "Ronaldinho", series: "Brasil / Leyenda Barcelona", rating: 97, position: "EI", flag: "🇧🇷", club: "FC Barcelona", tier: "LEYENDA (96-99)", category: "cat4", url: "https://cdn.futwiz.com/assets/img/fifa23/faces/28130.png" },
  { name: "Gerd Müller", series: "Alemania / Leyenda Bayern", rating: 96, position: "DC", flag: "🇩🇪", club: "Bayern", tier: "LEYENDA (96-99)", category: "cat4", url: "https://cdn.futwiz.com/assets/img/fc24/faces/190048.png" },
  { name: "Paolo Maldini", series: "Italia / Leyenda Milan", rating: 96, position: "DFC", flag: "🇮🇹", club: "AC Milan", tier: "LEYENDA (96-99)", category: "cat4", url: "https://cdn.futwiz.com/assets/img/fifa23/faces/238439.png" },
  { name: "Ferenc Puskás", series: "Hungría / Leyenda Real Madrid", rating: 96, position: "DC", flag: "🇭🇺", club: "Real Madrid", tier: "LEYENDA (96-99)", category: "cat4", url: "https://cdn.futwiz.com/assets/img/fc24/faces/254642.png" },
  { name: "Lev Yashin", series: "URSS / La Araña Negra", rating: 96, position: "PO", flag: "🧤", club: "D. Moscú", tier: "LEYENDA (96-99)", category: "cat4", url: "https://cdn.futwiz.com/assets/img/fifa23/faces/238380.png" },

  // CAT 3: 20 ESTRELLAS (90-95)
  { name: "Lionel Messi", series: "Inter Miami / Argentina", rating: 93, position: "DC", flag: "🇦🇷", club: "Inter Miami", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 158023, url: "https://cdn.futwiz.com/assets/img/fc25/faces/158023.png" },
  { name: "Kylian Mbappé", series: "Real Madrid / France", rating: 92, position: "DC", flag: "🇫🇷", club: "Real Madrid", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 231747, url: "https://cdn.futwiz.com/assets/img/fc25/faces/231747.png" },
  { name: "Cristiano Ronaldo", series: "Al Nassr / Portugal", rating: 91, position: "DC", flag: "🇵🇹", club: "Al Nassr", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 20801, url: "https://cdn.futwiz.com/assets/img/fc25/faces/20801.png" },
  { name: "Erling Haaland", series: "Manchester City / Norway", rating: 91, position: "DC", flag: "🇳🇴", club: "Man City", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 239085, url: "https://cdn.futwiz.com/assets/img/fc25/faces/239085.png" },
  { name: "Kevin De Bruyne", series: "Manchester City / Belgium", rating: 91, position: "MCO", flag: "🇧🇪", club: "Man City", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 192985, url: "https://cdn.futwiz.com/assets/img/fc25/faces/192985.png" },
  { name: "Lamine Yamal", series: "FC Barcelona / Spain", rating: 91, position: "ED", flag: "🇪🇸", club: "FC Barcelona", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 277255, url: "https://cdn.futwiz.com/assets/img/fc25/faces/277255.png" },
  { name: "Rodri", series: "Manchester City / Spain", rating: 91, position: "MCD", flag: "🇪🇸", club: "Man City", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 231866, url: "https://cdn.futwiz.com/assets/img/fc25/faces/231866.png" },
  { name: "Vinícius Júnior", series: "Real Madrid / Brazil", rating: 90, position: "EI", flag: "🇧🇷", club: "Real Madrid", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 238794, url: "https://cdn.futwiz.com/assets/img/fc25/faces/238794.png" },
  { name: "Jude Bellingham", series: "Real Madrid / England", rating: 90, position: "MC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Real Madrid", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 252371, url: "https://cdn.futwiz.com/assets/img/fc25/faces/252371.png" },
  { name: "Harry Kane", series: "Bayern Munich / England", rating: 90, position: "DC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Bayern", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 202126, url: "https://cdn.futwiz.com/assets/img/fc25/faces/202126.png" },
  { name: "Mohamed Salah", series: "Liverpool / Egypt", rating: 90, position: "ED", flag: "🇪🇬", club: "Liverpool", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 209331, url: "https://cdn.futwiz.com/assets/img/fc25/faces/209331.png" },
  { name: "Virgil van Dijk", series: "Liverpool / Netherlands", rating: 90, position: "DFC", flag: "🇳🇱", club: "Liverpool", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 203376, url: "https://cdn.futwiz.com/assets/img/fc25/faces/203376.png" },
  { name: "Thibaut Courtois", series: "Real Madrid / Belgium", rating: 90, position: "PO", flag: "🇧🇪", club: "Real Madrid", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 192119, url: "https://cdn.futwiz.com/assets/img/fc25/faces/192119.png" },
  { name: "Neymar Jr", series: "Al Hilal / Brazil", rating: 90, position: "EI", flag: "🇧🇷", club: "Al Hilal", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 190871, url: "https://cdn.futwiz.com/assets/img/fc25/faces/190871.png" },
  { name: "Alisson Becker", series: "Liverpool / Brazil", rating: 90, position: "PO", flag: "🇧🇷", club: "Liverpool", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 212831, url: "https://cdn.futwiz.com/assets/img/fc25/faces/212831.png" },
  { name: "Jan Oblak", series: "Atlético Madrid / Slovenia", rating: 90, position: "PO", flag: "🇸🇮", club: "Atlético Madrid", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 200389, url: "https://cdn.futwiz.com/assets/img/fc25/faces/200389.png" },
  { name: "Marc-André ter Stegen", series: "FC Barcelona / Germany", rating: 90, position: "PO", flag: "🇩🇪", club: "FC Barcelona", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 192448, url: "https://cdn.futwiz.com/assets/img/fc25/faces/192448.png" },
  { name: "Joshua Kimmich", series: "Bayern Munich / Germany", rating: 90, position: "MC", flag: "🇩🇪", club: "Bayern", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 212622, url: "https://cdn.futwiz.com/assets/img/fc25/faces/212622.png" },
  { name: "Antonio Rüdiger", series: "Real Madrid / Germany", rating: 90, position: "DFC", flag: "🇩🇪", club: "Real Madrid", tier: "ESTRELLA (90-95)", category: "cat3", eaId: 205452, url: "https://cdn.futwiz.com/assets/img/fc25/faces/205452.png" },
  { name: "Toni Kroos", series: "Real Madrid / Germany", rating: 90, position: "MC", flag: "🇩🇪", club: "Real Madrid", tier: "ESTRELLA (90-95)", category: "cat3", url: "https://cdn.futwiz.com/assets/img/fc24/faces/182521.png" },

  // CAT 2: 30 CRACKS (81-89)
  { name: "Martin Ødegaard", series: "Arsenal / Norway", rating: 89, position: "MCO", flag: "🇳🇴", club: "Arsenal", tier: "CRACK (81-89)", category: "cat2", eaId: 222665, url: "https://cdn.futwiz.com/assets/img/fc25/faces/222665.png" },
  { name: "Robert Lewandowski", series: "FC Barcelona / Poland", rating: 88, position: "DC", flag: "🇵🇱", club: "FC Barcelona", tier: "CRACK (81-89)", category: "cat2", eaId: 188545, url: "https://cdn.futwiz.com/assets/img/fc25/faces/188545.png" },
  { name: "Luka Modrić", series: "Real Madrid / Croatia", rating: 88, position: "MC", flag: "🇭🇷", club: "Real Madrid", tier: "CRACK (81-89)", category: "cat2", eaId: 177003, url: "https://cdn.futwiz.com/assets/img/fc25/faces/177003.png" },
  { name: "Phil Foden", series: "Manchester City / England", rating: 88, position: "EI", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Man City", tier: "CRACK (81-89)", category: "cat2", eaId: 237692, url: "https://cdn.futwiz.com/assets/img/fc25/faces/237692.png" },
  { name: "Bernardo Silva", series: "Manchester City / Portugal", rating: 88, position: "MC", flag: "🇵🇹", club: "Man City", tier: "CRACK (81-89)", category: "cat2", eaId: 218667, url: "https://cdn.futwiz.com/assets/img/fc25/faces/218667.png" },
  { name: "Federico Valverde", series: "Real Madrid / Uruguay", rating: 88, position: "MC", flag: "🇺🇾", club: "Real Madrid", tier: "CRACK (81-89)", category: "cat2", eaId: 239053, url: "https://cdn.futwiz.com/assets/img/fc25/faces/239053.png" },
  { name: "Florian Wirtz", series: "Bayer Leverkusen / Germany", rating: 88, position: "MCO", flag: "🇩🇪", club: "Leverkusen", tier: "CRACK (81-89)", category: "cat2", eaId: 256630, url: "https://cdn.futwiz.com/assets/img/fc25/faces/256630.png" },
  { name: "Jamal Musiala", series: "Bayern Munich / Germany", rating: 88, position: "MCO", flag: "🇩🇪", club: "Bayern", tier: "CRACK (81-89)", category: "cat2", eaId: 256790, url: "https://cdn.futwiz.com/assets/img/fc25/faces/256790.png" },
  { name: "Bukayo Saka", series: "Arsenal / England", rating: 87, position: "ED", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Arsenal", tier: "CRACK (81-89)", category: "cat2", eaId: 246669, url: "https://cdn.futwiz.com/assets/img/fc25/faces/246669.png" },
  { name: "Lautaro Martínez", series: "Inter Milan / Argentina", rating: 87, position: "DC", flag: "🇦🇷", club: "Inter Milan", tier: "CRACK (81-89)", category: "cat2", eaId: 231478, url: "https://cdn.futwiz.com/assets/img/fc25/faces/231478.png" },
  { name: "Son Heung-min", series: "Tottenham / South Korea", rating: 87, position: "EI", flag: "🇰🇷", club: "Tottenham", tier: "CRACK (81-89)", category: "cat2", eaId: 200104, url: "https://cdn.futwiz.com/assets/img/fc25/faces/200104.png" },
  { name: "Bruno Fernandes", series: "Manchester United / Portugal", rating: 87, position: "MCO", flag: "🇵🇹", club: "Man United", tier: "CRACK (81-89)", category: "cat2", eaId: 212198, url: "https://cdn.futwiz.com/assets/img/fc25/faces/212198.png" },
  { name: "Antoine Griezmann", series: "Atlético Madrid / France", rating: 87, position: "SD", flag: "🇫🇷", club: "Atlético Madrid", tier: "CRACK (81-89)", category: "cat2", eaId: 194765, url: "https://cdn.futwiz.com/assets/img/fc25/faces/194765.png" },
  { name: "Emiliano Martínez", series: "Aston Villa / Argentina", rating: 87, position: "PO", flag: "🇦🇷", club: "Aston Villa", tier: "CRACK (81-89)", category: "cat2", eaId: 202652, url: "https://cdn.futwiz.com/assets/img/fc25/faces/202652.png" },
  { name: "Declan Rice", series: "Arsenal / England", rating: 87, position: "MCD", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Arsenal", tier: "CRACK (81-89)", category: "cat2", eaId: 234378, url: "https://cdn.futwiz.com/assets/img/fc25/faces/234378.png" },
  { name: "William Saliba", series: "Arsenal / France", rating: 87, position: "DFC", flag: "🇫🇷", club: "Arsenal", tier: "CRACK (81-89)", category: "cat2", eaId: 243715, url: "https://cdn.futwiz.com/assets/img/fc25/faces/243715.png" },
  { name: "Theo Hernández", series: "AC Milan / France", rating: 87, position: "LI", flag: "🇫🇷", club: "AC Milan", tier: "CRACK (81-89)", category: "cat2", eaId: 232656, url: "https://cdn.futwiz.com/assets/img/fc25/faces/232656.png" },
  { name: "Khvicha Kvaratskhelia", series: "Napoli / Georgia", rating: 87, position: "EI", flag: "🇬🇪", club: "Napoli", tier: "CRACK (81-89)", category: "cat2", eaId: 247635, url: "https://cdn.futwiz.com/assets/img/fc25/faces/247635.png" },
  { name: "Pedri", series: "FC Barcelona / Spain", rating: 86, position: "MC", flag: "🇪🇸", club: "FC Barcelona", tier: "CRACK (81-89)", category: "cat2", eaId: 251854, url: "https://cdn.futwiz.com/assets/img/fc25/faces/251854.png" },
  { name: "Julián Álvarez", series: "Atlético Madrid / Argentina", rating: 86, position: "DC", flag: "🇦🇷", club: "Atlético Madrid", tier: "CRACK (81-89)", category: "cat2", eaId: 246186, url: "https://cdn.futwiz.com/assets/img/fc25/faces/246186.png" },
  { name: "Cole Palmer", series: "Chelsea / England", rating: 86, position: "MCO", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Chelsea", tier: "CRACK (81-89)", category: "cat2", eaId: 257534, url: "https://cdn.futwiz.com/assets/img/fc25/faces/257534.png" },
  { name: "Raphinha", series: "FC Barcelona / Brazil", rating: 86, position: "ED", flag: "🇧🇷", club: "FC Barcelona", tier: "CRACK (81-89)", category: "cat2", eaId: 233419, url: "https://cdn.futwiz.com/assets/img/fc25/faces/233419.png" },
  { name: "Paulo Dybala", series: "AS Roma / Argentina", rating: 86, position: "SD", flag: "🇦🇷", club: "AS Roma", tier: "CRACK (81-89)", category: "cat2", eaId: 211110, url: "https://cdn.futwiz.com/assets/img/fc25/faces/211110.png" },
  { name: "Luis Díaz", series: "Liverpool / Colombia", rating: 86, position: "EI", flag: "🇨🇴", club: "Liverpool", tier: "CRACK (81-89)", category: "cat2", eaId: 241084, url: "https://cdn.futwiz.com/assets/img/fc25/faces/241084.png" },
  { name: "Rafael Leão", series: "AC Milan / Portugal", rating: 86, position: "EI", flag: "🇵🇹", club: "AC Milan", tier: "CRACK (81-89)", category: "cat2", eaId: 241721, url: "https://cdn.futwiz.com/assets/img/fc25/faces/241721.png" },
  { name: "Gavi", series: "FC Barcelona / Spain", rating: 85, position: "MC", flag: "🇪🇸", club: "FC Barcelona", tier: "CRACK (81-89)", category: "cat2", eaId: 264240, url: "https://cdn.futwiz.com/assets/img/fc25/faces/264240.png" },
  { name: "Nico Williams", series: "Athletic Bilbao / Spain", rating: 85, position: "EI", flag: "🇪🇸", club: "Athletic Club", tier: "CRACK (81-89)", category: "cat2", eaId: 256516, url: "https://cdn.futwiz.com/assets/img/fc25/faces/256516.png" },
  { name: "Achraf Hakimi", series: "PSG / Morocco", rating: 85, position: "LD", flag: "🇲🇦", club: "PSG", tier: "CRACK (81-89)", category: "cat2", eaId: 235212, url: "https://cdn.futwiz.com/assets/img/fc25/faces/235212.png" },
  { name: "Eduardo Camavinga", series: "Real Madrid / France", rating: 85, position: "MC", flag: "🇫🇷", club: "Real Madrid", tier: "CRACK (81-89)", category: "cat2", eaId: 254083, url: "https://cdn.futwiz.com/assets/img/fc25/faces/254083.png" },
  { name: "Federico Chiesa", series: "Liverpool / Italy", rating: 84, position: "ED", flag: "🇮🇹", club: "Liverpool", tier: "CRACK (81-89)", category: "cat2", eaId: 235805, url: "https://cdn.futwiz.com/assets/img/fc25/faces/235805.png" },

  // CAT 1: 40 PROMESAS (70-80)
  { name: "Warren Zaïre-Emery", series: "PSG / France", rating: 80, position: "MC", flag: "🇫🇷", club: "PSG", tier: "PROMESA (70-80)", category: "cat1", eaId: 270673, url: "https://cdn.futwiz.com/assets/img/fc25/faces/270673.png" },
  { name: "Savinho", series: "Manchester City / Brazil", rating: 80, position: "ED", flag: "🇧🇷", club: "Man City", tier: "PROMESA (70-80)", category: "cat1", eaId: 270409, url: "https://cdn.futwiz.com/assets/img/fc25/faces/270409.png" },
  { name: "Benjamin Šeško", series: "RB Leipzig / Slovenia", rating: 80, position: "DC", flag: "🇸🇮", club: "RB Leipzig", tier: "PROMESA (70-80)", category: "cat1", eaId: 260592, url: "https://cdn.futwiz.com/assets/img/fc25/faces/260592.png" },
  { name: "Destiny Udogie", series: "Tottenham / Italy", rating: 80, position: "LI", flag: "🇮🇹", club: "Tottenham", tier: "PROMESA (70-80)", category: "cat1", eaId: 257121, url: "https://cdn.futwiz.com/assets/img/fc25/faces/257121.png" },
  { name: "Bradley Barcola", series: "PSG / France", rating: 80, position: "EI", flag: "🇫🇷", club: "PSG", tier: "PROMESA (70-80)", category: "cat1", eaId: 263620, url: "https://cdn.futwiz.com/assets/img/fc25/faces/263620.png" },
  { name: "Alejandro Balde", series: "FC Barcelona / Spain", rating: 80, position: "LI", flag: "🇪🇸", club: "FC Barcelona", tier: "PROMESA (70-80)", category: "cat1", eaId: 263578, url: "https://cdn.futwiz.com/assets/img/fc25/faces/263578.png" },
  { name: "Alejandro Garnacho", series: "Manchester United / Argentina", rating: 79, position: "EI", flag: "🇦🇷", club: "Man United", tier: "PROMESA (70-80)", category: "cat1", eaId: 268438, url: "https://cdn.futwiz.com/assets/img/fc25/faces/268438.png" },
  { name: "Castello Lukeba", series: "RB Leipzig / France", rating: 79, position: "DFC", flag: "🇫🇷", club: "RB Leipzig", tier: "PROMESA (70-80)", category: "cat1", eaId: 262138, url: "https://cdn.futwiz.com/assets/img/fc25/faces/262138.png" },
  { name: "Yan Couto", series: "Borussia Dortmund / Brazil", rating: 79, position: "LD", flag: "🇧🇷", club: "Dortmund", tier: "PROMESA (70-80)", category: "cat1", eaId: 259075, url: "https://cdn.futwiz.com/assets/img/fc25/faces/259075.png" },
  { name: "Arda Güler", series: "Real Madrid / Türkiye", rating: 78, position: "MCO", flag: "🇹🇷", club: "Real Madrid", tier: "PROMESA (70-80)", category: "cat1", eaId: 264309, url: "https://cdn.futwiz.com/assets/img/fc25/faces/264309.png" },
  { name: "Harvey Elliott", series: "Liverpool / England", rating: 78, position: "MCO", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Liverpool", tier: "PROMESA (70-80)", category: "cat1", eaId: 246174, url: "https://cdn.futwiz.com/assets/img/fc25/faces/246174.png" },
  { name: "Lucas Beraldo", series: "PSG / Brazil", rating: 78, position: "DFC", flag: "🇧🇷", club: "PSG", tier: "PROMESA (70-80)", category: "cat1", eaId: 275070, url: "https://cdn.futwiz.com/assets/img/fc25/faces/275070.png" },
  { name: "Malo Gusto", series: "Chelsea / France", rating: 78, position: "LD", flag: "🇫🇷", club: "Chelsea", tier: "PROMESA (70-80)", category: "cat1", eaId: 259307, url: "https://cdn.futwiz.com/assets/img/fc25/faces/259307.png" },
  { name: "Endrick", series: "Real Madrid / Brazil", rating: 77, position: "DC", flag: "🇧🇷", club: "Real Madrid", tier: "PROMESA (70-80)", category: "cat1", eaId: 272505, url: "https://cdn.futwiz.com/assets/img/fc25/faces/272505.png" },
  { name: "Kobbie Mainoo", series: "Manchester United / England", rating: 77, position: "MC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Man United", tier: "PROMESA (70-80)", category: "cat1", eaId: 269136, url: "https://cdn.futwiz.com/assets/img/fc25/faces/269136.png" },
  { name: "Mathys Tel", series: "Bayern Munich / France", rating: 77, position: "DC", flag: "🇫🇷", club: "Bayern", tier: "PROMESA (70-80)", category: "cat1", eaId: 268421, url: "https://cdn.futwiz.com/assets/img/fc25/faces/268421.png" },
  { name: "Arthur Vermeeren", series: "RB Leipzig / Belgium", rating: 77, position: "MC", flag: "🇧🇪", club: "RB Leipzig", tier: "PROMESA (70-80)", category: "cat1", eaId: 269859, url: "https://cdn.futwiz.com/assets/img/fc25/faces/269859.png" },
  { name: "Adam Wharton", series: "Crystal Palace / England", rating: 77, position: "MCD", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Crystal Palace", tier: "PROMESA (70-80)", category: "cat1", eaId: 269850, url: "https://cdn.futwiz.com/assets/img/fc25/faces/269850.png" },
  { name: "Antonio Nusa", series: "RB Leipzig / Norway", rating: 77, position: "EI", flag: "🇳🇴", club: "RB Leipzig", tier: "PROMESA (70-80)", category: "cat1", eaId: 262863, url: "https://cdn.futwiz.com/assets/img/fc25/faces/262863.png" },
  { name: "Bilal El Khannouss", series: "Leicester City / Morocco", rating: 77, position: "MCO", flag: "🇲🇦", club: "Leicester", tier: "PROMESA (70-80)", category: "cat1", eaId: 257504, url: "https://cdn.futwiz.com/assets/img/fc25/faces/257504.png" },
  { name: "Fermín López", series: "FC Barcelona / Spain", rating: 76, position: "MC", flag: "🇪🇸", club: "FC Barcelona", tier: "PROMESA (70-80)", category: "cat1", eaId: 277179, url: "https://cdn.futwiz.com/assets/img/fc25/faces/277179.png" },
  { name: "Rico Lewis", series: "Manchester City / England", rating: 76, position: "LD", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Man City", tier: "PROMESA (70-80)", category: "cat1", eaId: 271574, url: "https://cdn.futwiz.com/assets/img/fc25/faces/271574.png" },
  { name: "Jamie Bynoe-Gittens", series: "Borussia Dortmund / England", rating: 76, position: "EI", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Dortmund", tier: "PROMESA (70-80)", category: "cat1", eaId: 266852, url: "https://cdn.futwiz.com/assets/img/fc25/faces/266852.png" },
  { name: "Kenan Yıldız", series: "Juventus / Türkiye", rating: 76, position: "SD", flag: "🇹🇷", club: "Juventus", tier: "PROMESA (70-80)", category: "cat1", eaId: 277954, url: "https://cdn.futwiz.com/assets/img/fc25/faces/277954.png" },
  { name: "Jorrel Hato", series: "Ajax / Netherlands", rating: 76, position: "DFC", flag: "🇳🇱", club: "Ajax", tier: "PROMESA (70-80)", category: "cat1", eaId: 272978, url: "https://cdn.futwiz.com/assets/img/fc25/faces/272978.png" },
  { name: "Carlos Baleba", series: "Brighton / Cameroon", rating: 76, position: "MCD", flag: "🇨🇲", club: "Brighton", tier: "PROMESA (70-80)", category: "cat1", eaId: 272500, url: "https://cdn.futwiz.com/assets/img/fc25/faces/272500.png" },
  { name: "Evan Ferguson", series: "Brighton / Ireland", rating: 76, position: "DC", flag: "🇮🇪", club: "Brighton", tier: "PROMESA (70-80)", category: "cat1", eaId: 259608, url: "https://cdn.futwiz.com/assets/img/fc25/faces/259608.png" },
  { name: "Yaser Asprilla", series: "Girona / Colombia", rating: 76, position: "MCO", flag: "🇨🇴", club: "Girona", tier: "PROMESA (70-80)", category: "cat1", eaId: 271464, url: "https://cdn.futwiz.com/assets/img/fc25/faces/271464.png" },
  { name: "Conor Bradley", series: "Liverpool / Northern Ireland", rating: 76, position: "LD", flag: "🇬🇧", club: "Liverpool", tier: "PROMESA (70-80)", category: "cat1", eaId: 264298, url: "https://cdn.futwiz.com/assets/img/fc25/faces/264298.png" },
  { name: "Pau Cubarsí", series: "FC Barcelona / Spain", rating: 75, position: "DFC", flag: "🇪🇸", club: "FC Barcelona", tier: "PROMESA (70-80)", category: "cat1", eaId: 278046, url: "https://cdn.futwiz.com/assets/img/fc25/faces/278046.png" },
  { name: "Oscar Bobb", series: "Manchester City / Norway", rating: 75, position: "ED", flag: "🇳🇴", club: "Man City", tier: "PROMESA (70-80)", category: "cat1", eaId: 277295, url: "https://cdn.futwiz.com/assets/img/fc25/faces/277295.png" },
  { name: "Lamine Camara", series: "Monaco / Senegal", rating: 75, position: "MC", flag: "🇸🇳", club: "Monaco", tier: "PROMESA (70-80)", category: "cat1", eaId: 275138, url: "https://cdn.futwiz.com/assets/img/fc25/faces/275138.png" },
  { name: "Archie Gray", series: "Tottenham / England", rating: 75, position: "MC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Tottenham", tier: "PROMESA (70-80)", category: "cat1", eaId: 270208, url: "https://cdn.futwiz.com/assets/img/fc25/faces/270208.png" },
  { name: "Roony Bardghji", series: "FC Copenhagen / Sweden", rating: 75, position: "ED", flag: "🇸🇪", club: "Copenhagen", tier: "PROMESA (70-80)", category: "cat1", eaId: 265600, url: "https://cdn.futwiz.com/assets/img/fc25/faces/265600.png" },
  { name: "Assane Diao", series: "Real Betis / Spain", rating: 75, position: "EI", flag: "🇪🇸", club: "Real Betis", tier: "PROMESA (70-80)", category: "cat1", eaId: 275324, url: "https://cdn.futwiz.com/assets/img/fc25/faces/275324.png" },
  { name: "Lewis Miley", series: "Newcastle United / England", rating: 75, position: "MC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Newcastle", tier: "PROMESA (70-80)", category: "cat1", eaId: 274246, url: "https://cdn.futwiz.com/assets/img/fc25/faces/274246.png" },
  { name: "Semih Kılıçsoy", series: "Beşiktaş / Türkiye", rating: 75, position: "DC", flag: "🇹🇷", club: "Beşiktaş", tier: "PROMESA (70-80)", category: "cat1", eaId: 274616, url: "https://cdn.futwiz.com/assets/img/fc25/faces/274616.png" },
  { name: "Claudio Echeverri", series: "River Plate / Argentina", rating: 75, position: "MCO", flag: "🇦🇷", club: "River Plate", tier: "PROMESA (70-80)", category: "cat1", eaId: 276528, url: "https://cdn.futwiz.com/assets/img/fc25/faces/276528.png" },
  { name: "Jobe Bellingham", series: "Sunderland / England", rating: 74, position: "MC", flag: "🏴󠁧󠁢󠁥󠁮󠁧󠁿", club: "Sunderland", tier: "PROMESA (70-80)", category: "cat1", eaId: 270964, url: "https://cdn.futwiz.com/assets/img/fc25/faces/270964.png" },
  { name: "Franco Mastantuono", series: "River Plate / Argentina", rating: 74, position: "MCO", flag: "🇦🇷", club: "River Plate", tier: "PROMESA (70-80)", category: "cat1", eaId: 279173, url: "https://cdn.futwiz.com/assets/img/fc25/faces/279173.png" }
];

function downloadToFile(url, dest) {
  return new Promise((resolve) => {
    https.get(url, { headers: { 'User-Agent': 'Mozilla/5.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        const loc = res.headers.location;
        if (!loc) return resolve(false);
        return downloadToFile(loc, dest).then(resolve);
      }
      if (res.statusCode !== 200) {
        return resolve(false);
      }
      const stream = fs.createWriteStream(dest);
      res.pipe(stream);
      stream.on('finish', () => {
        stream.close(() => {
          const stats = fs.statSync(dest);
          if (stats.size > 3000 && stats.size !== 94211) {
            resolve({ ok: true, size: stats.size });
          } else {
            resolve({ ok: false, size: stats.size });
          }
        });
      });
      stream.on('error', () => resolve({ ok: false, size: 0 }));
    }).on('error', () => resolve({ ok: false, size: 0 }));
  });
}

async function run() {
  console.log(`\n======================================================`);
  console.log(`🚀 INICIANDO DESCARGA Y SINCRONIZACIÓN DE 100 JUGADORES`);
  console.log(`======================================================\n`);

  const finalPlayers = [];

  for (let i = 0; i < rawPlayers.length; i++) {
    const p = rawPlayers[i];
    const id = `player_${i + 1}`;
    const filename = `${id}.png`;
    const dest = path.join(UPLOAD_DIR, filename);
    const webPath = `/uploads/${filename}`;

    console.log(`[${i + 1}/100] Descargando y asignando ${p.name} -> ${filename} ...`);
    const dlResult = await downloadToFile(p.url, dest);
    if (!dlResult.ok) {
      console.error(`❌ ERROR al descargar imagen de ${p.name} desde ${p.url} (size: ${dlResult.size})`);
      process.exit(1);
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
      category: p.category,
      ...(p.eaId ? { eaId: p.eaId } : {})
    });
  }

  // 1. Guardar characters.json local
  fs.writeFileSync(CHAR_FILE, JSON.stringify(finalPlayers, null, 2), 'utf8');
  console.log(`\n✅ [Local] ${CHAR_FILE} guardado exitosamente con los 100 jugadores ordenados.`);

  // 2. Sincronizar en Supabase si está disponible
  if (process.env.DATABASE_URL) {
    console.log(`\n🔄 [Supabase] Sincronizando tabla tiktok_futbol_characters...`);
    const pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: { rejectUnauthorized: false }
    });

    try {
      const client = await pool.connect();
      // Limpiar tabla previa para eliminar desajustes
      await client.query(`DELETE FROM tiktok_futbol_characters`);
      console.log(`🗑️ [Supabase] Registros previos limpiados.`);

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
      console.log(`✅ [Supabase] 100 jugadores insertados correctamente en tiktok_futbol_characters.`);
      client.release();
    } catch (dbErr) {
      console.error(`⚠️ [Supabase Error]:`, dbErr.message);
    } finally {
      await pool.end();
    }
  }

  console.log(`\n🎉 PROCESO COMPLETADO AL 100%!`);
}

run();
