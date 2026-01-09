/**
 * Test script to verify sync services
 */

import { syncEconomicIndicators, syncAssetPrices } from './src/services/sync.service.js';
import { getAllAssets } from './src/services/database.service.js';

console.log('🧪 Starting Sync Test...\n');

// Test 1: Sync Economic Indicators (Free BACEN API)
console.log('Test 1: Syncing Economic Indicators from BACEN...');
try {
  const result = await syncEconomicIndicators();
  console.log('✅ Economic Indicators synced successfully');
  console.log('   Data:', JSON.stringify(result.indicators, null, 2));
} catch (error) {
  console.error('❌ Failed to sync economic indicators:', error.message);
}

console.log('\n---\n');

// Test 2: Get assets from database
console.log('Test 2: Fetching assets from database...');
try {
  const assets = getAllAssets();
  console.log(`✅ Found ${assets.length} assets in database`);
  
  if (assets.length > 0) {
    console.log('   Sample assets:', assets.slice(0, 5).map(a => `${a.code} (${a.market})`).join(', '));
    
    // Test 3: Sync prices for first 3 BR assets
    const brAssets = assets.filter(a => a.market === 'BR').slice(0, 3);
    
    if (brAssets.length > 0) {
      console.log('\n---\n');
      console.log(`Test 3: Syncing prices for ${brAssets.length} Brazilian assets...`);
      const codes = brAssets.map(a => a.code);
      console.log('   Assets:', codes.join(', '));
      
      try {
        const priceResult = await syncAssetPrices(codes);
        console.log('✅ Price sync completed');
        console.log(`   Success: ${priceResult.success.length}/${priceResult.total}`);
        console.log(`   Duration: ${priceResult.duration}ms`);
        
        if (priceResult.failed.length > 0) {
          console.log('   Failed:', priceResult.failed);
        }
      } catch (error) {
        console.error('❌ Failed to sync prices:', error.message);
      }
    }
  } else {
    console.log('⚠ No assets found. You may need to import assets first.');
  }
} catch (error) {
  console.error('❌ Failed to get assets:', error.message);
}

console.log('\n🎉 Sync test complete!');
