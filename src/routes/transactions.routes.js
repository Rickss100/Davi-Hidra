
import express from 'express';
import { getDatabase } from '../services/database.service.js';
import { syncTransactionToTurso, syncTransactionDeleteToTurso } from '../services/turso.service.js';

const router = express.Router();
const db = getDatabase(); // Pegar instância do banco

// GET /api/transactions - List transactions with optional userId filter
router.get('/', (req, res) => {
  try {
    const userId = req.query.userId || req.headers['x-user-id'];
    
    let query = `
      SELECT t.*, a.type as category 
      FROM transactions t
      LEFT JOIN assets a ON t.asset_code = a.code
    `;
    const params = [];

    if (userId) {
      query += ` WHERE t.user_id = ? `;
      params.push(userId);
    }

    query += ` ORDER BY t.date DESC `;

    const transactions = db.prepare(query).all(...params);
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transactions - Create new transaction
router.post('/', async (req, res) => {
  console.log('📥 POST /api/transactions payload:', req.body);

  const targetCode = req.body.asset_code || req.body.code;
  const { type, quantity, price, date, notes, user_id } = req.body;
  const headerUserId = req.headers['x-user-id'];
  const finalUserId = user_id || headerUserId || 1; // fallback para usuário 1

  if (!targetCode || !type || !quantity || !price || !date) {
    console.error('❌ Missing fields:', { targetCode, type, quantity, price, date });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const total_value = Number(quantity) * Number(price);
    
    // Ensure asset exists (basic check, auto-create stub if doesn't exist)
    const asset = db.prepare('SELECT code, type FROM assets WHERE code = ?').get(targetCode);
    if (!asset) {
       console.log(`Auto-creating asset ${targetCode} for transaction`);
       let defaultType = 'acao';
       const uc = targetCode.toUpperCase();
       if (uc.includes('SELIC') || uc.includes('CDB') || uc.includes('DIARIA') || uc.includes('TESOURO') || uc.includes('LCI') || uc.includes('LCA') || req.body.category === 'fixed') {
         defaultType = 'RendaFixa';
       } else if (uc.includes('11') && !uc.includes('34')) {
         defaultType = 'FII';
       }
       const defaultMarket = (req.body.category === 'Stock' || req.body.category === 'REIT') ? 'US' : 'BR';
       
       db.prepare(`
         INSERT INTO assets (code, name, type, market)
         VALUES (?, ?, ?, ?)
       `).run(targetCode, targetCode, defaultType, defaultMarket);
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (asset_code, type, quantity, price, total_value, date, notes, user_id)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(targetCode, type, quantity, price, total_value, date, notes, finalUserId);
    
    const newTransaction = db.prepare(`
      SELECT t.*, a.type as category 
      FROM transactions t 
      LEFT JOIN assets a ON t.asset_code = a.code 
      WHERE t.id = ?
    `).get(info.lastInsertRowid);

    // ✅ Aguardar confirmação síncrona no Turso antes de retornar
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

// DELETE /api/transactions/:id - Remove transaction
router.delete('/:id', (req, res) => {
  try {
    const info = db.prepare('DELETE FROM transactions WHERE id = ?').run(req.params.id);
    if (info.changes === 0) {
      return res.status(404).json({ error: 'Transaction not found' });
    }

    // Sincronizar remoção na nuvem Turso se ativo
    syncTransactionDeleteToTurso(req.params.id).catch(err => console.warn('⚠️ Turso syncTransactionDelete error:', err.message));

    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
