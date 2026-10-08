import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

let pool = null;
let isConnected = false;

function getPool() {
  if (!process.env.DATABASE_URL) return null;
  if (!pool) {
    pool = new Pool({
      connectionString: process.env.DATABASE_URL,
      ssl: {
        rejectUnauthorized: false
      }
    });
    pool.on('error', (err) => {
      console.error('⚠️ [Supabase DB Error inesperado]:', err.message);
    });
  }
  return pool;
}

export async function initDatabase(fallbackCharacters = [], fallbackSettings = {}) {
  const p = getPool();
  if (!p) {
    console.log('ℹ️ [DB] DATABASE_URL no configurada en variables de entorno. Usando archivos locales.');
    return {
      usingDb: false,
      characters: fallbackCharacters,
      settings: fallbackSettings
    };
  }

  try {
    const client = await p.connect();
    isConnected = true;
    console.log('✅ [Supabase DB] Conectado exitosamente a la base de datos.');

    // 1. Crear tablas exclusivas con prefijo tiktok_futbol_ (totalmente aisladas de tus otras tablas)
    await client.query(`
      CREATE TABLE IF NOT EXISTS tiktok_futbol_characters (
        id TEXT PRIMARY KEY,
        name TEXT NOT NULL,
        rating INTEGER DEFAULT 85,
        image TEXT DEFAULT '',
        data JSONB DEFAULT '{}'::jsonb,
        created_at TIMESTAMPTZ DEFAULT NOW(),
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );

      CREATE TABLE IF NOT EXISTS tiktok_futbol_settings (
        id TEXT PRIMARY KEY DEFAULT 'current',
        data JSONB DEFAULT '{}'::jsonb,
        updated_at TIMESTAMPTZ DEFAULT NOW()
      );
    `);

    // 2. Cargar o Sembrar Characters
    const charsResult = await client.query(`SELECT id, name, rating, image, data FROM tiktok_futbol_characters ORDER BY rating DESC, name ASC`);
    let characters = [];

    if (charsResult.rows.length === 0 && fallbackCharacters.length > 0) {
      console.log(`📦 [Supabase DB] Migrando ${fallbackCharacters.length} jugadores iniciales a la tabla tiktok_futbol_characters...`);
      for (const c of fallbackCharacters) {
        const charData = { ...c };
        delete charData.id;
        delete charData.name;
        delete charData.rating;
        delete charData.image;

        await client.query(
          `INSERT INTO tiktok_futbol_characters (id, name, rating, image, data)
           VALUES ($1, $2, $3, $4, $5)
           ON CONFLICT (id) DO UPDATE SET name = EXCLUDED.name, rating = EXCLUDED.rating, image = EXCLUDED.image, data = EXCLUDED.data, updated_at = NOW()`,
          [c.id, c.name, c.rating || 85, c.image || '', JSON.stringify(charData)]
        );
      }
      characters = fallbackCharacters;
      console.log(`✅ [Supabase DB] ${fallbackCharacters.length} jugadores migrados con éxito.`);
    } else if (charsResult.rows.length > 0) {
      characters = charsResult.rows.map(row => ({
        id: row.id,
        name: row.name,
        rating: row.rating,
        image: row.image,
        ...(row.data || {})
      }));
      console.log(`✅ [Supabase DB] ${characters.length} jugadores cargados desde Supabase.`);
    } else {
      characters = [];
    }

    // 3. Cargar o Sembrar Settings
    const settingsResult = await client.query(`SELECT data FROM tiktok_futbol_settings WHERE id = 'current'`);
    let settings = fallbackSettings;

    if (settingsResult.rows.length === 0) {
      console.log('📦 [Supabase DB] Guardando configuraciones iniciales en tiktok_futbol_settings...');
      await client.query(
        `INSERT INTO tiktok_futbol_settings (id, data) VALUES ('current', $1)
         ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
        [JSON.stringify(fallbackSettings)]
      );
    } else {
      settings = settingsResult.rows[0].data || fallbackSettings;
      console.log('✅ [Supabase DB] Configuraciones cargadas desde Supabase.');
    }

    client.release();

    return {
      usingDb: true,
      characters,
      settings
    };
  } catch (err) {
    console.error('❌ [Supabase DB] Error al conectar a la base de datos:', err.message);
    console.log('⚠️ [Supabase DB] Continuando con archivos locales como respaldo de seguridad.');
    return {
      usingDb: false,
      characters: fallbackCharacters,
      settings: fallbackSettings
    };
  }
}

export async function dbSaveAllCharacters(charactersList) {
  const p = getPool();
  if (!p) return false;
  try {
    for (const character of charactersList) {
      const charData = { ...character };
      delete charData.id;
      delete charData.name;
      delete charData.rating;
      delete charData.image;

      await p.query(
        `INSERT INTO tiktok_futbol_characters (id, name, rating, image, data, updated_at)
         VALUES ($1, $2, $3, $4, $5, NOW())
         ON CONFLICT (id) DO UPDATE SET 
           name = EXCLUDED.name, 
           rating = EXCLUDED.rating, 
           image = EXCLUDED.image, 
           data = EXCLUDED.data, 
           updated_at = NOW()`,
        [character.id, character.name, character.rating || 85, character.image || '', JSON.stringify(charData)]
      );
    }
    return true;
  } catch (e) {
    console.error('❌ [Supabase DB] Error al guardar lista de jugadores:', e.message);
    return false;
  }
}

export async function dbSaveCharacter(character) {
  const p = getPool();
  if (!p || !isConnected) return false;
  try {
    const charData = { ...character };
    delete charData.id;
    delete charData.name;
    delete charData.rating;
    delete charData.image;

    await p.query(
      `INSERT INTO tiktok_futbol_characters (id, name, rating, image, data, updated_at)
       VALUES ($1, $2, $3, $4, $5, NOW())
       ON CONFLICT (id) DO UPDATE SET 
         name = EXCLUDED.name, 
         rating = EXCLUDED.rating, 
         image = EXCLUDED.image, 
         data = EXCLUDED.data, 
         updated_at = NOW()`,
      [character.id, character.name, character.rating || 85, character.image || '', JSON.stringify(charData)]
    );
    return true;
  } catch (e) {
    console.error('❌ [Supabase DB] Error al guardar jugador:', e.message);
    return false;
  }
}

export async function dbDeleteCharacter(id) {
  const p = getPool();
  if (!p || !isConnected) return false;
  try {
    await p.query(`DELETE FROM tiktok_futbol_characters WHERE id = $1`, [id]);
    return true;
  } catch (e) {
    console.error('❌ [Supabase DB] Error al eliminar jugador:', e.message);
    return false;
  }
}

export async function dbSaveSettings(settings) {
  const p = getPool();
  if (!p || !isConnected) return false;
  try {
    await p.query(
      `INSERT INTO tiktok_futbol_settings (id, data, updated_at)
       VALUES ('current', $1, NOW())
       ON CONFLICT (id) DO UPDATE SET data = EXCLUDED.data, updated_at = NOW()`,
      [JSON.stringify(settings)]
    );
    return true;
  } catch (e) {
    console.error('❌ [Supabase DB] Error al guardar configuraciones:', e.message);
    return false;
  }
}
