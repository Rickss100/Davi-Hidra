/**
 * Sync Routes
 * API endpoints for data synchronization
 */

import express from 'express';
import fetch from 'node-fetch';
import {
  syncAssetPrices,
  syncAssetFundamentals,
  syncEconomicIndicators,
  syncAll,
  setApiTokens
} from '../services/sync.service.js';
import { getAssets, getAssetsToSync, insertFundamentals, upsertPrice } from '../services/database.service.js';

const router = express.Router();

// Brapi token
const BRAPI_TOKEN = '6AC8B12Ck6WvvTnVEnUoSh';

// POST /api/sync/fundamentals-batch - Batch sync fundamentals from Brapi
router.post('/fundamentals-batch', async (req, res) => {
  try {
    const { type, limit = 50 } = req.body;
    
    // Get assets to sync (prioritizing outdated ones)
    const assets = getAssetsToSync(limit, type);
    
    if (assets.length === 0) {
      return res.json({ success: 0, failed: 0, message: 'No assets to sync' });
    }
    
    console.log(`📊 Starting batch sync for ${assets.length} ${type || 'all'} assets...`);
    
    let successCount = 0;
    let failedCount = 0;
    const today = new Date().toISOString().split('T')[0];
    
    // Sync one at a time with delay to avoid rate limiting
    for (let i = 0; i < assets.length; i++) {
      const asset = assets[i];
      
      try {
        const url = `https://brapi.dev/api/quote/${asset.code}?token=${BRAPI_TOKEN}&fundamental=true`;
        const response = await fetch(url);
        
        if (response.status === 429) {
          console.log(`  ⏳ Rate limited at ${asset.code}, waiting...`);
          await new Promise(r => setTimeout(r, 5000));
          i--; // Retry same asset
          continue;
        }
        
        if (!response.ok) {
          failedCount++;
          continue;
        }
        
        const data = await response.json();
        const result = data.results?.[0];
        
        if (result) {
          // Insert fundamentals
          insertFundamentals({
            asset_code: result.symbol,
            market_cap: result.marketCap || null,
            pe_ratio: result.priceEarnings || null,
            pb_ratio: result.priceToBook || null,
            dividend_yield: result.dividendYield ? result.dividendYield * 100 : null,
            roe: null,
            roa: null,
            profit_margin: null,
            debt_to_equity: null,
            current_ratio: null,
            nav_per_share: null,
            vacancy_rate: null,
            p_vpa: result.priceToBook || null,
            revenue: null,
            revenue_growth: null,
            earnings_growth: null
          });
          
          // Update price
          if (result.regularMarketPrice) {
            upsertPrice({
              asset_code: result.symbol,
              date: today,
              open: result.regularMarketOpen || null,
              high: result.regularMarketDayHigh || null,
              low: result.regularMarketDayLow || null,
              close: result.regularMarketPrice,
              volume: result.regularMarketVolume || null
            });
          }
          
          console.log(`  ✅ [${i + 1}/${assets.length}] ${result.symbol}: R$ ${result.regularMarketPrice?.toFixed(2) || '-'}`);
          successCount++;
        } else {
          failedCount++;
        }
        
        // Delay between requests
        if (i < assets.length - 1) {
          await new Promise(r => setTimeout(r, 1500));
        }
        
      } catch (err) {
        console.error(`  ❌ Error syncing ${asset.code}:`, err.message);
        failedCount++;
      }
    }
    
    console.log(`📊 Batch sync complete: ${successCount} success, ${failedCount} failed`);
    
    res.json({
      success: successCount,
      failed: failedCount,
      total: assets.length,
      message: `Synced ${successCount} of ${assets.length} assets`
    });
    
  } catch (error) {
    console.error('Batch sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/prices - Sync prices for multiple assets
router.post('/prices', async (req, res) => {
  try {
    const { codes } = req.body;
    
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid "codes" array in request body' 
      });
    }
    
    const result = await syncAssetPrices(codes);
    
    res.json({
      message: `Synced ${result.success.length} of ${result.total} assets`,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/fundamentals/:code - Sync fundamentals for one asset
router.post('/fundamentals/:code', async (req, res) => {
  try {
    const result = await syncAssetFundamentals(req.params.code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/economic - Sync economic indicators
router.post('/economic', async (req, res) => {
  try {
    const result = await syncEconomicIndicators();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/all - Full synchronization
router.post('/all', async (req, res) => {
  try {
    const { codes } = req.body;
    const assetCodes = codes || [];
    
    const result = await syncAll(assetCodes);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/tokens - Update API tokens
router.post('/tokens', (req, res) => {
  try {
    const { brapiToken, alphaVantageKey } = req.body;
    
    setApiTokens({ brapiToken, alphaVantageKey });
    
    res.json({ 
      message: 'API tokens updated successfully',
      brapiToken: brapiToken ? '***' : 'not set',
      alphaVantageKey: alphaVantageKey ? '***' : 'not set'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
