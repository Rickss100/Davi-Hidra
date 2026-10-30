/**
 * Express Server for DAVI & HYDRA Investment App
 * Serves data from SQLite database via REST API (DevSecOps Hardened)
 */

import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { initDatabase } from './services/database.service.js';
import {
  syncWithTursoOnStartup,
  getTursoStatus,
  getTursoDiagnostics
} from './services/turso.service.js';
import {
  securityHeaders,
  createRateLimiter,
  authenticateRequest,
  requireAdminOrCollab
} from './middleware/security.middleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DIST_DIR = path.resolve(__dirname, '../dist');

let testRoutes,
  assetsRoutes,
  pricesRoutes,
  fundamentalsRoutes,
  economicRoutes,
  statsRoutes,
  syncRoutes,
  transactionsRoutes,
  usersRoutes,
  dividendsRoutes,
  resumoRoutes,
  objectivesRoutes;

try {
  objectivesRoutes = (await import('./routes/objectives.routes.js')).default;
  console.log('✅ objectives.routes loaded');
} catch (err) {
  console.error('❌ objectives.routes failed:', err.message);
}

try {
  usersRoutes = (await import('./routes/users.routes.js')).default;
  console.log('✅ users.routes loaded');
} catch (err) {
  console.error('❌ users.routes failed:', err.message);
}

try {
  testRoutes = (await import('./routes/test.routes.js')).default;
  console.log('✅ test.routes loaded');
} catch (err) {
  console.error('❌ test.routes failed:', err.message);
}

try {
  assetsRoutes = (await import('./routes/assets.routes.js')).default;
  console.log('✅ assets.routes loaded');
} catch (err) {
  console.error('❌ assets.routes failed:', err.message);
}

try {
  pricesRoutes = (await import('./routes/prices.routes.js')).default;
  console.log('✅ prices.routes loaded');
} catch (err) {
  console.error('❌ prices.routes failed:', err.message);
}

try {
  fundamentalsRoutes = (await import('./routes/fundamentals.routes.js')).default;
  console.log('✅ fundamentals.routes loaded');
} catch (err) {
  console.error('❌ fundamentals.routes failed:', err.message);
}

try {
  economicRoutes = (await import('./routes/economic.routes.js')).default;
  console.log('✅ economic.routes loaded');
} catch (err) {
  console.error('❌ economic.routes failed:', err.message);
}

try {
  statsRoutes = (await import('./routes/stats.routes.js')).default;
  console.log('✅ stats.routes loaded');
} catch (err) {
  console.error('❌ stats.routes failed:', err.message);
}

try {
  syncRoutes = (await import('./routes/sync.routes.js')).default;
  console.log('✅ sync.routes loaded');
} catch (err) {
  console.error('❌ sync.routes failed:', err.message);
}

try {
  transactionsRoutes = (await import('./routes/transactions.routes.js')).default;
  console.log('✅ transactions.routes loaded');
} catch (err) {
  console.error('❌ transactions.routes failed:', err.message);
}

try {
  dividendsRoutes = (await import('./routes/dividends.routes.js')).default;
  console.log('✅ dividends.routes loaded');
} catch (err) {
  console.error('❌ dividends.routes failed:', err.message);
}

try {
  resumoRoutes = (await import('./routes/resumo.routes.js')).default;
  console.log('✅ resumo.routes loaded');
} catch (err) {
  console.error('❌ resumo.routes failed:', err.message);
}

const app = express();
const PORT = process.env.PORT || 3002;

// 🛡️ DevSecOps: Ocultar assinatura do servidor e injetar cabeçalhos HTTP de segurança
app.disable('x-powered-by');
app.use(securityHeaders);
app.use(cors());
app.use(express.json({ limit: '5mb' }));

// 🛡️ DevSecOps: Rate Limiter Global da API (300 req/min por IP)
const globalApiLimiter = createRateLimiter({
  windowMs: 60 * 1000,
  max: 300,
  keyPrefix: 'api-global',
  message: 'Volume excessivo de requisições detectado. Aguarde um instante.'
});
app.use('/api', globalApiLimiter);

// 🛡️ DevSecOps: Trilha de Auditoria Verificada Criptograficamente (com redação de senhas)
app.use((req, res, next) => {
  if (req.method !== 'GET' && req.path.startsWith('/api')) {
    const authUser = authenticateRequest(req);
    const targetUserId = req.headers['x-user-id'];
    if (
      authUser &&
      (authUser.role === 'admin' || authUser.role === 'collaborator') &&
      targetUserId &&
      String(targetUserId) !== String(authUser.id)
    ) {
      const redactedBody = { ...(req.body || {}) };
      if ('password' in redactedBody) redactedBody.password = '[REDACTED]';
      if ('newPassword' in redactedBody) redactedBody.newPassword = '[REDACTED]';
      if ('token' in redactedBody) redactedBody.token = '[REDACTED]';

      const logLine = `[${new Date().toISOString()}] VERIFIED_ADMIN_ID: ${authUser.id} (${authUser.uuid || 'no-uuid'}) | TARGET_USER_ID: ${targetUserId} | METHOD: ${req.method} | PATH: ${req.originalUrl} | BODY: ${JSON.stringify(redactedBody)}\n`;
      try {
        fs.appendFileSync(path.resolve(__dirname, '../audit_historico.log'), logLine);
      } catch (e) {
        console.error('Audit Log failed:', e.message);
      }
    }
  }
  next();
});

// Servir relatórios em PDF e HTML
const RELATORIOS_DIR = path.resolve(__dirname, '../public/relatorios');
if (fs.existsSync(RELATORIOS_DIR)) {
  app.use('/relatorios', express.static(RELATORIOS_DIR));
  console.log('📄 Relatórios estáticos ativos em /relatorios');
}

// Servir arquivos estáticos do frontend (quando compilado para produção)
if (fs.existsSync(DIST_DIR)) {
  app.use(express.static(DIST_DIR));
  console.log('📦 Frontend estático ativo de:', DIST_DIR);
}

// Initialize database on startup
const localDb = initDatabase();
console.log('✅ Database initialized');

console.log('☁️ Aguardando sincronização com Turso Cloud...');
try {
  await syncWithTursoOnStartup(localDb);
} catch (err) {
  console.warn('⚠️ Falha de sincronização com Turso no startup (continuando):', err.message);
}

// Routes
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
if (objectivesRoutes) app.use('/api/objectives', objectivesRoutes);

const chatRoutes = (await import('./routes/chat.routes.js')).default;
app.use('/api/chat', chatRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// 🛡️ Rotas Administrativas Turso Cloud protegidas por requireAdminOrCollab
app.get('/api/admin/turso-status', requireAdminOrCollab, async (req, res) => {
  try {
    const status = await getTursoStatus();
    res.json(status);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.get('/api/admin/turso-diagnostics', requireAdminOrCollab, async (req, res) => {
  try {
    const diag = await getTursoDiagnostics(localDb);
    res.json(diag);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

app.post('/api/admin/turso-force-sync', requireAdminOrCollab, async (req, res) => {
  try {
    await syncWithTursoOnStartup(localDb);
    const status = await getTursoStatus();
    res.json({
      success: true,
      message: 'Sincronização forçada concluída com sucesso!',
      status
    });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
});

// SPA Fallback
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
      message: 'API rodando normalmente.'
    });
  });
}

// Error handling middleware (sem expor stack trace interno)
app.use((err, req, res, next) => {
  console.error('❌ Error:', err.message);
  res.status(500).json({
    error: 'Internal server error',
    message: 'Ocorreu um erro interno no servidor.'
  });
});

app.listen(PORT, async () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`🛡️ DevSecOps Protection Layer active (JWT HMAC-SHA256 + Rate Limit + Anti-IDOR)`);

  try {
    const { syncActivePortfolioPrices } = await import('./routes/prices.routes.js');
    syncActivePortfolioPrices().catch((e) =>
      console.warn('⚠️ Background price sync warning:', e.message)
    );
    setInterval(() => {
      syncActivePortfolioPrices().catch((e) =>
        console.warn('⚠️ Scheduled price sync warning:', e.message)
      );
    }, 20 * 60 * 1000);
  } catch (e) {
    console.warn('⚠️ Could not initialize background price scheduler:', e.message);
  }
});
