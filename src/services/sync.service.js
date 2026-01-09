/**
 * Sync Service - Coordinates data synchronization from external APIs to SQLite
 * Handles Brapi (BR stocks/FIIs), Alpha Vantage (US stocks/REITs), and BACEN (economic indicators)
 */

import { getBrapiQuote, getBrapiFundamentals, isFreeTicker } from './brapi.service.js';
import { getAVQuote, getAVOverview, setAlphaVantageKey } from './alphavantage.service.js';
import { getEconomicSnapshot, getLatestBacenIndicator } from './bacen.service.js';
import { 
  getAsset,
  upsertPrice, 
  insertFundamentals,
  upsertEconomicIndicator,
  logSync 
} from './database.service.js';

// API Keys (can be overridden via environment variables)
let BRAPI_TOKEN = process.env.BRAPI_TOKEN || null;
let AV_KEY = process.env.ALPHA_VANTAGE_KEY || 'demo';

setAlphaVantageKey(AV_KEY);

/**
 * Set API tokens programmatically
 */
export function setApiTokens({ brapiToken, alphaVantageKey }) {
  if (brapiToken) BRAPI_TOKEN = brapiToken;
  if (alphaVantageKey) {
    AV_KEY = alphaVantageKey;
    setAlphaVantageKey(alphaVantageKey);
  }
}

/**
 * Sync prices for multiple assets
 * @param {string[]} assetCodes - Array of asset codes
 * @returns {Promise<Object>} Sync result with stats
 */
export async function syncAssetPrices(assetCodes) {
  const startTime = new Date();
  const results = {
    success: [],
    failed: [],
    total: assetCodes.length
  };
  
  for (const code of assetCodes) {
    try {
      // Get asset info to determine market
      const asset = getAsset(code.toUpperCase());
      
      if (!asset) {
        console.warn(`Asset ${code} not found in database. Skipping.`);
        results.failed.push({ code, error: 'Asset not found' });
        continue;
      }
      
      let priceData = null;
      
      // Sync based on market
      if (asset.market === 'BR') {
        priceData = await syncBRPrice(code, asset);
      } else if (asset.market === 'US') {
        priceData = await syncUSPrice(code, asset);
      }
      
      if (priceData) {
        results.success.push(code);
      } else {
        results.failed.push({ code, error: 'No data returned' });
      }
      
    } catch (error) {
      console.error(`Error syncing price for ${code}:`, error.message);
      results.failed.push({ code, error: error.message });
    }
  }
  
  // Log sync operation
  logSync({
    sync_type: 'prices',
    api_source: 'brapi+alphavantage',
    assets_updated: results.success.length,
    status: results.failed.length === 0 ? 'success' : 'partial',
    error_message: results.failed.length > 0 ? JSON.stringify(results.failed) : null
  });
  
  return {
    ...results,
    duration: Date.now() - startTime.getTime()
  };
}

/**
 * Sync price for Brazilian asset (Brapi)
 */
async function syncBRPrice(code, asset) {
  const quote = await getBrapiQuote(code, BRAPI_TOKEN);
  
  if (!quote) return null;
  
  // Format for SQLite
  const priceData = {
    asset_code: code.toUpperCase(),
    date: new Date().toISOString().split('T')[0], // Today's date
    open: null, // Brapi GLOBAL_QUOTE doesn't have open
    high: quote.dayHigh,
    low: quote.dayLow,
    close: quote.price,
    volume: quote.volume
  };
  
  upsertPrice(priceData);
  console.log(`✅ Synced price for ${code}: R$ ${quote.price}`);
  
  return priceData;
}

/**
 * Sync price for US asset (Alpha Vantage)
 */
async function syncUSPrice(code, asset) {
  const quote = await getAVQuote(code);
  
  if (!quote) return null;
  
  const priceData = {
    asset_code: code.toUpperCase(),
    date: new Date().toISOString().split('T')[0],
    open: null,
    high: quote.dayHigh,
    low: quote.dayLow,
    close: quote.price,
    volume: quote.volume
  };
  
  upsertPrice(priceData);
  console.log(`✅ Synced price for ${code}: $ ${quote.price}`);
  
  return priceData;
}

/**
 * Sync fundamentals for a single asset
 * @param {string} assetCode - Asset code
 * @returns {Promise<Object>} Sync result
 */
export async function syncAssetFundamentals(assetCode) {
  try {
    const asset = getAsset(assetCode.toUpperCase());
    
    if (!asset) {
      throw new Error('Asset not found in database');
    }
    
    let fundamentalData = null;
    
    if (asset.market === 'BR') {
      const data = await getBrapiFundamentals(assetCode, BRAPI_TOKEN);
      if (data) {
        fundamentalData = mapBrapiFundamentals(assetCode, data);
      }
    } else if (asset.market === 'US') {
      const data = await getAVOverview(assetCode);
      if (data) {
        fundamentalData = mapAVFundamentals(assetCode, data);
      }
    }
    
    if (fundamentalData) {
      insertFundamentals(fundamentalData);
      
      logSync({
        sync_type: 'fundamentals',
        api_source: asset.market === 'BR' ? 'brapi' : 'alphavantage',
        assets_updated: 1,
        status: 'success'
      });
      
      console.log(`✅ Synced fundamentals for ${assetCode}`);
      return { success: true, asset: assetCode };
    }
    
    return { success: false, error: 'No data returned' };
    
  } catch (error) {
    console.error(`Error syncing fundamentals for ${assetCode}:`, error);
    
    logSync({
      sync_type: 'fundamentals',
      api_source: 'unknown',
      assets_updated: 0,
      status: 'error',
      error_message: error.message
    });
    
    throw error;
  }
}

/**
 * Map Brapi fundamentals to SQLite schema
 */
function mapBrapiFundamentals(assetCode, data) {
  return {
    asset_code: assetCode.toUpperCase(),
    market_cap: null, // Brapi structure varies
    pe_ratio: data.priceToEarnings || null,
    pb_ratio: data.priceToBook || null,
    dividend_yield: data.dividendYield ? data.dividendYield * 100 : null,
    roe: data.returnOnEquity ? data.returnOnEquity * 100 : null,
    roa: null,
    profit_margin: data.profitMargin ? data.profitMargin * 100 : null,
    debt_to_equity: data.debtToEquity || null,
    current_ratio: null,
    nav_per_share: null,
    vacancy_rate: null,
    p_vpa: data.priceToBook || null,
    revenue: null,
    revenue_growth: null,
    earnings_growth: null
  };
}

/**
 * Map Alpha Vantage fundamentals to SQLite schema
 */
function mapAVFundamentals(assetCode, data) {
  return {
    asset_code: assetCode.toUpperCase(),
    market_cap: data.marketCap || null,
    pe_ratio: data.pe || null,
    pb_ratio: data.pb || null,
    dividend_yield: data.dividendYield ? data.dividendYield * 100 : null,
    roe: data.roe ? data.roe * 100 : null,
    roa: null,
    profit_margin: data.profitMargin ? data.profitMargin * 100 : null,
    debt_to_equity: null,
    current_ratio: null,
    nav_per_share: null,
    vacancy_rate: null,
    p_vpa: data.pb || null,
    revenue: null,
    revenue_growth: data.quarterlyRevenueGrowth || null,
    earnings_growth: null
  };
}

/**
 * Sync economic indicators from BACEN
 * @returns {Promise<Object>} Sync result
 */
export async function syncEconomicIndicators() {
  try {
    const snapshot = await getEconomicSnapshot();
    
    if (!snapshot) {
      throw new Error('Failed to fetch economic snapshot');
    }
    
    const today = new Date().toISOString().split('T')[0];
    
    // Insert each indicator
    const indicators = [
      { name: 'SELIC', value: snapshot.selic },
      { name: 'IPCA', value: snapshot.ipca },
      { name: 'IPCA_12M', value: snapshot.ipca12m },
      { name: 'CDI', value: snapshot.cdi }
    ];
    
    for (const indicator of indicators) {
      if (indicator.value !== null) {
        upsertEconomicIndicator(indicator.name, today, indicator.value);
      }
    }
    
    logSync({
      sync_type: 'economic',
      api_source: 'bacen',
      assets_updated: indicators.filter(i => i.value !== null).length,
      status: 'success'
    });
    
    console.log('✅ Synced economic indicators');
    return { success: true, indicators: snapshot };
    
  } catch (error) {
    console.error('Error syncing economic indicators:', error);
    
    logSync({
      sync_type: 'economic',
      api_source: 'bacen',
      assets_updated: 0,
      status: 'error',
      error_message: error.message
    });
    
    throw error;
  }
}

/**
 * Sync everything (all assets + economic indicators)
 * @param {string[]} assetCodes - Optional array of asset codes (if empty, syncs all)
 * @returns {Promise<Object>} Combined sync results
 */
export async function syncAll(assetCodes = []) {
  console.log('🔄 Starting full synchronization...');
  
  const results = {
    prices: null,
    economic: null,
    startTime: new Date(),
    endTime: null
  };
  
  try {
    // Sync prices
    if (assetCodes.length > 0) {
      results.prices = await syncAssetPrices(assetCodes);
    }
    
    // Sync economic indicators
    results.economic = await syncEconomicIndicators();
    
    results.endTime = new Date();
    console.log(`✅ Full synchronization complete in ${results.endTime - results.startTime}ms`);
    
    return results;
  } catch (error) {
    results.endTime = new Date();
    results.error = error.message;
    console.error('❌ Full synchronization failed:', error);
    throw error;
  }
}
