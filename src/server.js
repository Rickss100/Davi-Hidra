/**
 * Express Server for DAVI & HYDRA Investment App
 * Serves data from SQLite database via REST API
 */

import express from 'express';
import cors from 'cors';
import { initDatabase } from './services/database.service.js';

// Import routes with error handling
let testRoutes, assetsRoutes, pricesRoutes, fundamentalsRoutes, economicRoutes, statsRoutes, syncRoutes, transactionsRoutes;

try {
  testRoutes = (await import('./routes/test.routes.js')).default;
  console.log('✅ test.routes loaded');
} catch (err) { console.error('❌ test.routes failed:', err.message); }

try {
  assetsRoutes = (await import('./routes/assets.routes.js')).default;
  console.log('✅ assets.routes loaded');
} catch (err) { console.error('❌ assets.routes failed:', err.message); }

try {
  pricesRoutes = (await import('./routes/prices.routes.js')).default;
  console.log('✅ prices.routes loaded');
} catch (err) { console.error('❌ prices.routes failed:', err.message); }

try {
  fundamentalsRoutes = (await import('./routes/fundamentals.routes.js')).default;
  console.log('✅ fundamentals.routes loaded');
} catch (err) { console.error('❌ fundamentals.routes failed:', err.message); }

try {
  economicRoutes = (await import('./routes/economic.routes.js')).default;
  console.log('✅ economic.routes loaded');
} catch (err) { console.error('❌ economic.routes failed:', err.message); }

try {
  statsRoutes = (await import('./routes/stats.routes.js')).default;
  console.log('✅ stats.routes loaded');
} catch (err) { console.error('❌ stats.routes failed:', err.message); }

try {
  syncRoutes = (await import('./routes/sync.routes.js')).default;
  console.log('✅ sync.routes loaded');
} catch (err) { console.error('❌ sync.routes failed:', err.message); }

try {
  transactionsRoutes = (await import('./routes/transactions.routes.js')).default;
  console.log('✅ transactions.routes loaded');
} catch (err) { console.error('❌ transactions.routes failed:', err.message); }

const app = express();
const PORT = 3002;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static('public')); // Serve static files from public folder

// Root route - redirect to dashboard
app.get('/', (req, res) => {
  res.redirect('/dashboard.html');
});

// Initialize database on startup
initDatabase();
console.log('✅ Database initialized');

// Routes - only register if loaded successfully
if (testRoutes) app.use('/api/test', testRoutes);
if (assetsRoutes) app.use('/api/assets', assetsRoutes);
if (pricesRoutes) app.use('/api/prices', pricesRoutes);
if (fundamentalsRoutes) app.use('/api/fundamentals', fundamentalsRoutes);
if (economicRoutes) app.use('/api/economic', economicRoutes);
if (syncRoutes) app.use('/api/sync', syncRoutes);
if (statsRoutes) app.use('/api', statsRoutes);
if (transactionsRoutes) app.use('/api/transactions', transactionsRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('❌ Error:', err);
  res.status(500).json({ 
    error: 'Internal server error', 
    message: err.message 
  });
});

// Start server
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📊 API endpoints available at http://localhost:${PORT}/api`);
});
