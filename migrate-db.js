/**
 * Script to add missing columns to the fundamentals table
 * Run this once to update the existing database schema
 */

import Database from 'better-sqlite3';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'investment-data.db');

console.log('📊 Opening database:', DB_PATH);
const db = new Database(DB_PATH);

const newColumns = [
  // Valuation metrics
  'psr REAL',                           // Price/Sales Ratio
  'ev_ebit REAL',                       // EV/EBIT
  'ev_ebitda REAL',                     // EV/EBITDA
  
  // Profitability
  'roic REAL',                          // Return on Invested Capital
  'ebit_margin REAL',                   // EBIT margin %
  
  // Debt & Liquidity
  'net_debt REAL',                      // Dívida Líquida
  'net_equity REAL',                    // Patrimônio Líquido
  
  // Growth
  'revenue_growth_5y REAL',             // Revenue growth 5 years %
  
  // FIIs specific
  'ffo_yield REAL',                     // FFO Yield %
  'cap_rate REAL',                      // Capitalization Rate %
  'liquidity REAL',                     // Liquidez diária média
  'property_count INTEGER',             // Quantidade de imóveis
  'price_per_sqm REAL',                 // Preço por m²
  'rent_per_sqm REAL'                   // Aluguel por m²
];

console.log('🔧 Adding missing columns to fundamentals table...\n');

let addedCount = 0;
let skippedCount = 0;

for (const columnDef of newColumns) {
  const columnName = columnDef.split(' ')[0];
  
  try {
    db.exec(`ALTER TABLE fundamentals ADD COLUMN ${columnDef}`);
    console.log(`✅ Added: ${columnName}`);
    addedCount++;
  } catch (error) {
    if (error.message.includes('duplicate column')) {
      console.log(`⏭️  Skipped (exists): ${columnName}`);
      skippedCount++;
    } else {
      console.error(`❌ Error adding ${columnName}:`, error.message);
    }
  }
}

console.log('\n📊 Summary:');
console.log(`   Added: ${addedCount} columns`);
console.log(`   Skipped: ${skippedCount} columns`);

// Verify columns
console.log('\n🔍 Verifying fundamentals table structure...');
const tableInfo = db.prepare("PRAGMA table_info(fundamentals)").all();
console.log(`   Total columns: ${tableInfo.length}`);

db.close();
console.log('\n✅ Database schema update complete!');
