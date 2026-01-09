/**
 * Fundamentals Routes
 * API endpoints for fundamental data
 */

import express from 'express';
import { 
  getLatestFundamentals, 
  getAllFundamentals,
  insertFundamentals 
} from '../services/database.service.js';

const router = express.Router();

// GET /api/fundamentals/:code - Get latest fundamentals for an asset
router.get('/:code', (req, res) => {
  try {
    const fundamentals = getLatestFundamentals(req.params.code.toUpperCase());
    
    if (!fundamentals) {
      return res.status(404).json({ error: 'No fundamental data found for this asset' });
    }
    
    res.json(fundamentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/fundamentals/batch?codes=PETR4,VALE3,AAPL - Get fundamentals for multiple assets
router.get('/batch/list', (req, res) => {
  try {
    const { codes } = req.query;
    
    if (!codes) {
      return res.status(400).json({ error: 'Missing query parameter: codes' });
    }
    
    const assetCodes = codes.split(',').map(code => code.trim().toUpperCase());
    const fundamentals = getAllFundamentals(assetCodes);
    
    res.json(fundamentals);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/fundamentals - Add fundamental data
router.post('/', (req, res) => {
  try {
    const { asset_code, ...fundamentalData } = req.body;
    
    if (!asset_code) {
      return res.status(400).json({ error: 'Missing required field: asset_code' });
    }
    
    insertFundamentals({
      asset_code: asset_code.toUpperCase(),
      ...fundamentalData
    });
    
    res.status(201).json({ message: 'Fundamental data created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
