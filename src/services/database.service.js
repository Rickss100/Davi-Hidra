/**
 * Database Service - SQLite3 connection and query management
 * Handles all database operations for DAVI & HYDRA app
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { syncUserToTurso, syncUserDeleteToTurso } from './turso.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path (root of project)
const DB_PATH = path.join(process.cwd(), 'investment-data.db');
const SEED_PATH = path.join(__dirname, '../db/seed-investment-data.db');
const SCHEMA_PATH = path.join(__dirname, '../db/schema.sql');

let db = null;

/**
 * Initialize database connection and create tables if needed
 */
function initDatabase() {
  try {
    // Se o banco principal ainda não existir no ambiente de deploy, restaurar do seed
    if (!fs.existsSync(DB_PATH) && fs.existsSync(SEED_PATH)) {
      console.log('🌱 Inicializando banco a partir da base seed pré-carregada com 1.500+ ativos...');
      fs.copyFileSync(SEED_PATH, DB_PATH);
    }

    // Create database connection
    db = new Database(DB_PATH, { verbose: console.log });
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Read and execute schema
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);

    // Migration: Add user_id column to transactions if it doesn't exist
    try {
      const transCols = db.pragma('table_info(transactions)');
      if (!transCols.some(c => c.name === 'user_id')) {
        db.exec('ALTER TABLE transactions ADD COLUMN user_id INTEGER DEFAULT 1');
        console.log('✅ Column user_id added to transactions');
      }
    } catch (migErr) {
      console.warn('⚠️ Migration check for user_id:', migErr.message);
    }

    // Migration: Add Renda Fixa columns to fundamentals if they don't exist
    try {
      const fundCols = db.pragma('table_info(fundamentals)');
      const colNames = fundCols.map(c => c.name);
      
      const newCols = [
        { name: 'indexer', type: 'TEXT' },
        { name: 'rate_fixed', type: 'REAL' },
        { name: 'rate_description', type: 'TEXT' },
        { name: 'maturity_date', type: 'TEXT' },
        { name: 'liquidity_type', type: 'TEXT' },
        { name: 'guarantee', type: 'TEXT' },
        { name: 'tax_free', type: 'INTEGER DEFAULT 0' },
        { name: 'min_investment', type: 'REAL' }
      ];

      for (const col of newCols) {
        if (!colNames.includes(col.name)) {
          db.exec(`ALTER TABLE fundamentals ADD COLUMN ${col.name} ${col.type}`);
          console.log(`✅ Column ${col.name} added to fundamentals`);
        }
      }
    } catch (fundMigErr) {
      console.warn('⚠️ Migration check for fundamentals Renda Fixa:', fundMigErr.message);
    }

    // Migration: Add plan_period and plan_expires_at to users if they don't exist
    try {
      const userCols = db.pragma('table_info(users)');
      const userColNames = userCols.map(c => c.name);
      if (!userColNames.includes('plan_period')) {
        db.exec("ALTER TABLE users ADD COLUMN plan_period TEXT NOT NULL DEFAULT 'lifetime'");
        console.log('✅ Column plan_period added to users');
      }
      if (!userColNames.includes('plan_expires_at')) {
        db.exec("ALTER TABLE users ADD COLUMN plan_expires_at DATETIME DEFAULT NULL");
        console.log('✅ Column plan_expires_at added to users');
      }
      db.exec("CREATE INDEX IF NOT EXISTS idx_users_plan_expires ON users(plan_expires_at)");
    } catch (uMigErr) {
      console.warn('⚠️ Migration check for users table:', uMigErr.message);
    }

    // Seed default users if users table is empty
    try {
      const userCount = db.prepare('SELECT COUNT(*) as count FROM users').get();
      if (!userCount || userCount.count === 0) {
        console.log('🌱 Seeding initial users into SQLite...');
        const insertUser = db.prepare(`
          INSERT INTO users (email, password, name, role, status)
          VALUES (?, ?, ?, ?, ?)
        `);

        insertUser.run('admin@davi.com', '123', 'Admin User', 'admin', 'active');
        insertUser.run('user@davi.com', '123', 'Investidor Padrão', 'user', 'active');
        insertUser.run('123', '123', 'Usuário Teste', 'user', 'active');
        console.log('✅ Default users seeded successfully');
      }
    } catch (seedErr) {
      console.warn('⚠️ User seed error:', seedErr.message);
    }
    
    console.log('✅ Database initialized successfully at:', DB_PATH);
    return db;
  } catch (error) {
    console.error('❌ Database initialization failed:', error);
    throw error;
  }
}

/**
 * Get database instance (singleton pattern)
 */
function getDatabase() {
  if (!db) {
    return initDatabase();
  }
  return db;
}

/**
 * Close database connection
 */
function closeDatabase() {
  if (db) {
    db.close();
    db = null;
    console.log('Database connection closed');
  }
}

// ============================================================================
// ASSETS OPERATIONS
// ============================================================================

/**
 * Insert or update an asset
 */
function upsertAsset(asset) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO assets (code, name, type, market, sector, last_updated)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(code) DO UPDATE SET
      name = excluded.name,
      type = excluded.type,
      market = excluded.market,
      sector = excluded.sector,
      last_updated = CURRENT_TIMESTAMP
  `);
  
  return stmt.run(
    asset.code,
    asset.name,
    asset.type,
    asset.market,
    asset.sector
  );
}

/**
 * Get all assets or filter by type/market
 */
function getAssets(filters = {}) {
  const db = getDatabase();
  let query = 'SELECT * FROM assets WHERE 1=1';
  const params = [];
  
  if (filters.type) {
    query += ' AND type = ?';
    params.push(filters.type);
  }
  
  if (filters.market) {
    query += ' AND market = ?';
    params.push(filters.market);
  }
  
  query += ' ORDER BY code';
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

/**
 * Get assets prioritized by oldest update time
 */
function getAssetsToSync(limit = 50, type = null) {
  const db = getDatabase();
  let query = `
    SELECT a.code, a.type, f.updated_at
    FROM assets a
    LEFT JOIN fundamentals f ON a.code = f.asset_code
    WHERE 1=1
  `;
  
  const params = [];
  
  if (type) {
    query += ' AND a.type = ?';
    params.push(type);
  }
  
  // Order by updated_at ASC (NULLs first usually, but let's be explicit)
  // NULL updated_at means never synced, so they should come first
  query += `
    ORDER BY 
      CASE WHEN f.updated_at IS NULL THEN 0 ELSE 1 END,
      f.updated_at ASC
    LIMIT ?
  `;
  params.push(limit);
  
  const stmt = db.prepare(query);
  return stmt.all(...params);
}

/**
 * Get single asset by code
 */
function getAsset(code) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM assets WHERE code = ?');
  return stmt.get(code);
}

// ============================================================================
// FUNDAMENTALS OPERATIONS
// ============================================================================

/**
 * Insert or update fundamental data with all Radar metrics
 */
function insertFundamentals(f) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO fundamentals (
      asset_code, market_cap, pe_ratio, pb_ratio, psr, dividend_yield,
      ev_ebit, ev_ebitda, ebit_margin, profit_margin, current_ratio,
      roic, roe, liquidity, net_equity, debt_to_equity, revenue_growth_5y,
      nav_per_share, vacancy_rate, p_vpa, ffo_yield, cap_rate,
      property_count, price_per_sqm, rent_per_sqm,
      revenue, revenue_growth, earnings_growth,
      indexer, rate_fixed, rate_description, maturity_date, liquidity_type, guarantee, tax_free, min_investment,
      updated_at
    ) VALUES (
      @asset_code, @market_cap, @pe_ratio, @pb_ratio, @psr, @dividend_yield,
      @ev_ebit, @ev_ebitda, @ebit_margin, @profit_margin, @current_ratio,
      @roic, @roe, @liquidity, @net_equity, @debt_to_equity, @revenue_growth_5y,
      @nav_per_share, @vacancy_rate, @p_vpa, @ffo_yield, @cap_rate,
      @property_count, @price_per_sqm, @rent_per_sqm,
      @revenue, @revenue_growth, @earnings_growth,
      @indexer, @rate_fixed, @rate_description, @maturity_date, @liquidity_type, @guarantee, @tax_free, @min_investment,
      CURRENT_TIMESTAMP
    )
  `);
  
  return stmt.run({
    asset_code: f.asset_code,
    market_cap: f.market_cap ?? null,
    pe_ratio: f.pe_ratio ?? null,
    pb_ratio: f.pb_ratio ?? null,
    psr: f.psr ?? null,
    dividend_yield: f.dividend_yield ?? null,
    ev_ebit: f.ev_ebit ?? null,
    ev_ebitda: f.ev_ebitda ?? null,
    ebit_margin: f.ebit_margin ?? null,
    profit_margin: f.profit_margin ?? null,
    current_ratio: f.current_ratio ?? null,
    roic: f.roic ?? null,
    roe: f.roe ?? null,
    liquidity: f.liquidity ?? null,
    net_equity: f.net_equity ?? null,
    debt_to_equity: f.debt_to_equity ?? null,
    revenue_growth_5y: f.revenue_growth_5y ?? null,
    nav_per_share: f.nav_per_share ?? null,
    vacancy_rate: f.vacancy_rate ?? null,
    p_vpa: f.p_vpa ?? null,
    ffo_yield: f.ffo_yield ?? null,
    cap_rate: f.cap_rate ?? null,
    property_count: f.property_count ?? null,
    price_per_sqm: f.price_per_sqm ?? null,
    rent_per_sqm: f.rent_per_sqm ?? null,
    revenue: f.revenue ?? null,
    revenue_growth: f.revenue_growth ?? null,
    earnings_growth: f.earnings_growth ?? null,
    indexer: f.indexer ?? null,
    rate_fixed: f.rate_fixed ?? null,
    rate_description: f.rate_description ?? null,
    maturity_date: f.maturity_date ?? null,
    liquidity_type: f.liquidity_type ?? null,
    guarantee: f.guarantee ?? null,
    tax_free: f.tax_free ?? 0,
    min_investment: f.min_investment ?? null
  });
}

/**
 * Merge new data into existing fundamentals without overwriting good data with nulls
 */
function mergeFundamentals(f) {
  const db = getDatabase();
  const existing = getLatestFundamentals(f.asset_code);
  
  if (!existing) {
    return insertFundamentals(f);
  }

  const merged = {
    ...existing,
    ...f,
    // Garante que só sobrescreve se o novo valor não for nulo/indefinido
    pe_ratio: f.pe_ratio !== undefined && f.pe_ratio !== null ? f.pe_ratio : existing.pe_ratio,
    pb_ratio: f.pb_ratio !== undefined && f.pb_ratio !== null ? f.pb_ratio : existing.pb_ratio,
    p_vpa: f.p_vpa !== undefined && f.p_vpa !== null ? f.p_vpa : (f.pb_ratio ?? existing.p_vpa),
    dividend_yield: f.dividend_yield !== undefined && f.dividend_yield !== null ? f.dividend_yield : existing.dividend_yield,
    market_cap: f.market_cap !== undefined && f.market_cap !== null ? f.market_cap : existing.market_cap,
    roe: f.roe !== undefined && f.roe !== null ? f.roe : existing.roe,
    profit_margin: f.profit_margin !== undefined && f.profit_margin !== null ? f.profit_margin : existing.profit_margin,
    ebit_margin: f.ebit_margin !== undefined && f.ebit_margin !== null ? f.ebit_margin : existing.ebit_margin,
    current_ratio: f.current_ratio !== undefined && f.current_ratio !== null ? f.current_ratio : existing.current_ratio,
    debt_to_equity: f.debt_to_equity !== undefined && f.debt_to_equity !== null ? f.debt_to_equity : existing.debt_to_equity,
    indexer: f.indexer !== undefined && f.indexer !== null ? f.indexer : existing.indexer,
    rate_fixed: f.rate_fixed !== undefined && f.rate_fixed !== null ? f.rate_fixed : existing.rate_fixed,
    rate_description: f.rate_description !== undefined && f.rate_description !== null ? f.rate_description : existing.rate_description,
    maturity_date: f.maturity_date !== undefined && f.maturity_date !== null ? f.maturity_date : existing.maturity_date,
    liquidity_type: f.liquidity_type !== undefined && f.liquidity_type !== null ? f.liquidity_type : existing.liquidity_type,
    guarantee: f.guarantee !== undefined && f.guarantee !== null ? f.guarantee : existing.guarantee,
    tax_free: f.tax_free !== undefined && f.tax_free !== null ? f.tax_free : existing.tax_free,
    min_investment: f.min_investment !== undefined && f.min_investment !== null ? f.min_investment : existing.min_investment,
  };

  return insertFundamentals(merged);
}

/**
 * Get latest fundamentals for an asset
 */
function getLatestFundamentals(assetCode) {
  const db = getDatabase();
  const stmt = db.prepare('SELECT * FROM fundamentals WHERE asset_code = ? ORDER BY updated_at DESC LIMIT 1');
  return stmt.get(assetCode);
}

/**
 * Get all fundamentals (latest per asset)
 */
function getAllFundamentals() {
  const db = getDatabase();
  const stmt = db.prepare(`
    SELECT f.*
    FROM fundamentals f
    INNER JOIN (
      SELECT asset_code, MAX(updated_at) as max_updated
      FROM fundamentals
      GROUP BY asset_code
    ) latest ON f.asset_code = latest.asset_code AND f.updated_at = latest.max_updated
  `);
  return stmt.all();
}

/**
 * Get assets joined with their latest fundamentals
 * Useful for the main Radar view
 */
function getAssetsWithFundamentals(filters = {}) {
  const db = getDatabase();
  let query = `
    SELECT 
      a.code, a.name, a.type, a.market, a.sector,
      f.*,
      f.updated_at as fundamentals_updated
    FROM assets a
    LEFT JOIN (
      SELECT f1.*
      FROM fundamentals f1
      INNER JOIN (
        SELECT asset_code, MAX(updated_at) as max_updated
        FROM fundamentals
        GROUP BY asset_code
      ) f2 ON f1.asset_code = f2.asset_code AND f1.updated_at = f2.max_updated
    ) f ON a.code = f.asset_code
    WHERE 1=1
  `;
  
  const params = [];
  
  if (filters.type) {
    query += ' AND a.type = ?';
    params.push(filters.type);
  }
  
  // Exclude assets with critical missing data if strict mode (optional)
  
  query += ' ORDER BY a.code';
  
  return db.prepare(query).all(...params);
}

function getAssetsWithFundamentalsAndNotes(filters = {}) {
  const db = getDatabase();
  let query = `
    SELECT 
      a.code, a.name, a.type, a.market, a.sector,
      f.*,
      f.updated_at as fundamentals_updated,
      p.close as price,
      un.rating as user_rating,
      un.notes as user_notes
    FROM assets a
    LEFT JOIN (
      SELECT f1.*
      FROM fundamentals f1
      INNER JOIN (
        SELECT asset_code, MAX(updated_at) as max_updated
        FROM fundamentals
        GROUP BY asset_code
      ) f2 ON f1.asset_code = f2.asset_code AND f1.updated_at = f2.max_updated
    ) f ON a.code = f.asset_code
    LEFT JOIN (
      SELECT p1.asset_code, p1.close
      FROM prices p1
      INNER JOIN (
        SELECT asset_code, MAX(date) as max_date
        FROM prices
        GROUP BY asset_code
      ) p2 ON p1.asset_code = p2.asset_code AND p1.date = p2.max_date
    ) p ON a.code = p.asset_code
    LEFT JOIN user_asset_notes un ON a.code = un.asset_code
    WHERE 1=1
  `;
  
  const params = [];
  
  if (filters.type) {
    query += ' AND a.type = ?';
    params.push(filters.type);
  }
  
  query += ' ORDER BY a.code';
  
  return db.prepare(query).all(...params);
}

/**
 * Filter assets by fundamental criteria (DAVI method)
 * Supports dynamic min/max filters for any fundamental column
 */
function filterAssetsByFundamentals(type, criteria = {}) {
  const db = getDatabase();
  
  // Map filter keys to their actual SQL column (and which table)
  const columnMap = {
    pe_ratio: 'f.pe_ratio',
    pb_ratio: 'f.pb_ratio',
    psr: 'f.psr',
    ev_ebit: 'f.ev_ebit',
    ev_ebitda: 'f.ev_ebitda',
    dividend_yield: 'f.dividend_yield',
    roe: 'f.roe',
    roa: 'f.roa',
    roic: 'f.roic',
    ebit_margin: 'f.ebit_margin',
    profit_margin: 'f.profit_margin',
    current_ratio: 'f.current_ratio',
    debt_to_equity: 'f.debt_to_equity',
    net_debt_ebitda: 'f.net_debt',  // approximate mapping
    revenue_growth: 'f.revenue_growth',
    revenue_growth_5y: 'f.revenue_growth_5y',
    earnings_growth: 'f.earnings_growth',
    market_cap: 'f.market_cap',
    p_vpa: 'f.p_vpa',
    vacancy_rate: 'f.vacancy_rate',
    ffo_yield: 'f.ffo_yield',
    cap_rate: 'f.cap_rate',
    liquidity: 'f.liquidity',
    property_count: 'f.property_count',
    price_per_sqm: 'f.price_per_sqm',
    rent_per_sqm: 'f.rent_per_sqm',
    net_equity: 'f.net_equity',
    user_rating: 'un.rating',
    rate_fixed: 'f.rate_fixed',
    tax_free: 'f.tax_free',
    min_investment: 'f.min_investment',
  };

  let query = `
    SELECT 
      a.code, a.name, a.type, a.market, a.sector,
      f.*,
      f.updated_at as fundamentals_updated,
      p.close as price,
      un.rating as user_rating,
      un.notes as user_notes
    FROM assets a
    LEFT JOIN (
      SELECT f1.*
      FROM fundamentals f1
      INNER JOIN (
        SELECT asset_code, MAX(updated_at) as max_updated
        FROM fundamentals
        GROUP BY asset_code
      ) f2 ON f1.asset_code = f2.asset_code AND f1.updated_at = f2.max_updated
    ) f ON a.code = f.asset_code
    LEFT JOIN (
      SELECT p1.asset_code, p1.close
      FROM prices p1
      INNER JOIN (
        SELECT asset_code, MAX(date) as max_date
        FROM prices
        GROUP BY asset_code
      ) p2 ON p1.asset_code = p2.asset_code AND p1.date = p2.max_date
    ) p ON a.code = p.asset_code
    LEFT JOIN user_asset_notes un ON a.code = un.asset_code
    WHERE 1=1
  `;

  const params = [];

  // Filter by asset type
  if (type) {
    query += ' AND a.type = ?';
    params.push(type);
  }

  // Apply dynamic filters
  for (const [key, filter] of Object.entries(criteria)) {
    const col = columnMap[key];
    if (!col) continue; // Skip unknown filter keys

    if (filter.min !== undefined && filter.min !== null) {
      query += ` AND ${col} >= ?`;
      params.push(filter.min);
    }
    if (filter.max !== undefined && filter.max !== null) {
      query += ` AND ${col} <= ?`;
      params.push(filter.max);
    }
  }

  query += ' ORDER BY a.code';

  return db.prepare(query).all(...params);
}

// ============================================================================
// USER NOTES OPERATIONS
// ============================================================================

function getUserNotes(assetCode) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM user_asset_notes WHERE asset_code = ?').get(assetCode);
}

function getAllUserNotes() {
  const db = getDatabase();
  return db.prepare('SELECT * FROM user_asset_notes').all();
}

function upsertUserNotes(assetCode, rating, notes) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO user_asset_notes (asset_code, rating, notes, updated_at)
    VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    ON CONFLICT(asset_code) DO UPDATE SET
      rating = excluded.rating,
      notes = excluded.notes,
      updated_at = CURRENT_TIMESTAMP
  `);
  return stmt.run(assetCode, rating, notes);
}

// ============================================================================
// PRICES OPERATIONS
// ============================================================================

/**
 * Insert or update price
 */
function upsertPrice(priceData) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO prices (asset_code, date, open, high, low, close, volume)
    VALUES (@asset_code, @date, @open, @high, @low, @close, @volume)
    ON CONFLICT(asset_code, date) DO UPDATE SET
      open = excluded.open,
      high = excluded.high,
      low = excluded.low,
      close = excluded.close,
      volume = excluded.volume
  `);
  
  return stmt.run(priceData);
}

function getLatestPrice(assetCode) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM prices WHERE asset_code = ? ORDER BY date DESC LIMIT 1').get(assetCode);
}

function getPriceHistory(assetCode, limit = 30) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM prices WHERE asset_code = ? ORDER BY date DESC LIMIT ?').all(assetCode, limit);
}

function bulkInsertPrices(prices) {
  const db = getDatabase();
  const insert = db.prepare(`
    INSERT INTO prices (asset_code, date, open, high, low, close, volume)
    VALUES (@asset_code, @date, @open, @high, @low, @close, @volume)
    ON CONFLICT(asset_code, date) DO UPDATE SET
      close = excluded.close,
      volume = excluded.volume
  `);

  const insertMany = db.transaction((prices) => {
    for (const price of prices) insert.run(price);
  });

  return insertMany(prices);
}

// ============================================================================
// ECONOMIC INDICATORS & LOGS
// ============================================================================

function upsertEconomicIndicator(indicator) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO economic_indicators (indicator, date, value)
    VALUES (?, ?, ?)
    ON CONFLICT(indicator, date) DO UPDATE SET value = excluded.value
  `);
  return stmt.run(indicator.name, indicator.date, indicator.value);
}

function getLatestIndicator(name) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM economic_indicators WHERE indicator = ? ORDER BY date DESC LIMIT 1').get(name);
}

function logSync(type, source, count, status, error = null) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO api_sync_log (sync_type, api_source, assets_updated, status, error_message, completed_at)
    VALUES (?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
  `);
  return stmt.run(type, source, count, status, error);
}

function getLastSync(type) {
  const db = getDatabase();
  return db.prepare('SELECT * FROM api_sync_log WHERE sync_type = ? ORDER BY started_at DESC LIMIT 1').get(type);
}

// ============================================================================
// USER MANAGEMENT OPERATIONS (SUPERUSER & AUTH)
// ============================================================================

function enrichUserWithPlan(user) {
  if (!user) return null;
  const now = new Date();
  const isExpired = user.plan_expires_at && user.plan_period !== 'lifetime' && new Date(user.plan_expires_at) < now;
  return {
    ...user,
    plan_period: user.plan_period || 'lifetime',
    isPlanExpired: !!isExpired
  };
}

function getUserByEmail(email) {
  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(email.trim());
  return enrichUserWithPlan(user);
}

function getUserById(id) {
  const db = getDatabase();
  const user = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  return enrichUserWithPlan(user);
}

function getAllUsers() {
  const db = getDatabase();
  const users = db.prepare(`
    SELECT 
      u.id, 
      u.email, 
      u.name, 
      u.role, 
      u.status, 
      u.plan_period,
      u.plan_expires_at,
      u.created_at, 
      u.updated_at,
      u.password,
      COUNT(t.id) as total_transactions,
      COALESCE(SUM(t.total_value), 0) as total_volume
    FROM users u
    LEFT JOIN transactions t ON u.id = t.user_id
    GROUP BY u.id
    ORDER BY u.id ASC
  `).all();

  const now = new Date();
  return users.map(u => {
    const isExpired = u.plan_expires_at && u.plan_period !== 'lifetime' && new Date(u.plan_expires_at) < now;
    return {
      ...u,
      plan_period: u.plan_period || 'lifetime',
      isPlanExpired: !!isExpired
    };
  });
}

function createUser({ 
  email, 
  password, 
  name, 
  role = 'user', 
  status = 'active',
  plan_period = 'lifetime',
  plan_expires_at = null 
}) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO users (email, password, name, role, status, plan_period, plan_expires_at, created_at, updated_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
  `);
  const info = stmt.run(email, password, name, role, status, plan_period || 'lifetime', plan_expires_at || null);
  const newUser = db.prepare('SELECT * FROM users WHERE id = ?').get(info.lastInsertRowid);
  
  // Sincronizar criação na nuvem Turso se ativo
  syncUserToTurso(newUser).catch(err => console.warn('⚠️ Turso syncUser error:', err.message));
  
  return newUser;
}

function updateUser(id, { name, email, password, role, status, plan_period, plan_expires_at }) {
  const db = getDatabase();
  const existing = db.prepare('SELECT * FROM users WHERE id = ?').get(id);
  if (!existing) return null;

  const newName = name !== undefined ? name : existing.name;
  const newEmail = email !== undefined ? email : existing.email;
  const newPassword = password !== undefined && password.trim() !== '' ? password : existing.password;
  const newRole = role !== undefined ? role : existing.role;
  const newStatus = status !== undefined ? status : existing.status;
  const newPeriod = plan_period !== undefined ? plan_period : (existing.plan_period || 'lifetime');
  const newExpiresAt = plan_expires_at !== undefined ? plan_expires_at : existing.plan_expires_at;

  db.prepare(`
    UPDATE users 
    SET name = ?, email = ?, password = ?, role = ?, status = ?, plan_period = ?, plan_expires_at = ?, updated_at = CURRENT_TIMESTAMP
    WHERE id = ?
  `).run(newName, newEmail, newPassword, newRole, newStatus, newPeriod, newExpiresAt, id);

  const updatedUser = db.prepare('SELECT * FROM users WHERE id = ?').get(id);

  // Sincronizar atualização na nuvem Turso se ativo
  syncUserToTurso(updatedUser).catch(err => console.warn('⚠️ Turso syncUserUpdate error:', err.message));

  return updatedUser;
}

function deleteUser(id) {
  const db = getDatabase();
  // Não permitir deletar o id 1 (Super Admin inicial)
  if (Number(id) === 1) {
    throw new Error('Não é permitido excluir o Administrador principal.');
  }

  // Sincronizar exclusão na nuvem Turso se ativo
  syncUserDeleteToTurso(id).catch(err => console.warn('⚠️ Turso syncUserDelete error:', err.message));

  return db.prepare('DELETE FROM users WHERE id = ?').run(id);
}

function getUserTransactions(userId) {
  const db = getDatabase();
  return db.prepare(`
    SELECT t.*, a.type as category, a.name as asset_name
    FROM transactions t
    LEFT JOIN assets a ON t.asset_code = a.code
    WHERE t.user_id = ?
    ORDER BY t.date DESC
  `).all(userId);
}

export {
  initDatabase,
  getDatabase,
  closeDatabase,
  
  // Assets
  upsertAsset,
  getAssets,
  getAssetsToSync,
  getAsset,
  getAssetsWithFundamentals,
  getAssetsWithFundamentalsAndNotes,
  filterAssetsByFundamentals,
  
  // User Notes
  getUserNotes,
  getAllUserNotes,
  upsertUserNotes,
  
  // Fundamentals
  insertFundamentals,
  mergeFundamentals,
  getLatestFundamentals,
  getAllFundamentals,
  
  // Prices
  upsertPrice,
  getLatestPrice,
  getPriceHistory,
  bulkInsertPrices,
  
  // Economic Indicators
  upsertEconomicIndicator,
  getLatestIndicator,
  
  // Sync logs
  logSync,
  getLastSync,

  // Users (Superuser & Auth)
  getUserByEmail,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserTransactions
};

