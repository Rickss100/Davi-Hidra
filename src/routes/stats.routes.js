/**
 * Stats Routes
 * API endpoints for database statistics and logs
 */

import express from 'express';
import { getDatabaseStats } from '../services/csvImport.service.js';
import { getLastSync } from '../services/database.service.js';

const router = express.Router();

// GET /api/stats - Get database statistics
router.get('/stats', (req, res) => {
  try {
    const stats = getDatabaseStats();
    res.json(stats);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/sync/logs - Get sync logs
router.get('/sync/logs', (req, res) => {
  try {
    const { type } = req.query;
    
    if (type) {
      const log = getLastSync(type);
      return res.json(log || { message: 'No sync logs found' });
    }
    
    // If no type specified, return logs for all types
    const types = ['prices', 'fundamentals', 'economic'];
    const logs = types.map(t => ({
      type: t,
      lastSync: getLastSync(t)
    }));
    
    res.json(logs);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
