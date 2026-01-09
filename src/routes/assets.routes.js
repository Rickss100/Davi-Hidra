/**
 * Assets Routes
 * API endpoints for asset management
 */

import express from 'express';
import { 
  upsertAsset, 
  getAssets, 
  getAsset, 
  getAssetsWithFundamentals, 
  getAssetsWithFundamentalsAndNotes,
  filterAssetsByFundamentals,
  getUserNotes,
  upsertUserNotes
} from '../services/database.service.js';

const router = express.Router();

// GET /api/assets - List all assets with optional filters
router.get('/', (req, res) => {
  try {
    const { type, market } = req.query;
    const filters = {};
    
    if (type) filters.type = type;
    if (market) filters.market = market;
    
    const assets = getAssets(filters);
    res.json(assets);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assets/with-fundamentals - Get assets with their latest fundamentals and user notes
router.get('/with-fundamentals', (req, res) => {
  try {
    const { type, market } = req.query;
    const filters = {};
    
    if (type) filters.type = type;
    if (market) filters.market = market;
    
    // Use the new function that includes user notes and price
    const assets = getAssetsWithFundamentalsAndNotes(filters);
    res.json(assets);
  } catch (error) {
    console.error('Error fetching assets with fundamentals:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assets/filter-davi - Filter assets using DAVI method
router.post('/filter-davi', (req, res) => {
  try {
    const { type, filters: daviFilters } = req.body;
    
    if (!type) {
      return res.status(400).json({ error: 'Missing required field: type' });
    }
    
    const assets = filterAssetsByFundamentals(type, daviFilters || {});
    
    res.json({
      total: assets.length,
      filters_applied: Object.keys(daviFilters || {}).length,
      assets
    });
  } catch (error) {
    console.error('Error filtering assets:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assets/:code - Get specific asset
router.get('/:code', (req, res) => {
  try {
    const asset = getAsset(req.params.code.toUpperCase());
    
    if (!asset) {
      return res.status(404).json({ error: 'Asset not found' });
    }
    
    res.json(asset);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/assets/:code/notes - Get user notes for specific asset
router.get('/:code/notes', (req, res) => {
  try {
    const notes = getUserNotes(req.params.code.toUpperCase());
    res.json(notes || { asset_code: req.params.code.toUpperCase(), rating: null, notes: null });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/assets/:code/notes - Update user notes for specific asset
router.put('/:code/notes', (req, res) => {
  try {
    const assetCode = req.params.code.toUpperCase();
    const { rating, notes } = req.body;
    
    // Validate rating if provided
    if (rating !== undefined && rating !== null) {
      const ratingNum = parseInt(rating);
      if (isNaN(ratingNum) || ratingNum < 1 || ratingNum > 5) {
        return res.status(400).json({ error: 'Rating must be between 1 and 5' });
      }
    }
    
    upsertUserNotes(assetCode, rating || null, notes || null);
    
    res.json({ 
      message: 'Notes updated successfully',
      asset_code: assetCode,
      rating: rating || null,
      notes: notes || null
    });
  } catch (error) {
    console.error('Error updating user notes:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/assets - Add new asset
router.post('/', (req, res) => {
  try {
    const { code, name, type, market, sector } = req.body;
    
    if (!code || !name || !type || !market) {
      return res.status(400).json({ 
        error: 'Missing required fields: code, name, type, market' 
      });
    }
    
    const result = upsertAsset({
      code: code.toUpperCase(),
      name,
      type: type.toLowerCase(),
      market: market.toUpperCase(),
      sector
    });
    
    res.status(201).json({ 
      message: 'Asset created/updated successfully',
      code: code.toUpperCase()
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
