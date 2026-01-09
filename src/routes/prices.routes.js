/**
 * Prices Routes
 * API endpoints for price data
 */

import express from 'express';
import { 
  getLatestPrice, 
  getPriceHistory, 
  upsertPrice 
} from '../services/database.service.js';

const router = express.Router();

// GET /api/prices/:code/latest - Get latest price for an asset
router.get('/:code/latest', (req, res) => {
  try {
    const price = getLatestPrice(req.params.code.toUpperCase());
    
    if (!price) {
      return res.status(404).json({ error: 'No price data found for this asset' });
    }
    
    res.json(price);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/prices/:code/history - Get price history
router.get('/:code/history', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const history = getPriceHistory(req.params.code.toUpperCase(), days);
    
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/prices - Add new price
router.post('/', (req, res) => {
  try {
    const { asset_code, date, open, high, low, close, volume } = req.body;
    
    if (!asset_code || !date || !close) {
      return res.status(400).json({ 
        error: 'Missing required fields: asset_code, date, close' 
      });
    }
    
    upsertPrice({
      asset_code: asset_code.toUpperCase(),
      date,
      open,
      high,
      low,
      close,
      volume
    });
    
    res.status(201).json({ message: 'Price created/updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
