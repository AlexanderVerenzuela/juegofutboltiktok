import fs from 'fs';
import { dbSaveAllCharacters } from './db.js';

const chars = JSON.parse(fs.readFileSync('characters.json', 'utf8'));

chars.forEach(c => {
  const r = c.rating || 80;
  if (r >= 96) {
    c.category = 'cat4';
    c.tier = 'LEYENDA (96-99)';
  } else if (r >= 90) {
    c.category = 'cat3';
    c.tier = 'ESTRELLA (90-95)';
  } else if (r >= 81) {
    c.category = 'cat2';
    c.tier = 'CRACK (81-89)';
  } else {
    c.category = 'cat1';
    c.tier = 'PROMESA (70-80)';
  }
});

// Sort strictly descending by average (rating), then name
chars.sort((a, b) => b.rating - a.rating || a.name.localeCompare(b.name));

fs.writeFileSync('characters.json', JSON.stringify(chars, null, 2), 'utf8');

const counts = { cat1: 0, cat2: 0, cat3: 0, cat4: 0 };
chars.forEach(c => counts[c.category]++);
console.log('Categories tagged & sorted:', counts);
console.log('Top 5:', chars.slice(0, 5).map(c => c.name + ' (' + c.rating + ')'));
console.log('Bottom 5:', chars.slice(-5).map(c => c.name + ' (' + c.rating + ')'));

// Sync to Supabase table tiktok_futbol_characters
await dbSaveAllCharacters(chars);
console.log('Successfully synced all 100 tagged players to Supabase!');
process.exit(0);
