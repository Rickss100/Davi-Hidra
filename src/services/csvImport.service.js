/**
 * CSV Import Service
 * Handles importing data from CSV files into SQLite database
 */

import fs from 'fs';
import csv from 'csv-parser';
import {
  upsertAsset,
  insertFundamentals,
  upsertPrice,
  getDatabase
} from './database.service.js';

/**
 * Import assets from CSV
 * Expected columns: code, name, type, market, sector
 */
async function importAssets(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let rowCount = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        try {
          // Validate required fields
          if (!row.code || !row.name || !row.type || !row.market) {
            errors.push({
              row: rowCount,
              error: 'Missing required fields',
              data: row
            });
            return;
          }
          
          // Insert into database
          upsertAsset({
            code: row.code.trim().toUpperCase(),
            name: row.name.trim(),
            type: row.type.trim().toLowerCase(),
            market: row.market.trim().toUpperCase(),
            sector: row.sector ? row.sector.trim() : null
          });
          
          results.push(row.code);
        } catch (error) {
          errors.push({
            row: rowCount,
            error: error.message,
            data: row
          });
        }
      })
      .on('end', () => {
        resolve({
          success: results.length,
          failed: errors.length,
          errors,
          message: `Imported ${results.length} assets, ${errors.length} failed`
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Import fundamentals from CSV
 * Expected columns: code, market_cap, pe_ratio, pb_ratio, dividend_yield, etc
 */
async function importFundamentals(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let rowCount = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        try {
          if (!row.code) {
            errors.push({
              row: rowCount,
              error: 'Missing asset code',
              data: row
            });
            return;
          }
          
          // Parse numeric fields (empty = null)
          const parseNumber = (val) => val && val.trim() !== '' ? parseFloat(val) : null;
          
          insertFundamentals({
            asset_code: row.code.trim().toUpperCase(),
            market_cap: parseNumber(row.market_cap),
            pe_ratio: parseNumber(row.pe_ratio),
            pb_ratio: parseNumber(row.pb_ratio),
            dividend_yield: parseNumber(row.dividend_yield),
            roe: parseNumber(row.roe),
            roa: parseNumber(row.roa),
            profit_margin: parseNumber(row.profit_margin),
            debt_to_equity: parseNumber(row.debt_to_equity),
            current_ratio: parseNumber(row.current_ratio),
            nav_per_share: parseNumber(row.nav_per_share),
            vacancy_rate: parseNumber(row.vacancy_rate),
            p_vpa: parseNumber(row.p_vpa),
            revenue: parseNumber(row.revenue),
            revenue_growth: parseNumber(row.revenue_growth),
            earnings_growth: parseNumber(row.earnings_growth)
          });
          
          results.push(row.code);
        } catch (error) {
          errors.push({
            row: rowCount,
            error: error.message,
            data: row
          });
        }
      })
      .on('end', () => {
        resolve({
          success: results.length,
          failed: errors.length,
          errors,
          message: `Imported fundamentals for ${results.length} assets, ${errors.length} failed`
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Import prices from CSV
 * Expected columns: code, date, open, high, low, close, volume
 */
async function importPrices(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let rowCount = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        try {
          if (!row.code || !row.date || !row.close) {
            errors.push({
              row: rowCount,
              error: 'Missing required fields (code, date, close)',
              data: row
            });
            return;
          }
          
          const parseNumber = (val) => val && val.trim() !== '' ? parseFloat(val) : null;
          
          upsertPrice({
            asset_code: row.code.trim().toUpperCase(),
            date: row.date.trim(),
            open: parseNumber(row.open),
            high: parseNumber(row.high),
            low: parseNumber(row.low),
            close: parseFloat(row.close),
            volume: row.volume ? parseInt(row.volume) : null
          });
          
          results.push(row.code);
        } catch (error) {
          errors.push({
            row: rowCount,
            error: error.message,
            data: row
          });
        }
      })
      .on('end', () => {
        resolve({
          success: results.length,
          failed: errors.length,
          errors,
          message: `Imported ${results.length} price records, ${errors.length} failed`
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Import transactions from CSV and save to json-server
 * Expected columns: date, code, type, quantity, price, total_value, category, notes
 */
async function importTransactions(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];
    const errors = [];
    let rowCount = 0;
    
    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (row) => {
        rowCount++;
        try {
          if (!row.date || !row.code || !row.type || !row.quantity || !row.price) {
            errors.push({
              row: rowCount,
              error: 'Missing required fields',
              data: row
            });
            return;
          }
          
          // Format for transactionService
          const transaction = {
            date: row.date.trim(),
            code: row.code.trim().toUpperCase(),
            type: row.type.trim().toLowerCase(),
            quantity: parseInt(row.quantity),
            price: parseFloat(row.price),
            totalValue: parseFloat(row.total_value || (parseFloat(row.price) * parseInt(row.quantity))),
            category: row.category.trim().toLowerCase(),
            notes: row.notes || ''
          };
          
          results.push(transaction);
        } catch (error) {
          errors.push({
            row: rowCount,
            error: error.message,
            data: row
          });
        }
      })
      .on('end', () => {
        resolve({
          success: results.length,
          failed: errors.length,
          errors,
          transactions: results,
          message: `Parsed ${results.length} transactions, ${errors.length} failed`
        });
      })
      .on('error', (error) => {
        reject(error);
      });
  });
}

/**
 * Get database statistics
 */
function getDatabaseStats() {
  const db = getDatabase();
  
  const assetsCount = db.prepare('SELECT COUNT(*) as count FROM assets').get();
  const fundamentalsCount = db.prepare('SELECT COUNT(*) as count FROM fundamentals').get();
  const pricesCount = db.prepare('SELECT COUNT(*) as count FROM prices').get();
  const lastSync = db.prepare(`
    SELECT sync_type, completed_at, assets_updated 
    FROM api_sync_log 
    WHERE status = 'success' 
    ORDER BY completed_at DESC 
    LIMIT 5
  `).all();
  
  return {
    assets: assetsCount.count,
    fundamentals: fundamentalsCount.count,
    prices: pricesCount.count,
    lastSyncs: lastSync
  };
}

export {
  importAssets,
  importFundamentals,
  importPrices,
  importTransactions,
  getDatabaseStats
};
