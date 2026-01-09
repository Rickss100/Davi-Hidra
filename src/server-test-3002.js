/**
 * Test server on port 3002
 */

import express from 'express';
import cors from 'cors';

const app = express();
const PORT = 3002; // Different port!

app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`📨 ${req.method} ${req.url}`);
  next();
});

// Test route
app.get('/test', (req, res) => {
  console.log('✅ Route /test was called!');
  res.json({ 
    message: 'Server on port 3002 works!', 
    timestamp: new Date().toISOString() 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 Test: http://localhost:${PORT}/test`);
});
