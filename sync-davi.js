/**
 * Complete DAVI Sync Script - Sincroniza todos os dados fundamentalistas
 * Usa endpoint fundamental=true que funciona com o token atual
 * 
 * Run: node sync-davi.js
 * Run with limit: node sync-davi.js 20 (syncs only 20 assets)
 */

import Database from 'better-sqlite3';
import fetch from 'node-fetch';
import path from 'path';

// Configuration
const BRAPI_TOKEN = '6AC8B12Ck6WvvTnVEnUoSh';
const DB_PATH = path.join(process.cwd(), 'investment-data.db');
const DELAY_MS = 2000; // 2 seconds between requests (to avoid 429)

// Parse command line args
const MAX_ASSETS = parseInt(process.argv[2]) || 999999;

console.log('🚀 DAVI Complete Sync');
console.log('📊 Database:', DB_PATH);
console.log(`📋 Max assets: ${MAX_ASSETS === 999999 ? 'ALL' : MAX_ASSETS}\n`);

const db = new Database(DB_PATH);

// Get all assets from database
const assets = db.prepare(`
  SELECT code, type, name FROM assets 
  WHERE type IN ('Acao', 'FII')
  ORDER BY code
  LIMIT ?
`).all(MAX_ASSETS);

console.log(`📋 Found ${assets.length} assets to sync\n`);

// Prepare statements
const insertFundamentals = db.prepare(`
  INSERT INTO fundamentals (
    asset_code, market_cap, pe_ratio, pb_ratio, dividend_yield,
    roe, roa, roic, profit_margin, ebit_margin, debt_to_equity, current_ratio,
    psr, ev_ebit, ev_ebitda, net_equity, net_debt, liquidity,
    revenue_growth, revenue_growth_5y, earnings_growth, p_vpa,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

const upsertPrice = db.prepare(`
  INSERT INTO prices (asset_code, date, open, high, low, close, volume)
  VALUES (?, ?, ?, ?, ?, ?, ?)
  ON CONFLICT(asset_code, date) DO UPDATE SET
    open = excluded.open,
    high = excluded.high,
    low = excluded.low,
    close = excluded.close,
    volume = excluded.volume
`);

/**
 * Fetch data from Brapi using fundamental=true
 */
async function fetchBrapi(ticker) {
  const url = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}&fundamental=true`;
  
  try {
    const response = await fetch(url);
    
    if (response.status === 429) {
      console.log(`  ⏳ Rate limited, waiting 10s...`);
      await new Promise(r => setTimeout(r, 10000));
      return fetchBrapi(ticker); // Retry
    }
    
    if (!response.ok) {
      console.log(`  ⚠️ HTTP ${response.status} for ${ticker}`);
      return null;
    }
    
    const data = await response.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

/**
 * Map Brapi response to our database fields
 * Uses basic fundamental=true response
 */
function mapToDAVIFields(data, assetType) {
  const currentPrice = data.regularMarketPrice || null;
  const volume = data.regularMarketVolume || 0;
  
  // Calculate liquidity (2 month estimate)
  const liquidity = volume ? volume * currentPrice * 44 : null;
  
  // For FIIs, priceEarnings is often not available, but priceToBook (P/VP) is key
  const pbRatio = data.priceToBook || null;
  
  return {
    ticker: data.symbol,
    price: currentPrice,
    dayHigh: data.regularMarketDayHigh,
    dayLow: data.regularMarketDayLow,
    volume: volume,
    
    // Fundamentals from basic response
    market_cap: data.marketCap || null,
    pe_ratio: data.priceEarnings || null,
    pb_ratio: pbRatio,
    dividend_yield: data.dividendYield ? data.dividendYield * 100 : null,
    roe: null, // Not in basic response
    roa: null,
    roic: null,
    profit_margin: null,
    ebit_margin: null,
    debt_to_equity: null,
    current_ratio: null,
    psr: null,
    ev_ebit: null,
    ev_ebitda: data.enterpriseToEbitda || null,
    net_equity: null,
    net_debt: null,
    liquidity: liquidity,
    revenue_growth: null,
    revenue_growth_5y: null,
    earnings_growth: null,
    p_vpa: pbRatio,
  };
}

/**
 * Main sync function
 */
async function syncAll() {
  let successCount = 0;
  let errorCount = 0;
  const today = new Date().toISOString().split('T')[0];
  
  for (let i = 0; i < assets.length; i++) {
    const asset = assets[i];
    console.log(`[${i + 1}/${assets.length}] ${asset.code} (${asset.type})...`);
    
    const data = await fetchBrapi(asset.code);
    
    if (data) {
      const mapped = mapToDAVIFields(data, asset.type);
      
      try {
        // Insert fundamentals
        insertFundamentals.run(
          mapped.ticker,
          mapped.market_cap,
          mapped.pe_ratio,
          mapped.pb_ratio,
          mapped.dividend_yield,
          mapped.roe,
          mapped.roa,
          mapped.roic,
          mapped.profit_margin,
          mapped.ebit_margin,
          mapped.debt_to_equity,
          mapped.current_ratio,
          mapped.psr,
          mapped.ev_ebit,
          mapped.ev_ebitda,
          mapped.net_equity,
          mapped.net_debt,
          mapped.liquidity,
          mapped.revenue_growth,
          mapped.revenue_growth_5y,
          mapped.earnings_growth,
          mapped.p_vpa
        );
        
        // Insert/update price
        if (mapped.price) {
          upsertPrice.run(
            mapped.ticker,
            today,
            data.regularMarketOpen || null,
            mapped.dayHigh,
            mapped.dayLow,
            mapped.price,
            mapped.volume
          );
        }
        
        console.log(`  ✅ R$ ${mapped.price?.toFixed(2) || '-'} | P/L: ${mapped.pe_ratio?.toFixed(2) || '-'} | P/VP: ${mapped.pb_ratio?.toFixed(2) || '-'}`);
        successCount++;
      } catch (err) {
        console.log(`  ⚠️ DB Error: ${err.message}`);
        errorCount++;
      }
    } else {
      console.log(`  ⚠️ No data`);
      errorCount++;
    }
    
    // Delay before next request (except for last one)
    if (i < assets.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  
  console.log('\n' + '='.repeat(50));
  console.log('📊 SYNC COMPLETE!');
  console.log(`   ✅ Success: ${successCount}`);
  console.log(`   ❌ Errors: ${errorCount}`);
  console.log('='.repeat(50));
  
  // Stats
  const fundCount = db.prepare('SELECT COUNT(*) as cnt FROM fundamentals WHERE updated_at >= ?').get(today);
  const priceCount = db.prepare('SELECT COUNT(*) as cnt FROM prices WHERE date = ?').get(today);
  console.log(`\n📈 Records updated today:`);
  console.log(`   Fundamentals: ${fundCount.cnt}`);
  console.log(`   Prices: ${priceCount.cnt}`);
}

// Run
syncAll()
  .then(() => {
    db.close();
    console.log('\n✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('Fatal error:', err);
    db.close();
    process.exit(1);
  });
