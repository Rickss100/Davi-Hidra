/**
 * Script to sync fundamentals data from Brapi API
 * Run: node sync-fundamentals.js
 */

import Database from 'better-sqlite3';
import fetch from 'node-fetch';
import path from 'path';

// Configuration
const BRAPI_TOKEN = '6AC8B12Ck6WvvTnVEnUoSh';
const DB_PATH = path.join(process.cwd(), 'investment-data.db');
const BATCH_SIZE = 5; // Reduced to avoid 429 rate limiting
const DELAY_MS = 3000; // 3 seconds between batches

console.log('🚀 Starting Brapi Fundamentals Sync');
console.log('📊 Database:', DB_PATH);

const db = new Database(DB_PATH);

// Get all assets from database
const assets = db.prepare(`
  SELECT code, type FROM assets 
  WHERE type IN ('Acao', 'FII')
  ORDER BY code
`).all();

console.log(`📋 Found ${assets.length} assets to sync\n`);

// Prepare insert statement
const insertFundamentals = db.prepare(`
  INSERT INTO fundamentals (
    asset_code, market_cap, pe_ratio, pb_ratio, dividend_yield,
    roe, roa, profit_margin, debt_to_equity, current_ratio,
    roic, ebit_margin, psr, ev_ebit, p_vpa,
    updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

async function fetchBrapiFundamentals(tickers) {
  const tickerList = tickers.join(',');
  const url = `https://brapi.dev/api/quote/${tickerList}?token=${BRAPI_TOKEN}&fundamental=true`;
  
  try {
    const response = await fetch(url);
    
    if (!response.ok) {
      console.error(`  ❌ API Error: ${response.status}`);
      return [];
    }
    
    const data = await response.json();
    return data.results || [];
  } catch (error) {
    console.error(`  ❌ Fetch Error:`, error.message);
    return [];
  }
}

function extractFundamentals(data) {
  // Brapi returns different structures, try to extract what's available
  const financialData = data.financialData || {};
  const summaryProfile = data.summaryProfile || {};
  
  return {
    ticker: data.symbol,
    market_cap: data.marketCap || null,
    pe_ratio: data.priceEarnings || null,
    pb_ratio: data.priceToBook || null,
    dividend_yield: data.dividendYield ? data.dividendYield * 100 : null, // Convert to %
    roe: financialData.returnOnEquity ? financialData.returnOnEquity * 100 : null,
    roa: financialData.returnOnAssets ? financialData.returnOnAssets * 100 : null,
    profit_margin: financialData.profitMargins ? financialData.profitMargins * 100 : null,
    debt_to_equity: financialData.debtToEquity || null,
    current_ratio: financialData.currentRatio || null,
    roic: null, // Brapi doesn't provide ROIC directly
    ebit_margin: financialData.ebitdaMargins ? financialData.ebitdaMargins * 100 : null,
    psr: null, // Need to calculate PSR if needed
    ev_ebit: data.enterpriseToEbitda || null,
    p_vpa: data.priceToBook || null, // Same as P/VP for FIIs
    sector: summaryProfile.sector || null
  };
}

async function syncAll() {
  let successCount = 0;
  let errorCount = 0;
  let batchNum = 0;
  
  // Split into batches
  const batches = [];
  for (let i = 0; i < assets.length; i += BATCH_SIZE) {
    batches.push(assets.slice(i, i + BATCH_SIZE));
  }
  
  console.log(`📦 Processing ${batches.length} batches of up to ${BATCH_SIZE} tickers each\n`);
  
  for (const batch of batches) {
    batchNum++;
    const tickers = batch.map(a => a.code);
    
    console.log(`[Batch ${batchNum}/${batches.length}] Syncing: ${tickers.slice(0, 5).join(', ')}${tickers.length > 5 ? '...' : ''}`);
    
    const results = await fetchBrapiFundamentals(tickers);
    
    for (const result of results) {
      try {
        const fund = extractFundamentals(result);
        
        insertFundamentals.run(
          fund.ticker,
          fund.market_cap,
          fund.pe_ratio,
          fund.pb_ratio,
          fund.dividend_yield,
          fund.roe,
          fund.roa,
          fund.profit_margin,
          fund.debt_to_equity,
          fund.current_ratio,
          fund.roic,
          fund.ebit_margin,
          fund.psr,
          fund.ev_ebit,
          fund.p_vpa
        );
        
        successCount++;
      } catch (error) {
        console.error(`  ⚠️ Error inserting ${result.symbol}:`, error.message);
        errorCount++;
      }
    }
    
    console.log(`  ✅ Got ${results.length} results`);
    
    // Delay between batches
    if (batchNum < batches.length) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  
  console.log('\n📊 Sync Complete!');
  console.log(`   ✅ Success: ${successCount} assets`);
  console.log(`   ❌ Errors: ${errorCount} assets`);
  
  // Verify
  const count = db.prepare('SELECT COUNT(*) as cnt FROM fundamentals').get();
  console.log(`   📈 Total fundamentals records: ${count.cnt}`);
}

// Run sync
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
