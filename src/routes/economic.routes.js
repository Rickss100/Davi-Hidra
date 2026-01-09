/**
 * Economic Indicators Routes
 * API endpoints for economic data
 */

import express from 'express';
import { 
  getLatestIndicator,
  upsertEconomicIndicator 
} from '../services/database.service.js';

const router = express.Router();

// GET /api/economic/:indicator - Get latest value for an indicator
router.get('/:indicator', (req, res) => {
  try {
    const indicator = getLatestIndicator(req.params.indicator.toUpperCase());
    
    if (!indicator) {
      return res.status(404).json({ error: 'Indicator not found' });
    }
    
    res.json(indicator);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/economic - Add economic indicator
router.post('/', (req, res) => {
  try {
    const { indicator, date, value } = req.body;
    
    if (!indicator || !date || value === undefined) {
      return res.status(400).json({ 
        error: 'Missing required fields: indicator, date, value' 
      });
    }
    
    upsertEconomicIndicator(indicator.toUpperCase(), date, value);
    
    res.status(201).json({ message: 'Economic indicator created/updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
