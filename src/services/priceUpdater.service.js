/**
 * Price Updater Service
 * Orchestrates price updates from multiple APIs (Brapi, Alpha Vantage)
 * and updates the application state/database
 */

import { getBrapiQuote, getBrapiQuotes } from './brapi.service.js';
import { getAVQuote, rateLimitedRequest } from './alphavantage.service.js';

/**
 * Update prices for all assets in portfolio
 * @param {Object} holdings - Current holdings object from PortfolioContext
 * @param {Object} options - Configuration options
 * @returns {Promise<Object>} Updated holdings with current prices
 */
export async function updateAllPrices(holdings, options = {}) {
  const { brapiToken = null, alphaVantageKey = null, onProgress = null } = options;
  
  const updatedHoldings = { ...holdings };
  const categories = ['acoes', 'fiis', 'stocks', 'reits'];
  
  let totalAssets = 0;
  let processedAssets = 0;
  
  // Count total assets
  categories.forEach(cat => {
    totalAssets += (holdings[cat] || []).length;
  });
  
  console.log(`Starting price update for ${totalAssets} assets...`);
  
  // Update Brazilian assets (ações + FIIs)
  for (const category of ['acoes', 'fiis']) {
    if (!holdings[category] || holdings[category].length === 0) continue;
    
    const assets = holdings[category];
    const tickers = assets.map(a => a.code);
    
    try {
      // Brapi supports batch requests - fetch all at once
      console.log(`Fetching ${category}: ${tickers.join(', ')}`);
      const quotes = await getBrapiQuotes(tickers, brapiToken);
      
      // Create a map for quick lookup
      const quoteMap = {};
      quotes.forEach(q => {
        if (q) { // Filter out null responses
          quoteMap[q.ticker] = q;
        }
      });
      
      // Update prices
      updatedHoldings[category] = assets.map(asset => {
        const quote = quoteMap[asset.code];
        processedAssets++;
        
        if (onProgress) {
          onProgress({
            current: processedAssets,
            total: totalAssets,
            ticker: asset.code,
            category
          });
        }
        
        if (quote) {
          console.log(`✓ Updated ${asset.code}: R$ ${quote.price}`);
          return {
            ...asset,
            currentPrice: quote.price,
            priceChange: quote.change,
            priceChangePercent: quote.changePercent,
            lastUpdated: quote.updatedAt
          };
        }
        
        // Fallback: keep averagePrice if API failed
        console.warn(`⚠ No quote for ${asset.code}, using fallback price: R$ ${asset.averagePrice || asset.currentPrice || 0}`);
        return {
          ...asset,
          currentPrice: asset.currentPrice || asset.averagePrice || 0,
          // Mark as stale/fallback
          priceIsFallback: true
        };
      });
    } catch (error) {
      console.error(`Error updating ${category}:`, error);
      // Keep existing data on error
      updatedHoldings[category] = assets.map((asset, idx) => {
        processedAssets++;
        return {
          ...asset,
          currentPrice: asset.currentPrice || asset.averagePrice || 0,
          priceIsFallback: true
        };
      });
    }
  }
  
  // Update US assets (stocks + REITs)
  for (const category of ['stocks', 'reits']) {
    if (!holdings[category] || holdings[category].length === 0) continue;
    
    const assets = holdings[category];
    
    updatedHoldings[category] = [];
    
    for (const asset of assets) {
      try {
        // Alpha Vantage requires individual requests with rate limiting
        console.log(`Fetching ${category}: ${asset.code}`);
        
        const quote = await rateLimitedRequest(() => getAVQuote(asset.code));
        
        processedAssets++;
        
        if (onProgress) {
          onProgress({
            current: processedAssets,
            total: totalAssets,
            ticker: asset.code,
            category
          });
        }
        
        updatedHoldings[category].push({
          ...asset,
          currentPrice: quote.price,
          priceChange: quote.change,
          priceChangePercent: quote.changePercent,
          lastUpdated: quote.updatedAt
        });
      } catch (error) {
        console.error(`Error updating ${asset.code}:`, error);
        // Keep existing data
        updatedHoldings[category].push(asset);
        processedAssets++;
      }
    }
  }
  
  console.log(`Price update complete: ${processedAssets}/${totalAssets} assets updated`);
  
  return updatedHoldings;
}

/**
 * Update price for a single asset
 * @param {string} ticker - Asset ticker
 * @param {string} market - Market ('BR' or 'US')
 * @param {Object} options - API options
 * @returns {Promise<Object>} Updated price data
 */
export async function updateSinglePrice(ticker, market = 'BR', options = {}) {
  const { brapiToken = null } = options;
  
  try {
    if (market === 'BR') {
      const quote = await getBrapiQuote(ticker, brapiToken);
      return {
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        updatedAt: quote.updatedAt
      };
    } else {
      const quote = await getAVQuote(ticker);
      return {
        price: quote.price,
        change: quote.change,
        changePercent: quote.changePercent,
        updatedAt: quote.updatedAt
      };
    }
  } catch (error) {
    console.error(`Error updating single price for ${ticker}:`, error);
    throw error;
  }
}

/**
 * Estimate time to complete update based on number of assets
 * @param {Object} holdings - Holdings object
 * @returns {Object} Estimation object with duration and breakdown
 */
export function estimateUpdateTime(holdings) {
  const categories = ['acoes', 'fiis', 'stocks', 'reits'];
  
  let brAssets = 0;
  let usAssets = 0;
  
  categories.forEach(cat => {
    const count = (holdings[cat] || []).length;
    if (cat === 'acoes' || cat === 'fiis') {
      brAssets += count;
    } else {
      usAssets += count;
    }
  });
  
  // Brapi: Can batch request, fast (~2 seconds for any number)
  const brapiTime = brAssets > 0 ? 2000 : 0;
  
  // Alpha Vantage: Rate limited to 5/minute = 12 seconds each
  const avTime = usAssets * 12000;
  
  const totalTime = brapiTime + avTime;
  
  return {
    totalAssets: brAssets + usAssets,
    brazilAssets: brAssets,
    usAssets: usAssets,
    estimatedMs: totalTime,
    estimatedSeconds: Math.ceil(totalTime / 1000),
    breakdown: {
      brapi: Math.ceil(brapiTime / 1000),
      alphaVantage: Math.ceil(avTime / 1000)
    }
  };
}

/**
 * Check if prices are stale (need updating)
 * @param {Object} holdings - Holdings object
 * @param {number} maxAgeHours - Maximum age in hours before considered stale
 * @returns {boolean} True if any prices are stale
 */
export function arePricesStale(holdings, maxAgeHours = 24) {
  const categories = ['acoes', 'fiis', 'stocks', 'reits'];
  const now = new Date();
  const maxAgeMs = maxAgeHours * 60 * 60 * 1000;
  
  for (const category of categories) {
    const assets = holdings[category] || [];
    
    for (const asset of assets) {
      if (!asset.lastUpdated) {
        return true; // No update timestamp = stale
      }
      
      const lastUpdate = new Date(asset.lastUpdated);
      const age = now - lastUpdate;
      
      if (age > maxAgeMs) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get update status summary
 * @param {Object} holdings - Holdings object
 * @returns {Object} Status summary
 */
export function getUpdateStatus(holdings) {
  const categories = ['acoes', 'fiis', 'stocks', 'reits'];
  const now = new Date();
  
  let totalAssets = 0;
  let updatedAssets = 0;
  let oldestUpdate = null;
  let newestUpdate = null;
  
  categories.forEach(cat => {
    const assets = holdings[cat] || [];
    totalAssets += assets.length;
    
    assets.forEach(asset => {
      if (asset.lastUpdated) {
        updatedAssets++;
        const updateTime = new Date(asset.lastUpdated);
        
        if (!oldestUpdate || updateTime < oldestUpdate) {
          oldestUpdate = updateTime;
        }
        
        if (!newestUpdate || updateTime > newestUpdate) {
          newestUpdate = updateTime;
        }
      }
    });
  });
  
  return {
    totalAssets,
    updatedAssets,
    notUpdatedAssets: totalAssets - updatedAssets,
    oldestUpdate,
    newestUpdate,
    isStale: arePricesStale(holdings),
    lastUpdateAge: oldestUpdate ? Math.floor((now - oldestUpdate) / 1000 / 60) : null // minutes
  };
}
