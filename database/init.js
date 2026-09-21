import path from 'path';
import fs from 'fs';
import { fileURLToPath, pathToFileURL } from 'url';
import { createRequire } from 'module';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const require = createRequire(import.meta.url);

// Dynamically resolve dotenv
try {
  const dotenv = (await import('dotenv')).default;
  dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
  dotenv.config();
} catch (e) {
  try {
    const fallbackDotenv = path.resolve(__dirname, '../backend/node_modules/dotenv/lib/main.js');
    const dotenv = (await import(pathToFileURL(fallbackDotenv).href)).default;
    dotenv.config({ path: path.resolve(__dirname, '../backend/.env') });
    dotenv.config();
  } catch (err) {
    // env vars already in process.env
  }
}

// Dynamically resolve pg so database/ scripts work standalone or via backend
let pgModule;
try {
  pgModule = await import('pg');
} catch (e) {
  try {
    const fallbackPg = path.resolve(__dirname, '../backend/node_modules/pg/lib/index.js');
    pgModule = await import(pathToFileURL(fallbackPg).href);
  } catch (err) {
    pgModule = require('pg');
  }
}

const pg = pgModule.default || pgModule;
const { Pool } = pg;

let pool = null;

/**
 * Configure and return PostgreSQL connection pool
 */
export function getPool() {
  if (!pool) {
    const connectionString = process.env.DATABASE_URL;

    const poolConfig = connectionString
      ? {
          connectionString,
          ssl:
            process.env.PGSSL === 'true' || connectionString.includes('sslmode=require')
              ? { rejectUnauthorized: false }
              : false,
        }
      : {
          host: process.env.PGHOST || 'localhost',
          port: parseInt(process.env.PGPORT || '5432', 10),
          user: process.env.PGUSER || 'postgres',
          password: process.env.PGPASSWORD || 'postgres',
          database: process.env.PGDATABASE || 'ruralmed',
          ssl: process.env.PGSSL === 'true' ? { rejectUnauthorized: false } : false,
        };

    pool = new Pool({
      ...poolConfig,
      max: 20,
      idleTimeoutMillis: 30000,
      connectionTimeoutMillis: 5000,
    });

    pool.on('error', (err) => {
      console.error('Unexpected error on idle PostgreSQL client', err);
    });
  }
  return pool;
}

// Alias getDb to getPool for backward compatibility
export const getDb = getPool;

/**
 * Convert SQLite '?' parameter placeholders to PostgreSQL '$1, $2, ...'
 * Ignores question marks enclosed within single-quoted string literals.
 */
export function convertPlaceholders(sql) {
  let index = 1;
  let inQuotes = false;
  let result = '';

  for (let i = 0; i < sql.length; i++) {
    const char = sql[i];
    if (char === "'") {
      if (inQuotes && sql[i + 1] === "'") {
        result += "''";
        i++;
        continue;
      }
      inQuotes = !inQuotes;
      result += char;
    } else if (char === '?' && !inQuotes) {
      result += `$${index++}`;
    } else {
      result += char;
    }
  }

  return result;
}

/**
 * Execute a raw query with PostgreSQL pool
 */
export async function query(sql, params = []) {
  const client = getPool();
  try {
    return await client.query(sql, params);
  } catch (err) {
    // Map PostgreSQL unique_violation (code 23505) to SQLite-style error message
    // so existing route error handlers (e.g. in auth.js and inventory.js) function seamlessly.
    if (err.code === '23505') {
      const detail = err.detail || err.constraint || '';
      const customErr = new Error(`UNIQUE constraint failed: ${detail}`);
      customErr.code = err.code;
      customErr.detail = err.detail;
      customErr.constraint = err.constraint;
      throw customErr;
    }
    throw err;
  }
}

/**
 * Run an INSERT / UPDATE / DELETE command
 * Automatically appends RETURNING id for INSERT queries if not already present,
 * and returns { id, changes, rowCount } to match SQLite API expectations.
 */
export async function run(sql, params = []) {
  let pgSql = convertPlaceholders(sql.trim());

  const isInsert = /^insert\s+/i.test(pgSql);
  const hasReturning = /returning\s+/i.test(pgSql);

  if (isInsert && !hasReturning) {
    pgSql += ' RETURNING id';
  }

  try {
    const res = await query(pgSql, params);
    const id = res.rows?.[0]?.id ?? null;
    return {
      id,
      changes: res.rowCount ?? 0,
      rowCount: res.rowCount ?? 0,
    };
  } catch (err) {
    // If appending RETURNING id failed because there's no id column, retry original query
    if (isInsert && !hasReturning && err.message && /column.*id.*does not exist/i.test(err.message)) {
      const fallbackSql = convertPlaceholders(sql.trim());
      const res = await query(fallbackSql, params);
      return {
        id: null,
        changes: res.rowCount ?? 0,
        rowCount: res.rowCount ?? 0,
      };
    }
    throw err;
  }
}

/**
 * Get a single row from PostgreSQL
 * Returns undefined if no row matches (matching SQLite db.get behavior)
 */
export async function get(sql, params = []) {
  const pgSql = convertPlaceholders(sql);
  const res = await query(pgSql, params);
  return res.rows[0] !== undefined ? res.rows[0] : undefined;
}

/**
 * Get all matching rows from PostgreSQL
 * Returns an array of rows
 */
export async function all(sql, params = []) {
  const pgSql = convertPlaceholders(sql);
  const res = await query(pgSql, params);
  return res.rows || [];
}

/**
 * Initialize PostgreSQL schema and indexes (without any example or demo data)
 */
export async function initDatabase() {
  const schemaPath = path.join(__dirname, 'schema.sql');
  try {
    const schemaSql = fs.readFileSync(schemaPath, 'utf8');
    await query(schemaSql);
    console.log('✓ PostgreSQL database initialized with schema and performance indexes (clean, no demo data)');
  } catch (err) {
    console.warn('⚠️ PostgreSQL database initialization warning:', err.message);
  }
}

/**
 * Seed demo data - removed per specification.
 * Preserved as an empty function for backward compatibility.
 */
export async function seedDemoData() {
  // Example/seed data removed per specification. Database initializes clean and empty.
  return Promise.resolve();
}

/**
 * Gracefully close the PostgreSQL pool
 */
export async function closePool() {
  if (pool) {
    await pool.end();
    pool = null;
  }
}

export default {
  getPool,
  getDb,
  run,
  get,
  all,
  query,
  initDatabase,
  seedDemoData,
  closePool,
  convertPlaceholders,
};
