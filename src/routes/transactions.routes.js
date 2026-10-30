import express from 'express';
import { getDatabase, getUserById } from '../services/database.service.js';
import {
  syncTransactionToTurso,
  syncTransactionDeleteToTurso,
  syncAssetToTurso
} from '../services/turso.service.js';
import { requireAuth, resolveAuthorizedUserId } from '../middleware/security.middleware.js';

const router = express.Router();
const db = getDatabase();

// Todas as rotas de transações exigem autenticação criptográfica válida
router.use(requireAuth);

// GET /api/transactions - Lista apenas as transações da carteira autorizada (Anti-IDOR)
router.get('/', (req, res) => {
  try {
    const authCheck = resolveAuthorizedUserId(req, req.query.userId);
    if (!authCheck.userId) {
      return res.status(authCheck.status).json({ error: authCheck.message });
    }

    const transactions = db
      .prepare(`
        SELECT t.*, a.type as category 
        FROM transactions t
        LEFT JOIN assets a ON t.asset_code = a.code
        WHERE t.user_id = ?
        ORDER BY t.date DESC
      `)
      .all(authCheck.userId);

    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transactions - Cria nova transação estritamente vinculada ao usuário autorizado
router.post('/', async (req, res) => {
  const targetCode = req.body.asset_code || req.body.code;
  const { type, quantity, price, date, notes, user_id } = req.body;

  const authCheck = resolveAuthorizedUserId(req, user_id);
  if (!authCheck.userId) {
    return res.status(authCheck.status).json({ error: authCheck.message });
  }
  const finalUserId = authCheck.userId;

  const user = getUserById(finalUserId);
  if (
    user &&
    user.role === 'user' &&
    (user.status === 'suspended' || user.isPlanExpired || user.status === 'inactive')
  ) {
    return res.status(403).json({
      error: 'ACCOUNT_SUSPENDED',
      message: 'Sua conta está suspensa ou inativa. Inclusão de novos ativos e aportes bloqueada.'
    });
  }

  if (!targetCode || !type || !quantity || !price || !date) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const total_value = Number(quantity) * Number(price);

    const asset = db.prepare('SELECT code, type FROM assets WHERE code = ?').get(targetCode);
    if (!asset) {
      let defaultType = 'acao';
      const uc = String(targetCode).toUpperCase();
      if (
        uc.includes('SELIC') ||
        uc.includes('CDB') ||
        uc.includes('DIARIA') ||
        uc.includes('TESOURO') ||
        uc.includes('LCI') ||
        uc.includes('LCA') ||
        req.body.category === 'fixed'
      ) {
        defaultType = 'RendaFixa';
      } else if (uc.includes('11') && !uc.includes('34')) {
        defaultType = 'FII';
      }
      const defaultMarket =
        req.body.category === 'Stock' || req.body.category === 'REIT' ? 'US' : 'BR';

      db.prepare(`
        INSERT INTO assets (code, name, type, market)
        VALUES (?, ?, ?, ?)
      `).run(targetCode, targetCode, defaultType, defaultMarket);
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (asset_code, type, quantity, price, total_value, date, notes, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const info = stmt.run(
      targetCode,
      type,
      quantity,
      price,
      total_value,
      date,
      notes,
      finalUserId
    );

    const newTransaction = db
      .prepare(`
        SELECT t.*, a.type as category 
        FROM transactions t 
        LEFT JOIN assets a ON t.asset_code = a.code 
        WHERE t.id = ?
      `)
      .get(info.lastInsertRowid);

    try {
      await syncTransactionToTurso(newTransaction);
    } catch (tursoErr) {
      console.warn('⚠️ Turso syncTransaction error:', tursoErr.message);
    }

    res.status(201).json(newTransaction);
  } catch (error) {
    console.error('Error creating transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/transactions/:id - Remove transação validando propriedade (Anti-IDOR)
router.delete('/:id', async (req, res) => {
  try {
    const tx = db.prepare('SELECT * FROM transactions WHERE id = ?').get(req.params.id);
    if (!tx) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Verifica se o usuário autenticado é dono da transação (ou Admin/Colaborador em auditoria)
    const authCheck = resolveAuthorizedUserId(req, tx.user_id);
    if (!authCheck.userId) {
      return res.status(authCheck.status).json({ error: authCheck.message });
    }

    const user = getUserById(authCheck.userId);
    if (
      req.authUser.role === 'user' &&
      user &&
      (user.status === 'suspended' || user.isPlanExpired || user.status === 'inactive')
    ) {
      return res.status(403).json({
        error: 'ACCOUNT_SUSPENDED',
        message: 'Sua conta está suspensa ou inativa. Exclusão de transações bloqueada.'
      });
    }

    try {
      await syncTransactionDeleteToTurso(req.params.id);
    } catch (tursoErr) {
      console.warn('⚠️ Turso syncTransactionDelete error:', tursoErr.message);
    }

    const info = db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transactions/bulk - Importação em lote com isolamento estrito por usuário autorizado
router.post('/bulk', async (req, res) => {
  try {
    const { transactions } = req.body;

    if (!transactions || !Array.isArray(transactions) || transactions.length === 0) {
      return res.status(400).json({ error: 'Nenhuma transação enviada para importação.' });
    }

    const requestedUserId = transactions[0]?.user_id;
    const authCheck = resolveAuthorizedUserId(req, requestedUserId);
    if (!authCheck.userId) {
      return res.status(authCheck.status).json({ error: authCheck.message });
    }
    const targetUserId = authCheck.userId;

    const insert = db.prepare(`
      INSERT INTO transactions (asset_code, type, quantity, price, total_value, date, notes, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    const checkAsset = db.prepare('SELECT code FROM assets WHERE code = ?');
    const insertAsset = db.prepare(
      'INSERT INTO assets (code, name, type, market) VALUES (?, ?, ?, ?)'
    );
    const checkTx = db.prepare(
      'SELECT id FROM transactions WHERE asset_code = ? AND date = ? AND quantity = ? AND type = ? AND user_id = ?'
    );

    const insertMany = db.transaction((txs) => {
      const actuallyInserted = [];
      for (const tx of txs) {
        const txExists = checkTx.get(
          tx.asset_code,
          tx.date,
          tx.quantity,
          tx.type,
          targetUserId
        );
        if (txExists) continue;

        const assetExists = checkAsset.get(tx.asset_code);
        if (!assetExists) {
          let defaultType = 'acao';
          const uc = String(tx.asset_code).toUpperCase();
          if (
            uc.includes('SELIC') ||
            uc.includes('CDB') ||
            uc.includes('DIARIA') ||
            uc.includes('TESOURO') ||
            uc.includes('LCI') ||
            uc.includes('LCA') ||
            uc.includes('RDB')
          ) {
            defaultType = 'RendaFixa';
          } else if (uc.includes('11') && !uc.includes('34')) {
            defaultType = 'FII';
          }
          insertAsset.run(tx.asset_code, tx.asset_code, defaultType, 'BR');
        }

        insert.run(
          tx.asset_code,
          tx.type,
          tx.quantity,
          tx.price,
          tx.total_value || tx.quantity * tx.price,
          tx.date,
          tx.notes || 'Importação via Planilha',
          targetUserId
        );
        actuallyInserted.push({ ...tx, user_id: targetUserId });
      }
      return actuallyInserted;
    });

    const newTransactions = insertMany(transactions);

    try {
      const getTx = db.prepare(
        'SELECT t.*, a.type as category FROM transactions t LEFT JOIN assets a ON t.asset_code = a.code WHERE t.id = ?'
      );
      const getAsset = db.prepare('SELECT * FROM assets WHERE code = ?');

      for (const tx of newTransactions) {
        const assetRow = getAsset.get(tx.asset_code);
        if (assetRow) {
          await syncAssetToTurso(assetRow);
        }

        const row = db
          .prepare(
            'SELECT id FROM transactions WHERE asset_code = ? AND date = ? AND quantity = ? AND user_id = ? ORDER BY id DESC LIMIT 1'
          )
          .get(tx.asset_code, tx.date, tx.quantity, targetUserId);

        if (row) {
          const fullTx = getTx.get(row.id);
          if (fullTx) {
            await syncTransactionToTurso(fullTx);
          }
        }
      }
    } catch (e) {
      console.warn('Turso bulk sync error', e);
    }

    res.json({
      success: true,
      count: newTransactions.length,
      message: `${newTransactions.length} transações importadas com sucesso.`
    });
  } catch (err) {
    console.error('Erro no import em lote:', err);
    res.status(500).json({ error: 'Erro ao importar transações', details: err.message });
  }
});

export default router;
