
import express from 'express';
import { getDatabase } from '../services/database.service.js';

const router = express.Router();
const db = getDatabase(); // Pegar instância do banco

// GET /api/transactions - List all transactions
router.get('/', (req, res) => {
  try {
    const transactions = db.prepare(`
      SELECT t.*, a.type as category 
      FROM transactions t
      LEFT JOIN assets a ON t.asset_code = a.code
      ORDER BY t.date DESC
    `).all();
    res.json(transactions);
  } catch (error) {
    console.error('Error fetching transactions:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/transactions - Create new transaction
router.post('/', (req, res) => {
  console.log('📥 POST /api/transactions payload:', req.body); // DEBUG LOG

  const { asset_code, type, quantity, price, date, notes } = req.body;

  if (!asset_code || !type || !quantity || !price || !date) {
    console.error('❌ Missing fields:', { asset_code, type, quantity, price, date });
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const total_value = Number(quantity) * Number(price);
    
    // Ensure asset exists (basic check, auto-create stub if doesn't exist)
    const asset = db.prepare('SELECT code FROM assets WHERE code = ?').get(asset_code);
    if (!asset) {
       console.log(`Auto-creating asset ${asset_code} for transaction`);
       // Infer type/market/name as bare minimum placeholders
       // Ideally we would fetch metadata, but for now let's just allow the transaction to proceed
       const defaultType = 'acao'; // fallback
       const defaultMarket = 'BR'; // fallback
       
       db.prepare(`
         INSERT INTO assets (code, name, type, market)
         VALUES (?, ?, ?, ?)
       `).run(asset_code, `Auto-created ${asset_code}`, defaultType, defaultMarket);
    }

    const stmt = db.prepare(`
      INSERT INTO transactions (asset_code, type, quantity, price, total_value, date, notes)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    
    const info = stmt.run(asset_code, type, quantity, price, total_value, date, notes);
    
    const newTransaction = db.prepare('SELECT * FROM transactions WHERE id = ?').get(info.lastInsertRowid);
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
    res.json({ message: 'Transaction deleted' });
  } catch (error) {
    console.error('Error deleting transaction:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
