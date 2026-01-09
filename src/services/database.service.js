/**
 * Database Service - SQLite3 connection and query management
 * Handles all database operations for DAVI & HYDRA app
 */

import Database from 'better-sqlite3';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Database file path (root of project)
const DB_PATH = path.join(process.cwd(), 'investment-data.db');
const SCHEMA_PATH = path.join(__dirname, '../db/schema.sql');

let db = null;

/**
 * Initialize database connection and create tables if needed
 */
function initDatabase() {
  try {
    // Create database file if it doesn't exist
    db = new Database(DB_PATH, { verbose: console.log });
    
    // Enable foreign keys
    db.pragma('foreign_keys = ON');
    
    // Read and execute schema
    const schema = fs.readFileSync(SCHEMA_PATH, 'utf-8');
    db.exec(schema);
    
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
 * Insert fundamental data
 */
function insertFundamentals(fundamentals) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO fundamentals (
      asset_code, market_cap, pe_ratio, pb_ratio, dividend_yield,
      roe, roa, profit_margin, debt_to_equity, current_ratio,
      nav_per_share, vacancy_rate, p_vpa,
      revenue, revenue_growth, earnings_growth,
      updated_at
    ) VALUES (
      @asset_code, @market_cap, @pe_ratio, @pb_ratio, @dividend_yield,
      @roe, @roa, @profit_margin, @debt_to_equity, @current_ratio,
      @nav_per_share, @vacancy_rate, @p_vpa,
      @revenue, @revenue_growth, @earnings_growth,
      CURRENT_TIMESTAMP
    )
  `);
  
  return stmt.run(fundamentals);
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
      SELECT asset_code, close
      FROM prices
      WHERE date = (SELECT MAX(date) FROM prices WHERE asset_code = assets.code)
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
 */
function filterAssetsByFundamentals(criteria = {}) {
  // This will be implemented to support dynamic filtering
  // criteria example: { min_dy: 6, max_pl: 15, min_roe: 10 }
  return []; 
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
  getLastSync
};
