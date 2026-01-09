/**
 * Test script to initialize and populate the database
 * Run with: node src/scripts/init-database.js
 */

import path from 'path';
import { initDatabase, getAssets } from '../services/database.service.js';
import {
  importAssets,
  importFundamentals,
  importPrices,
  getDatabaseStats
} from '../services/csvImport.service.js';

async function main() {
  console.log('🚀 Starting database initialization...\n');
  
  try {
    // 1. Initialize database (creates tables)
    console.log('📊 Step 1: Creating database and tables...');
    initDatabase();
    console.log('✅ Database created successfully\n');
    
    // 2. Import sample data from CSVs
    const templatesDir = path.join(process.cwd(), 'data-templates');
    
    console.log('📥 Step 2: Importing assets...');
    const assetsResult = await importAssets(path.join(templatesDir, 'assets.csv'));
    console.log(`✅ ${assetsResult.message}`);
    if (assetsResult.errors.length > 0) {
      console.log('⚠️  Errors:', assetsResult.errors);
    }
    console.log('');
    
    console.log('📥 Step 3: Importing fundamentals...');
    const fundamentalsResult = await importFundamentals(path.join(templatesDir, 'fundamentals.csv'));
    console.log(`✅ ${fundamentalsResult.message}`);
    if (fundamentalsResult.errors.length > 0) {
      console.log('⚠️  Errors:', fundamentalsResult.errors);
    }
    console.log('');
    
    console.log('📥 Step 4: Importing prices...');
    const pricesResult = await importPrices(path.join(templatesDir, 'prices.csv'));
    console.log(`✅ ${pricesResult.message}`);
    if (pricesResult.errors.length > 0) {
      console.log('⚠️  Errors:', pricesResult.errors);
    }
    console.log('');
    
    // 3. Display database stats
    console.log('📊 Database Statistics:');
    const stats = getDatabaseStats();
    console.log(`   - Assets: ${stats.assets}`);
    console.log(`   - Fundamentals: ${stats.fundamentals}`);
    console.log(`   - Prices: ${stats.prices}`);
    console.log('');
    
    // 4. Display sample assets
    console.log('📋 Sample Assets:');
    const assets = getAssets();
    assets.slice(0, 5).forEach(asset => {
      console.log(`   ${asset.code} - ${asset.name} (${asset.type})`);
    });
    
    console.log('\n✨ Database initialization complete!');
    console.log('📁 Database file: investment-data.db');
    
  } catch (error) {
    console.error('❌ Error during initialization:', error);
    process.exit(1);
  }
}

// Run the script
main();
