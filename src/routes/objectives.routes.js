import express from 'express';
import { getDatabase } from '../services/database.service.js';
import { getTursoClient } from '../services/turso.service.js';
import { requireAuth, resolveAuthorizedUserId } from '../middleware/security.middleware.js';

const router = express.Router();

// Todas as rotas de objetivos exigem autenticação criptográfica válida
router.use(requireAuth);

const ensureTable = (db) => {
  db.prepare(`
    CREATE TABLE IF NOT EXISTS user_objectives (
      user_id   INTEGER PRIMARY KEY,
      macro_allocation TEXT NOT NULL DEFAULT '{}',
      asset_targets    TEXT NOT NULL DEFAULT '{}',
      updated_at TEXT DEFAULT (datetime('now'))
    )
  `).run();
};

/**
 * GET /api/objectives/:userId
 * Retorna macroAllocation e assetTargets salvos no banco para o usuário autorizado
 */
router.get('/:userId', (req, res) => {
  try {
    const authCheck = resolveAuthorizedUserId(req, req.params.userId);
    if (!authCheck.userId) {
      return res.status(authCheck.status).json({ error: authCheck.message });
    }
    const userId = authCheck.userId;

    const db = getDatabase();
    ensureTable(db);

    const row = db
      .prepare('SELECT macro_allocation, asset_targets FROM user_objectives WHERE user_id = ?')
      .get(userId);

    if (!row) {
      return res.json({ found: false, macroAllocation: null, assetTargets: null });
    }

    res.json({
      found: true,
      macroAllocation: JSON.parse(row.macro_allocation),
      assetTargets: JSON.parse(row.asset_targets)
    });
  } catch (err) {
    console.error('Erro ao buscar objetivos:', err);
    res.status(500).json({ error: 'Erro ao buscar objetivos', message: err.message });
  }
});

/**
 * POST /api/objectives/:userId
 * Salva ou atualiza macroAllocation e/ou assetTargets do usuário autorizado
 */
router.post('/:userId', async (req, res) => {
  try {
    const authCheck = resolveAuthorizedUserId(req, req.params.userId);
    if (!authCheck.userId) {
      return res.status(authCheck.status).json({ error: authCheck.message });
    }
    const userId = authCheck.userId;

    const db = getDatabase();
    ensureTable(db);

    const { macroAllocation, assetTargets } = req.body;

    const existing = db
      .prepare('SELECT macro_allocation, asset_targets FROM user_objectives WHERE user_id = ?')
      .get(userId);

    const currentMacro = existing
      ? JSON.parse(existing.macro_allocation)
      : {
          fixed: 20,
          variable: 80,
          brasil: 65,
          usa: 35,
          acoes: 50,
          fiis: 50,
          stocks: 70,
          reits: 30
        };
    const currentTargets = existing
      ? JSON.parse(existing.asset_targets)
      : {
          acoes: [],
          fiis: [],
          stocks: [],
          reits: [],
          fixed: [],
          reserva: []
        };

    const newMacro = macroAllocation ? { ...currentMacro, ...macroAllocation } : currentMacro;
    const newTargets = assetTargets ? { ...currentTargets, ...assetTargets } : currentTargets;

    db.prepare(`
      INSERT INTO user_objectives (user_id, macro_allocation, asset_targets, updated_at)
      VALUES (?, ?, ?, datetime('now'))
      ON CONFLICT(user_id) DO UPDATE SET
        macro_allocation = excluded.macro_allocation,
        asset_targets    = excluded.asset_targets,
        updated_at       = excluded.updated_at
    `).run(userId, JSON.stringify(newMacro), JSON.stringify(newTargets));

    try {
      const tClient = getTursoClient();
      if (tClient) {
        await tClient.execute(`
          CREATE TABLE IF NOT EXISTS user_objectives (
            user_id INTEGER PRIMARY KEY,
            macro_allocation TEXT,
            asset_targets TEXT,
            updated_at TEXT
          );
        `);

        await tClient.execute({
          sql: `
            INSERT INTO user_objectives (user_id, macro_allocation, asset_targets, updated_at)
            VALUES (?, ?, ?, ?)
            ON CONFLICT(user_id) DO UPDATE SET
              macro_allocation = excluded.macro_allocation,
              asset_targets = excluded.asset_targets,
              updated_at = excluded.updated_at
          `,
          args: [
            userId,
            JSON.stringify(newMacro),
            JSON.stringify(newTargets),
            new Date().toISOString()
          ]
        });
      }
    } catch (tErr) {
      console.warn('⚠️ Erro ao espelhar objetivos no Turso:', tErr.message);
    }

    res.json({ success: true, macroAllocation: newMacro, assetTargets: newTargets });
  } catch (err) {
    console.error('Erro ao salvar objetivos:', err);
    res.status(500).json({ error: 'Erro ao salvar objetivos', message: err.message });
  }
});

export default router;
