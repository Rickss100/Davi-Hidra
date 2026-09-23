/**
 * Express Server for DAVI & HYDRA Investment App
 * Serves data from SQLite database via REST API
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './services/database.service.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

// Import routes with error handling
let testRoutes, assetsRoutes, pricesRoutes, fundamentalsRoutes, economicRoutes, statsRoutes, syncRoutes, transactionsRoutes, usersRoutes, dividendsRoutes, resumoRoutes;

try {
  usersRoutes = (await import('./routes/users.routes.js')).default;
  console.log('✅ users.routes loaded');
} catch (err) { console.error('❌ users.routes failed:', err.message); }

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

try {
  dividendsRoutes = (await import('./routes/dividends.routes.js')).default;
  console.log('✅ dividends.routes loaded');
} catch (err) { console.error('❌ dividends.routes failed:', err.message); }

try {
  resumoRoutes = (await import('./routes/resumo.routes.js')).default;
  console.log('✅ resumo.routes loaded');
} catch (err) { console.error('❌ resumo.routes failed:', err.message); }

const app = express();
const PORT = process.env.PORT || 3002;

// Middleware
app.use(cors());
app.use(express.json());

// Servir arquivos estáticos do frontend (quando compilado para produção)
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  console.log('📦 Frontend estático ativo de:', DIST_DIR);
}

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
if (usersRoutes) app.use('/api/users', usersRoutes);
if (dividendsRoutes) app.use('/api/dividends', dividendsRoutes);
if (resumoRoutes) app.use('/api/resumo', resumoRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// SPA Fallback: rotas de página não-API são atendidas pelo index.html do Vite
if (fs.existsSync(DIST_DIR)) {
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api') || req.path === '/health') {
      return next();
    }
    res.sendFile(path.join(DIST_DIR, 'index.html'));
  });
} else {
  app.get('/', (req, res) => {
    res.json({ 
      status: 'online',
      app: 'DAVI & HYDRA API',
      message: 'API rodando normalmente. O frontend ainda não foi compilado com npm run build.'
    });
  });
}

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
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 API endpoints available at /api`);
});
