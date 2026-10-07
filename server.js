import express from 'express';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { 
  TikTokLiveConnection, 
  WebcastEvent, 
  RoomIdRouteConfig, 
  IsLiveRouteConfig, 
  RouteConfig, 
  getRandomPresets 
} from 'tiktok-live-connector';

// Disable EulerStream paid fallback route so it never throws pricing error
RoomIdRouteConfig.skipFetchRoomIdFromEulerRoute = true;
IsLiveRouteConfig.skipFetchRoomIdFromEulerRoute = true;

// Override signature provider to bypass paid EulerStream signature requirement
RouteConfig.fetchWebcastSignatureFromProvider = async ({ url, userAgent }) => {
  return { response: { signedUrl: url, userAgent } };
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'settings.json');
const CHAR_FILE = path.join(__dirname, 'characters.json');
const UPLOAD_DIR = path.join(__dirname, 'public', 'uploads');

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

function readJson(file, fallback) {
  try {
    return JSON.parse(fs.readFileSync(file, 'utf8'));
  } catch {
    return fallback;
  }
}

function saveJson(file, data) {
  fs.writeFileSync(file, JSON.stringify(data, null, 2), 'utf8');
}

const defaultCharacters = readJson(CHAR_FILE, []);
let characters = readJson(CHAR_FILE, defaultCharacters);
let settings = readJson(DATA_FILE, {
  rules: {
    chat: { enabled: false, approval: 'auto', mode: 'random', characterId: '' },
    follow: { enabled: true, approval: 'auto', mode: 'random', characterId: '' },
    gift: { enabled: true, approval: 'auto', mode: 'random', characterId: '' }
  },
  giftMappings: [
    { giftName: 'Rose', characterId: '', mode: 'random' },
    { giftName: 'TikTok', characterId: '', mode: 'random' },
    { giftName: 'Dragon', characterId: '', mode: 'random' },
    { giftName: 'Lion', characterId: '', mode: 'random' }
  ],
  goalConfig: {
    targetGifts: 50,
    rewardCharacterId: '',
    rerollGiftName: 'Piano'
  },
  overlayConfig: {
    soundEnabled: true,
    displayMode: 'card', // 'card', 'popup', 'ticker'
    popupDuration: 5000
  }
});

let connection = null;
let connectedUser = '';
let assigned = new Map();
let usedCharacters = new Set();
let feed = [];
let rank = 0;
let pending = [];
let lastAlert = null;

app.use((req, res, next) => {
  res.header("Access-Control-Allow-Origin", "*");
  res.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
  res.header("Access-Control-Allow-Methods", "GET, POST, OPTIONS, PUT, DELETE");
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '15mb' }));
app.use(express.static(path.join(__dirname, 'public')));

function normalizeUsername(value) {
  if (!value) return '';
  let str = String(value).trim();
  str = str.replace(/https?:\/\/(www\.)?tiktok\.com\/@?/, '');
  str = str.replace(/^@+/, '');
  return str.split(/[/?#\s]/)[0].trim();
}

function characterById(id) {
  return characters.find(c => c.id === id);
}

function ensureIds() {
  let changed = false;
  characters = characters.map((c, i) => {
    if (!c.id) {
      c.id = `char_${Date.now()}_${i}_${Math.random().toString(36).slice(2, 7)}`;
      changed = true;
    }
    return c;
  });
  if (changed) saveJson(CHAR_FILE, characters);
}
ensureIds();

function chooseCharacter() {
  let available = characters.filter(c => !usedCharacters.has(c.id));
  if (!available.length) {
    usedCharacters.clear();
    available = characters;
  }
  return available.length ? available[Math.floor(Math.random() * available.length)] : null;
}

function chooseCharacterForCoins(coinCount = 1) {
  let minRating = 70;
  let maxRating = 80;

  if (coinCount >= 30) {
    minRating = 96;
    maxRating = 99;
  } else if (coinCount >= 10) {
    minRating = 91;
    maxRating = 95;
  } else if (coinCount >= 5) {
    minRating = 81;
    maxRating = 90;
  } else {
    minRating = 70;
    maxRating = 80;
  }

  let matching = characters.filter(c => (c.rating || 80) >= minRating && (c.rating || 80) <= maxRating);

  if (!matching.length) {
    matching = characters.filter(c => (c.rating || 80) >= minRating - 5);
  }
  if (!matching.length) {
    matching = characters;
  }

  return matching[Math.floor(Math.random() * matching.length)];
}

function chooseForRule(rule, giftName = '') {
  // Check custom gift mappings first if gift event
  if (giftName && settings.giftMappings && Array.isArray(settings.giftMappings)) {
    const mapping = settings.giftMappings.find(
      g => g.giftName.trim().toLowerCase() === giftName.trim().toLowerCase()
    );
    if (mapping && mapping.characterId) {
      const mappedChar = characterById(mapping.characterId);
      if (mappedChar) return mappedChar;
    }
  }

  if (rule?.mode === 'specific' && rule.characterId) {
    return characterById(rule.characterId) || chooseCharacter();
  }
  return chooseCharacter();
}

function addFeed(item) {
  const eventId = `evt_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`;
  const feedItem = { ...item, eventId };
  feed.unshift(feedItem);
  feed = feed.slice(0, 100);
  lastAlert = feedItem;
}

function getTop5() {
  const allDonors = [...assigned.values()];
  allDonors.sort((a, b) => (b.score || 0) - (a.score || 0) || (b.updatedAt || 0) - (a.updatedAt || 0));
  return allDonors.slice(0, 5).map((item, idx) => ({
    ...item,
    topRank: idx + 1
  }));
}

function setCharacter(item, char) {
  if (!char) return;
  item.character = char.name;
  item.series = char.series || '';
  item.image = char.image || '';
  item.characterId = char.id;
  item.rating = char.rating || 88;
  item.position = char.position || 'DC';
  item.flag = char.flag || '⚽';
  item.club = char.club || 'Fútbol';
  item.tier = char.tier || 'ORO';
}

function getMultiplierForCoins(diamondCount = 1, rating = 80) {
  if (diamondCount >= 30 || rating >= 96) return 30;
  if (diamondCount >= 10 || rating >= 91) return 10;
  if (diamondCount >= 5 || rating >= 81) return 5;
  return 1;
}

function assignUser(username, source = 'manual', forcedCharacter = null, eventInfo = {}, userAvatar = '') {
  username = normalizeUsername(username);
  if (!username) throw new Error('El nombre de usuario no puede estar vacío');
  const key = username.toLowerCase();
  
  const isGift = (eventInfo.type === 'gift');
  const giftCount = Math.max(1, parseInt(eventInfo.giftCount || 1, 10));
  const diamondCount = Math.max(1, parseInt(eventInfo.diamondCount || giftCount || 1, 10));
  const rerollGift = (settings.goalConfig?.rerollGiftName || 'Piano').trim().toLowerCase();
  const currentGiftName = (eventInfo.giftName || '').trim().toLowerCase();

  let item;
  let newPlayer = forcedCharacter;
  if (!newPlayer) {
    if (isGift) {
      newPlayer = chooseCharacterForCoins(diamondCount);
    } else {
      newPlayer = chooseCharacter();
    }
  }

  if (assigned.has(key)) {
    item = assigned.get(key);
    item.event = eventInfo;
    item.updatedAt = Date.now();
    if (userAvatar) item.userAvatar = userAvatar;

    if (!item.squad) item.squad = [];

    if (forcedCharacter) {
      newPlayer = forcedCharacter;
    } else if (isGift && currentGiftName && currentGiftName === rerollGift) {
      newPlayer = chooseCharacter();
      console.log(`✨ [CAMBIO DE JUGADOR] @${username} envió ${eventInfo.giftName} -> Nuevo jugador: ${newPlayer?.name}`);
    }

    if (newPlayer) {
      const pRating = newPlayer.rating || 85;
      const multiplier = getMultiplierForCoins(diamondCount, pRating);
      const pointsEarned = pRating * multiplier;

      item.score = (item.score || 0) + pointsEarned;
      item.multiplier = multiplier;
      item.pointsEarned = pointsEarned;
      setCharacter(item, newPlayer);

      item.squad.push({
        id: newPlayer.id,
        name: newPlayer.name,
        series: newPlayer.series || '',
        image: newPlayer.image || '',
        rating: pRating,
        multiplier: multiplier,
        pointsEarned: pointsEarned,
        position: newPlayer.position || 'DC',
        flag: newPlayer.flag || '⚽',
        club: newPlayer.club || 'Fútbol',
        tier: newPlayer.tier || 'ORO'
      });
      item.squad = item.squad.slice(-5); // Keep latest 5 players for current team
    }
  } else {
    if (!newPlayer) throw new Error('No hay jugadores de fútbol configurados. Agrega al menos uno.');
    
    usedCharacters.add(newPlayer.id);
    rank += 1;
    const pRating = newPlayer.rating || 85;
    const multiplier = getMultiplierForCoins(diamondCount, pRating);
    const pointsEarned = pRating * multiplier;

    item = {
      rank,
      username,
      score: pointsEarned,
      multiplier,
      pointsEarned,
      character: newPlayer.name,
      series: newPlayer.series || '',
      image: newPlayer.image || '',
      characterId: newPlayer.id,
      rating: pRating,
      position: newPlayer.position || 'DC',
      flag: newPlayer.flag || '⚽',
      club: newPlayer.club || 'Fútbol',
      tier: newPlayer.tier || 'ORO',
      squad: [{
        id: newPlayer.id,
        name: newPlayer.name,
        series: newPlayer.series || '',
        image: newPlayer.image || '',
        rating: pRating,
        multiplier: multiplier,
        pointsEarned: pointsEarned,
        position: newPlayer.position || 'DC',
        flag: newPlayer.flag || '⚽',
        club: newPlayer.club || 'Fútbol',
        tier: newPlayer.tier || 'ORO'
      }],
      userAvatar: userAvatar || '',
      source,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      event: eventInfo
    };
    assigned.set(key, item);
  }

  // Calculate football team completion (5 players = 1 complete team for Fútbol 5)
  const fullTeams = Math.floor(item.score / 5);
  const playersInCurrentTeam = (item.score % 5 === 0 && item.score > 0) ? 5 : (item.score % 5);
  item.fullTeams = fullTeams;
  item.playersInCurrentTeam = playersInCurrentTeam;
  
  // Trophies ecosystem calculation
  item.trophies = [];
  if (fullTeams >= 1) item.trophies.push({ id: 'liga', name: 'Liga Nacional', icon: '🏆' });
  if (fullTeams >= 2) item.trophies.push({ id: 'champions', name: 'Champions League', icon: '🏆✨' });
  if (fullTeams >= 3) item.trophies.push({ id: 'worldcup', name: 'Copa del Mundo', icon: '🏆🌍' });
  if (fullTeams >= 4) item.trophies.push({ id: 'leyenda', name: 'Leyenda del Fútbol', icon: '👑' });

  const targetGifts = settings.goalConfig?.targetGifts || 50;
  const rewardChar = settings.goalConfig?.rewardCharacterId ? characterById(settings.goalConfig.rewardCharacterId) : null;
  if (targetGifts > 0 && item.score >= targetGifts && rewardChar && item.characterId !== rewardChar.id) {
    setCharacter(item, rewardChar);
    item.isGoalWinner = true;
    console.log(`🏆 [ALCANZÓ LA META] @${username} llegó a ${item.score}/${targetGifts} regalos -> Jugador Estrella Premio: ${rewardChar.name}`);
  }

  addFeed(item);
  return item;
}

function userFromData(data) {
  const raw = 
    data?.user?.uniqueId ||
    data?.user?.nickname ||
    data?.userDetails?.uniqueId ||
    data?.userDetails?.nickname ||
    data?.user?.displayName ||
    data?.uniqueId ||
    data?.nickname ||
    data?.sender?.uniqueId ||
    data?.sender?.nickname;
  return normalizeUsername(raw);
}

function avatarFromData(data) {
  const urls = data?.user?.profilePictureUrl?.urlList || data?.user?.avatarThumb?.urlList;
  if (Array.isArray(urls) && urls.length > 0) return urls[0];
  return data?.user?.profilePictureUrl || '';
}

function giftNameFromData(data) {
  const name = 
    data?.giftDetails?.giftName ||
    data?.giftName ||
    data?.gift?.name ||
    data?.giftDetails?.giftName ||
    data?.gift?.describe ||
    data?.giftId;
  return String(name || 'Rosa / Regalo');
}

function handleEvent(type, data) {
  const username = userFromData(data);
  if (!username) {
    console.warn(`[TikTok Event Warning]: No se pudo extraer el usuario de un evento ${type}`, JSON.stringify(data).slice(0, 150));
    return;
  }

  const rule = settings.rules?.[type];
  if (!rule?.enabled) return;

  const giftName = type === 'gift' ? giftNameFromData(data) : '';
  const giftCount = type === 'gift' ? (data?.repeatCount || data?.giftDetails?.repeatCount || 1) : 1;
  const userAvatar = avatarFromData(data);

  console.log(`🎁 [TikTok ${type.toUpperCase()}] @${username} enviando: ${giftName} (x${giftCount})`);

  if (type === 'gift' && rule.giftName && rule.giftName.trim().toLowerCase() !== giftName.trim().toLowerCase()) {
    return;
  }

  const key = username.toLowerCase();

  // If user already exists and event is not a gift, skip to avoid feed/DOM spam
  if (assigned.has(key) && type !== 'gift') {
    return;
  }

  if (rule.approval === 'manual' && !assigned.has(key)) {
    const exists = pending.some(p => p.username.toLowerCase() === key && p.type === type);
    if (!exists) {
      pending.unshift({
        id: `pending_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
        username,
        userAvatar,
        type,
        giftName,
        giftCount,
        createdAt: Date.now()
      });
      pending = pending.slice(0, 100);
    }
    return;
  }

  const character = chooseForRule(rule, giftName);
  try {
    assignUser(username, `tiktok_${type}`, character, { type, giftName, giftCount }, userAvatar);
  } catch (e) {
    console.error(`[TikTok Event Error]: ${e.message}`);
  }
}

function connectEvents(conn) {
  const on = (event, fn) => {
    try {
      conn.on(event, fn);
    } catch {}
  };
  on(WebcastEvent.CHAT, data => handleEvent('chat', data));
  on(WebcastEvent.FOLLOW, data => handleEvent('follow', data));
  on(WebcastEvent.GIFT, data => handleEvent('gift', data));
  on(WebcastEvent.DISCONNECTED, () => {
    connection = null;
  });
}

// API Routes
app.get('/api/state', (req, res) => {
  const allDonors = [...assigned.values()].sort((a, b) => (b.score || 0) - (a.score || 0) || (b.updatedAt || 0) - (a.updatedAt || 0));
  res.json({
    connected: Boolean(connection),
    connectedUser,
    total: assigned.size,
    top5: allDonors.slice(0, 5).map((item, idx) => ({ ...item, topRank: idx + 1 })),
    feed,
    all: allDonors,
    pending,
    lastAlert,
    goalConfig: settings.goalConfig || { targetGifts: 50, rewardCharacterId: '', rerollGiftName: 'Piano' },
    overlayConfig: settings.overlayConfig || {}
  });
});

app.get('/api/config', (req, res) => {
  res.json({
    characters,
    rules: settings.rules,
    giftMappings: settings.giftMappings || [],
    goalConfig: settings.goalConfig || { targetGifts: 50, rewardCharacterId: '', rerollGiftName: 'Piano' },
    overlayConfig: settings.overlayConfig || {}
  });
});

app.post('/api/config', (req, res) => {
  if (req.body.rules) settings.rules = req.body.rules;
  if (req.body.giftMappings) settings.giftMappings = req.body.giftMappings;
  if (req.body.goalConfig) settings.goalConfig = req.body.goalConfig;
  if (req.body.overlayConfig) settings.overlayConfig = req.body.overlayConfig;
  saveJson(DATA_FILE, settings);
  res.json({ ok: true, settings });
});

app.post('/api/characters', (req, res) => {
  try {
    const { id, name, series = '', image = '', rating = 85, position = 'DC', flag = '⚽', club = 'Fútbol', tier = '' } = req.body || {};
    if (!String(name || '').trim()) throw new Error('El nombre es obligatorio.');
    
    const parsedRating = Math.max(1, Math.min(99, parseInt(rating || 85, 10)));
    
    let calculatedTier = tier;
    if (!calculatedTier) {
      if (parsedRating >= 96) calculatedTier = 'LEYENDA 99';
      else if (parsedRating >= 91) calculatedTier = 'ESTRELLA (91-95)';
      else if (parsedRating >= 81) calculatedTier = 'CRACK (81-90)';
      else calculatedTier = 'PROMESA (70-80)';
    }

    const item = {
      id: id || `char_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`,
      name: String(name).trim(),
      series: String(series).trim(),
      image: String(image || ''),
      rating: parsedRating,
      position: String(position || 'DC').toUpperCase(),
      flag: String(flag || '⚽'),
      club: String(club || 'Fútbol'),
      tier: calculatedTier
    };

    if (id) {
      const idx = characters.findIndex(c => c.id === id);
      if (idx < 0) throw new Error('Personaje no encontrado.');
      characters[idx] = { ...characters[idx], ...item };
    } else {
      characters.push(item);
    }
    saveJson(CHAR_FILE, characters);
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/characters/:id', (req, res) => {
  const id = req.params.id;
  const existing = characterById(id);
  if (!existing) return res.status(404).json({ error: 'Personaje no encontrado.' });
  characters = characters.filter(c => c.id !== id);
  saveJson(CHAR_FILE, characters);
  res.json({ ok: true });
});

// Test/Simulator Endpoint
app.post('/api/test-event', (req, res) => {
  try {
    const { username = `Donador_${Math.floor(Math.random() * 900 + 100)}`, eventType = 'gift', giftName = 'Rosa de TikTok', giftCount = 1, characterId = '' } = req.body;
    
    const forcedChar = characterId ? characterById(characterId) : null;

    const result = assignUser(
      username,
      `prueba_${eventType}`,
      forcedChar,
      { type: eventType, giftName, giftCount, diamondCount: giftCount },
      `https://api.dicebear.com/7.x/avataaars/svg?seed=${username}`
    );

    res.json({ ok: true, result });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/pending/assign', (req, res) => {
  try {
    const item = pending.find(p => p.id === req.body.id);
    if (!item) throw new Error('Evento pendiente no encontrado.');
    const forced = req.body.characterId ? characterById(req.body.characterId) : null;
    const result = assignUser(item.username, `manual_${item.type}`, forced, { type: item.type, giftName: item.giftName }, item.userAvatar);
    pending = pending.filter(p => p.id !== item.id);
    res.json(result);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/pending/ignore', (req, res) => {
  pending = pending.filter(p => p.id !== req.body.id);
  res.json({ ok: true });
});

app.post('/api/assign', (req, res) => {
  try {
    const forced = req.body.characterId ? characterById(req.body.characterId) : null;
    const item = assignUser(req.body.username, 'manual', forced);
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/preview-assign', (req, res) => {
  try {
    const username = normalizeUsername(req.body.username);
    if (!username) throw new Error('Escribe un usuario.');
    const character = req.body.characterId ? characterById(req.body.characterId) : chooseCharacter();
    if (!character) throw new Error('No hay personajes configurados.');
    res.json({ username, character });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.post('/api/reset', (req, res) => {
  assigned.clear();
  usedCharacters.clear();
  feed = [];
  rank = 0;
  lastAlert = null;
  res.json({ ok: true });
});

app.post('/api/connect', async (req, res) => {
  const username = normalizeUsername(req.body.username);
  if (!username) return res.status(400).json({ error: 'Escribe un usuario válido de TikTok.' });
  try {
    if (connection) {
      try { await connection.disconnect(); } catch {}
      connection = null;
    }
    console.log(`Intentando conectar al LIVE de TikTok del usuario: @${username}...`);

    let lastError = null;
    let connectedState = null;

    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const presets = getRandomPresets();
        const conn = new TikTokLiveConnection(username, {
          clientPresets: presets,
          processInitialData: true,
          enableExtendedGiftInfo: false
        });
        
        connection = conn;
        connectedUser = username;
        connectEvents(conn);

        connectedState = await conn.connect();
        console.log(`¡Conectado exitosamente al LIVE de @${username}! Room ID: ${connectedState.roomId}`);
        break;
      } catch (err) {
        lastError = err;
        if (connection) {
          try { await connection.disconnect(); } catch {}
          connection = null;
        }
        console.warn(`Intento ${attempt + 1} para @${username} falló: ${err.message}`);
        await new Promise(resolve => setTimeout(resolve, 800));
      }
    }

    if (!connectedState) {
      throw lastError || new Error('No se pudo establecer la conexión con el LIVE.');
    }

    res.json({ ok: true, username, roomId: connectedState.roomId });
  } catch (e) {
    connection = null;
    connectedUser = '';
    const rawMsg = e?.message || String(e);
    console.error(`Error al conectar al LIVE de @${username}:`, rawMsg);

    let friendlyError = rawMsg;
    if (rawMsg.includes("isn't online") || rawMsg.includes("is not online") || rawMsg.includes("Offline") || rawMsg.includes("Failed to extract Room ID")) {
      friendlyError = `El usuario @${username} no está transmitiendo en vivo en TikTok en este momento (o el en vivo acaba de terminar).`;
    } else if (rawMsg.includes("User not found") || rawMsg.includes("404")) {
      friendlyError = `No se encontró el usuario @${username} en TikTok. Verifica el nombre.`;
    } else if (rawMsg.includes("DEVICE_BLOCKED")) {
      friendlyError = `TikTok bloqueó temporalmente la solicitud. Por favor intenta conectar de nuevo en unos segundos.`;
    }

    res.status(400).json({ error: friendlyError });
  }
});

app.post('/api/disconnect', async (req, res) => {
  if (connection) {
    try { await connection.disconnect(); } catch {}
  }
  connection = null;
  connectedUser = '';
  res.json({ ok: true });
});

app.listen(PORT, () => {
  console.log(`⚡ Anime Live Detector ejecutándose en: http://localhost:${PORT}`);
  console.log(`🎬 Overlay de OBS listo en: http://localhost:${PORT}/overlay.html`);
});
