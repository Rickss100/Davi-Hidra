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
    const code = req.params.indicator.toUpperCase();
    const indicator = getLatestIndicator(code);
    
    if (!indicator) {
      // Valores de mercado padrão caso ainda não sincronizados pelo Bacen
      const fallbackValues = {
        'SELIC': 10.75,
        'CDI': 10.65,
        'IPCA': 4.50,
        'DOLAR': 5.65
      };

      if (fallbackValues[code] !== undefined) {
        return res.json({
          indicator: code,
          date: new Date().toISOString().split('T')[0],
          value: fallbackValues[code],
          is_fallback: true
        });
      }

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
