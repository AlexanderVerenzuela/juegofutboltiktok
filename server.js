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

import { initDatabase, dbSaveCharacter, dbDeleteCharacter, dbSaveSettings } from './db.js';

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

// Inicializar Supabase Database (con tablas tiktok_futbol_ aisladas)
try {
  const dbData = await initDatabase(characters, settings);
  if (dbData.usingDb) {
    characters = dbData.characters;
    settings = dbData.settings;
  }
} catch (e) {
  console.error('⚠️ [DB Init Error]:', e.message);
}

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

const defaultCategoryGifts = {
  cat1: {
    title: "Cat 1 - Promesas (70-80)",
    giftName: "Piano",
    coins: 1,
    minRating: 70,
    maxRating: 80,
    multiplier: 1,
    icon: "🎹"
  },
  cat2: {
    title: "Cat 2 - Cracks (81-89)",
    giftName: "Dona",
    coins: 5,
    minRating: 81,
    maxRating: 89,
    multiplier: 5,
    icon: "🍩"
  },
  cat3: {
    title: "Cat 3 - Estrellas (90-95)",
    giftName: "Gorra",
    coins: 10,
    minRating: 90,
    maxRating: 95,
    multiplier: 10,
    icon: "👒"
  },
  cat4: {
    title: "Cat 4 - Leyendas (96-99)",
    giftName: "León",
    coins: 30,
    minRating: 96,
    maxRating: 99,
    multiplier: 30,
    icon: "🦁"
  }
};

function getCategoryForGift(giftName = '', coins = 1) {
  const catGifts = settings.categoryGifts || defaultCategoryGifts;
  const cleanGift = String(giftName || '').trim().toLowerCase();

  // 1. Direct gift name match against configured category gifts
  if (cleanGift) {
    for (const key of ['cat4', 'cat3', 'cat2', 'cat1']) {
      const g = catGifts[key];
      if (g && g.giftName && g.giftName.trim().toLowerCase() === cleanGift) {
        return key;
      }
    }
  }

  // 2. Fallback by coin count
  const c4 = catGifts.cat4?.coins ?? 30;
  const c3 = catGifts.cat3?.coins ?? 10;
  const c2 = catGifts.cat2?.coins ?? 5;

  if (coins >= c4) return 'cat4';
  if (coins >= c3) return 'cat3';
  if (coins >= c2) return 'cat2';
  return 'cat1';
}

function chooseCharacterForCategory(catKey) {
  const catGifts = settings.categoryGifts || defaultCategoryGifts;
  const cat = catGifts[catKey] || catGifts.cat1;
  const min = cat.minRating ?? 70;
  const max = cat.maxRating ?? 80;

  let matching = characters.filter(c => (c.rating || 75) >= min && (c.rating || 75) <= max);
  let available = matching.filter(c => !usedCharacters.has(c.id));
  if (!available.length) {
    available = matching;
  }
  if (!available.length) {
    available = characters;
  }
  return available.length ? available[Math.floor(Math.random() * available.length)] : chooseCharacter();
}

function getMultiplierForCategory(catKey, rating = 80) {
  const catGifts = settings.categoryGifts || defaultCategoryGifts;
  const cat = catGifts[catKey];
  if (cat && cat.multiplier) return cat.multiplier;
  if (rating >= 96) return 30;
  if (rating >= 91) return 10;
  if (rating >= 81) return 5;
  return 1;
}

function chooseCharacterForCoins(coinCount = 1) {
  return chooseCharacterForCategory(getCategoryForGift('', coinCount));
}

function chooseForRule(rule, giftName = '', coinCount = 1) {
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
  return chooseCharacterForCategory(getCategoryForGift(giftName, coinCount));
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

function assignUser(username, source = 'manual', forcedCharacter = null, eventInfo = {}, userAvatar = '') {
  username = normalizeUsername(username);
  if (!username) throw new Error('El nombre de usuario no puede estar vacío');
  const key = username.toLowerCase();
  
  const isGift = (eventInfo.type === 'gift');
  const giftCount = Math.max(1, parseInt(eventInfo.giftCount || 1, 10));
  const diamondCount = Math.max(1, parseInt(eventInfo.diamondCount || giftCount || 1, 10));
  const catKey = isGift ? getCategoryForGift(eventInfo.giftName, diamondCount) : 'cat1';
  const rerollGift = (settings.goalConfig?.rerollGiftName || 'Galaxia').trim().toLowerCase();
  const currentGiftName = (eventInfo.giftName || '').trim().toLowerCase();

  let item;
  let newPlayer = forcedCharacter;
  if (!newPlayer) {
    if (isGift) {
      newPlayer = chooseCharacterForCategory(catKey);
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
      const multiplier = getMultiplierForCategory(catKey, pRating);
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
    const multiplier = getMultiplierForCategory(catKey, pRating);
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
    goalConfig: settings.goalConfig || { targetGifts: 50, rewardCharacterId: '', rerollGiftName: 'Galaxia' },
    overlayConfig: settings.overlayConfig || {}
  });
});

app.get('/api/config', (req, res) => {
  characters.sort((a, b) => (b.rating || 0) - (a.rating || 0) || a.name.localeCompare(b.name));
  res.json({
    characters,
    rules: settings.rules,
    giftMappings: settings.giftMappings || [],
    categoryGifts: settings.categoryGifts || defaultCategoryGifts,
    goalConfig: settings.goalConfig || { targetGifts: 50, rewardCharacterId: '', rerollGiftName: 'Galaxia' },
    overlayConfig: settings.overlayConfig || {}
  });
});

app.post('/api/config', async (req, res) => {
  if (req.body.rules) settings.rules = req.body.rules;
  if (req.body.giftMappings) settings.giftMappings = req.body.giftMappings;
  if (req.body.categoryGifts) settings.categoryGifts = req.body.categoryGifts;
  if (req.body.goalConfig) settings.goalConfig = req.body.goalConfig;
  if (req.body.overlayConfig) settings.overlayConfig = req.body.overlayConfig;
  saveJson(DATA_FILE, settings);
  await dbSaveSettings(settings);
  res.json({ ok: true, settings });
});

app.post('/api/characters', async (req, res) => {
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
    characters.sort((a, b) => (b.rating || 0) - (a.rating || 0) || a.name.localeCompare(b.name));
    saveJson(CHAR_FILE, characters);
    await dbSaveCharacter(item);
    res.json(item);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

app.delete('/api/characters/:id', async (req, res) => {
  const id = req.params.id;
  const existing = characterById(id);
  if (!existing) return res.status(404).json({ error: 'Personaje no encontrado.' });
  characters = characters.filter(c => c.id !== id);
  saveJson(CHAR_FILE, characters);
  await dbDeleteCharacter(id);
  res.json({ ok: true });
});

// Test/Simulator Endpoint
app.post('/api/test-event', (req, res) => {
  try {
    const { username = `Donador_${Math.floor(Math.random() * 900 + 100)}`, eventType = 'gift', giftName = '', giftCount = 1, characterId = '', category = '' } = req.body;
    
    const catGifts = settings.categoryGifts || defaultCategoryGifts;
    let resolvedGiftName = giftName;
    let resolvedCount = giftCount;

    if (category && catGifts[category]) {
      resolvedGiftName = catGifts[category].giftName;
      resolvedCount = catGifts[category].coins || 1;
    } else if (!resolvedGiftName) {
      resolvedGiftName = catGifts.cat1?.giftName || 'Piano';
    }

    const forcedChar = characterId ? characterById(characterId) : null;

    const result = assignUser(
      username,
      `prueba_${eventType}`,
      forcedChar,
      { type: eventType, giftName: resolvedGiftName, giftCount: resolvedCount, diamondCount: resolvedCount },
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
