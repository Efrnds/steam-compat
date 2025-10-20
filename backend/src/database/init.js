import Database from 'better-sqlite3';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const dbPath = join(__dirname, '../../data/steam-compat.db');

let db = null;

export function getDatabase() {
  if (!db) {
    db = new Database(dbPath);
    db.pragma('journal_mode = WAL');
  }
  return db;
}

export async function initDatabase() {
  console.log('📦 Inicializando banco de dados...');
  const database = getDatabase();

  // Tabela de jogos
  database.exec(`
    CREATE TABLE IF NOT EXISTS games (
      appid INTEGER PRIMARY KEY,
      name TEXT NOT NULL,
      header_image TEXT,
      short_description TEXT,
      type TEXT,
      price TEXT,
      release_date TEXT,
      developers TEXT,
      publishers TEXT,
      genres TEXT,
      requirements_min TEXT,
      requirements_rec TEXT,
      last_updated INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Tabela de análises
  database.exec(`
    CREATE TABLE IF NOT EXISTS analyses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      appid INTEGER NOT NULL,
      cpu_model TEXT NOT NULL,
      gpu_model TEXT NOT NULL,
      ram_total INTEGER NOT NULL,
      score INTEGER NOT NULL,
      rating_level TEXT NOT NULL,
      rating_label TEXT NOT NULL,
      cpu_score INTEGER,
      gpu_score INTEGER,
      ram_score INTEGER,
      created_at INTEGER DEFAULT (strftime('%s', 'now')),
      FOREIGN KEY (appid) REFERENCES games(appid)
    )
  `);

  // Tabela de cache de hardware benchmarks
  database.exec(`
    CREATE TABLE IF NOT EXISTS hardware_cache (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      hardware_name TEXT UNIQUE NOT NULL,
      hardware_type TEXT NOT NULL,
      benchmark_score INTEGER NOT NULL,
      confidence REAL,
      last_updated INTEGER DEFAULT (strftime('%s', 'now'))
    )
  `);

  // Índices
  database.exec(`
    CREATE INDEX IF NOT EXISTS idx_games_name ON games(name);
    CREATE INDEX IF NOT EXISTS idx_analyses_appid ON analyses(appid);
    CREATE INDEX IF NOT EXISTS idx_analyses_score ON analyses(score);
    CREATE INDEX IF NOT EXISTS idx_hardware_cache_name ON hardware_cache(hardware_name);
  `);

  console.log('✅ Banco de dados inicializado');
}

// Funções de helper
export function saveGame(game) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT OR REPLACE INTO games 
    (appid, name, header_image, short_description, type, price, release_date, 
     developers, publishers, genres, requirements_min, requirements_rec)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return stmt.run(
    game.appid,
    game.name,
    game.header_image,
    game.short_description,
    game.type,
    game.price,
    game.release_date,
    JSON.stringify(game.developers),
    JSON.stringify(game.publishers),
    JSON.stringify(game.genres),
    game.requirements?.minimum,
    game.requirements?.recommended
  );
}

export function getGame(appid) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM games WHERE appid = ?');
  return stmt.get(appid);
}

export function saveAnalysis(analysis) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO analyses 
    (appid, cpu_model, gpu_model, ram_total, score, rating_level, rating_label,
     cpu_score, gpu_score, ram_score)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  return stmt.run(
    analysis.appid,
    analysis.hardware.cpu.model,
    analysis.hardware.gpu.model,
    analysis.hardware.ram.total,
    analysis.score,
    analysis.rating.level,
    analysis.rating.label,
    analysis.details.cpu.score,
    analysis.details.gpu.score,
    analysis.details.ram.score
  );
}

export function getAnalyses(filters = {}) {
  const db = getDatabase();
  let query = 'SELECT * FROM analyses WHERE 1=1';
  const params = [];

  if (filters.appid) {
    query += ' AND appid = ?';
    params.push(filters.appid);
  }

  if (filters.minScore) {
    query += ' AND score >= ?';
    params.push(filters.minScore);
  }

  if (filters.limit) {
    query += ' LIMIT ?';
    params.push(filters.limit);
  }

  const stmt = db.prepare(query);
  return stmt.all(...params);
}