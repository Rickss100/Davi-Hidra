/**
 * Slow sync - 1 ticker at a time to avoid 429
 * Run: node sync-slow.js
 */

import Database from 'better-sqlite3';
import fetch from 'node-fetch';
import path from 'path';

const BRAPI_TOKEN = '6AC8B12Ck6WvvTnVEnUoSh';
const DB_PATH = path.join(process.cwd(), 'investment-data.db');
const DELAY_MS = 5000; // 5 seconds between requests

// Top priority tickers to sync first
const PRIORITY_TICKERS = [
  // Blue chips
  'PETR4', 'VALE3', 'ITUB4', 'BBDC4', 'BBAS3', 'WEGE3', 'ABEV3', 'RENT3',
  'LREN3', 'JBSS3', 'SUZB3', 'GGBR4', 'CSNA3', 'BPAC11', 'RADL3',
  // FIIs populares
  'MXRF11', 'HGLG11', 'KNRI11', 'XPML11', 'VISC11', 'BTLG11', 'VGIR11',
  'KNCR11', 'CPTS11', 'XPLG11', 'IRDM11', 'URPR11', 'BCFF11', 'HGBS11'
];

console.log('🚀 Slow Sync - 1 ticker at a time');
console.log(`📋 Syncing ${PRIORITY_TICKERS.length} priority tickers\n`);

const db = new Database(DB_PATH);

const insertFundamentals = db.prepare(`
  INSERT INTO fundamentals (
    asset_code, market_cap, pe_ratio, pb_ratio, dividend_yield,
    roe, roa, profit_margin, debt_to_equity, current_ratio,
    roic, ebit_margin, psr, ev_ebit, p_vpa, updated_at
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
`);

async function fetchOne(ticker) {
  const url = `https://brapi.dev/api/quote/${ticker}?token=${BRAPI_TOKEN}&fundamental=true`;
  
  try {
    const response = await fetch(url);
    
    if (response.status === 429) {
      console.log(`  ⏳ Rate limited, waiting 10s...`);
      await new Promise(r => setTimeout(r, 10000));
      return fetchOne(ticker); // Retry
    }
    
    if (!response.ok) {
      console.log(`  ⚠️ Error ${response.status} for ${ticker}`);
      return null;
    }
    
    const data = await response.json();
    return data.results?.[0] || null;
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}`);
    return null;
  }
}

async function run() {
  let success = 0;
  
  for (let i = 0; i < PRIORITY_TICKERS.length; i++) {
    const ticker = PRIORITY_TICKERS[i];
    console.log(`[${i + 1}/${PRIORITY_TICKERS.length}] Fetching ${ticker}...`);
    
    const data = await fetchOne(ticker);
    
    if (data) {
      const fin = data.financialData || {};
      
      try {
        insertFundamentals.run(
          data.symbol,
          data.marketCap || null,
          data.priceEarnings || null,
          data.priceToBook || null,
          data.dividendYield ? data.dividendYield * 100 : null,
          fin.returnOnEquity ? fin.returnOnEquity * 100 : null,
          fin.returnOnAssets ? fin.returnOnAssets * 100 : null,
          fin.profitMargins ? fin.profitMargins * 100 : null,
          fin.debtToEquity || null,
          fin.currentRatio || null,
          null, // roic
          fin.ebitdaMargins ? fin.ebitdaMargins * 100 : null,
          null, // psr
          data.enterpriseToEbitda || null,
          data.priceToBook || null
        );
        console.log(`  ✅ Saved ${ticker}`);
        success++;
      } catch (err) {
        console.log(`  ⚠️ DB Error: ${err.message}`);
      }
    }
    
    // Delay before next request
    if (i < PRIORITY_TICKERS.length - 1) {
      await new Promise(r => setTimeout(r, DELAY_MS));
    }
  }
  
  console.log(`\n✅ Done! Saved ${success} of ${PRIORITY_TICKERS.length} tickers`);
  db.close();
}

run().catch(err => {
  console.error('Fatal:', err);
  db.close();
  process.exit(1);
});
