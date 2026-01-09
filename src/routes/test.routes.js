/**
 * Test route to verify server is working
 */

import express from 'express';

const router = express.Router();

router.get('/test', (req, res) => {
  res.json({ 
    message: 'Server is working!',
    timestamp: new Date().toISOString() 
  });
});

export default router;
