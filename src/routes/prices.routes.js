/**
 * Prices Routes & Global Server-Side Price Cache Engine
 * Centraliza a busca de cotações no servidor e persiste no SQLite + Turso Cloud,
 * garantindo carregamento instantâneo (<10ms) para 1.000+ usuários simultâneos.
 */

import express from 'express';
import {
  getDatabase,
  getLatestPrice,
  getPriceHistory,
  upsertPrice
} from '../services/database.service.js';
import { getBrapiQuote } from '../services/brapi.service.js';
import { syncPricesToTurso } from '../services/turso.service.js';

const router = express.Router();
const BRAPI_TOKEN = process.env.BRAPI_TOKEN || '6AC8B12Ck6WvvTnVEnUoSh';

let isGlobalSyncRunning = false;
let lastGlobalSyncAt = null;

/**
 * Helper: Retorna mapa { TICKER: closePrice } de todas as cotações mais recentes no SQLite
 */
export function getAllLatestPricesMap() {
  const db = getDatabase();
  const rows = db.prepare(`
    SELECT p.asset_code, p.close, p.date
    FROM prices p
    INNER JOIN (
      SELECT asset_code, MAX(date) as max_date
      FROM prices
      GROUP BY asset_code
    ) m ON p.asset_code = m.asset_code AND p.date = m.max_date
  `).all();

  const prices = {};
  for (const r of rows) {
    if (r.asset_code && Number(r.close) > 0) {
      prices[String(r.asset_code).toUpperCase()] = Number(r.close);
    }
  }
  return prices;
}

/**
 * Sincroniza no servidor todas as cotações dos ativos presentes nas carteiras e objetivos dos usuários
 */
export async function syncActivePortfolioPrices() {
  if (isGlobalSyncRunning) {
    return { success: true, alreadyRunning: true, prices: getAllLatestPricesMap() };
  }

  isGlobalSyncRunning = true;
  try {
    const db = getDatabase();
    const txTickers = db.prepare("SELECT DISTINCT asset_code FROM transactions WHERE type = 'buy'").all().map(r => r.asset_code);

    // Também incluir ativos das Réguas de Objetivos dos usuários
    const objRows = db.prepare("SELECT asset_targets FROM user_objectives").all();
    const targetTickers = [];
    for (const row of objRows) {
      try {
        const parsed = JSON.parse(row.asset_targets || '{}');
        for (const cat of ['acoes', 'fiis']) {
          for (const item of (parsed[cat] || [])) {
            const code = item.code || item.ticker;
            if (code) targetTickers.push(code);
          }
        }
      } catch {}
    }

    const uniqueTickers = Array.from(new Set([...txTickers, ...targetTickers].map(t => String(t || '').trim().toUpperCase())))
      .filter(code => {
        if (!code || code.length < 4 || code.length > 7) return false;
        if (code.includes('TESOURO') || code.includes('SELIC') || code.includes('CDB') || code.includes('LCI') || code.includes('LCA')) return false;
        return /^[A-Z]{4}\d{1,2}B?$/.test(code);
      });

    console.log(`⚡ [Global Price Cache] Atualizando ${uniqueTickers.length} ativos ativos na Brapi...`);
    const today = new Date().toISOString().split('T')[0];
    const updatedMap = {};
    const checkAsset = db.prepare('SELECT code FROM assets WHERE code = ?');
    const insertAsset = db.prepare('INSERT INTO assets (code, name, type, market) VALUES (?, ?, ?, ?)');

    for (const ticker of uniqueTickers) {
      try {
        const quote = await getBrapiQuote(ticker, BRAPI_TOKEN);
        if (quote && Number(quote.price) > 0) {
          if (!checkAsset.get(ticker)) {
            const isFii = ticker.includes('11') && !ticker.includes('34');
            try { insertAsset.run(ticker, ticker, isFii ? 'FII' : 'acao', 'BR'); } catch {}
          }
          upsertPrice({
            asset_code: ticker,
            date: today,
            open: quote.price,
            high: quote.dayHigh || quote.price,
            low: quote.dayLow || quote.price,
            close: quote.price,
            volume: quote.volume || 0
          });
          updatedMap[ticker] = Number(quote.price);
        }
      } catch (err) {
        // Prosseguir silenciosamente para o próximo ativo
      }
    }

    if (Object.keys(updatedMap).length > 0) {
      await syncPricesToTurso(updatedMap);
      lastGlobalSyncAt = new Date().toISOString();
    }

    const allPrices = getAllLatestPricesMap();
    console.log(`✅ [Global Price Cache] ${Object.keys(updatedMap).length}/${uniqueTickers.length} ativos atualizados com sucesso.`);
    return {
      success: true,
      updatedCount: Object.keys(updatedMap).length,
      totalActiveTickers: uniqueTickers.length,
      lastGlobalSyncAt,
      prices: allPrices
    };
  } finally {
    isGlobalSyncRunning = false;
  }
}

// GET /api/prices/latest-all - Retorna todas as cotações em cache instantaneamente (<10ms)
router.get('/latest-all', (req, res) => {
  try {
    const prices = getAllLatestPricesMap();
    res.json({
      prices,
      count: Object.keys(prices).length,
      lastGlobalSyncAt
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/prices/sync-active - Dispara atualização centralizada no servidor + Turso
router.post('/sync-active', async (req, res) => {
  try {
    const result = await syncActivePortfolioPrices();
    res.json(result);
  } catch (error) {
    res.status(500).json({ success: false, error: error.message });
  }
});

// GET /api/prices/:code/latest - Get latest price for an asset
router.get('/:code/latest', (req, res) => {
  try {
    const price = getLatestPrice(req.params.code.toUpperCase());
    if (!price) {
      return res.status(404).json({ error: 'No price data found for this asset' });
    }
    res.json(price);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// GET /api/prices/:code/history - Get price history
router.get('/:code/history', (req, res) => {
  try {
    const days = parseInt(req.query.days) || 30;
    const history = getPriceHistory(req.params.code.toUpperCase(), days);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/prices - Add new price
router.post('/', (req, res) => {
  try {
    const { asset_code, date, open, high, low, close, volume } = req.body;
    if (!asset_code || !date || !close) {
      return res.status(400).json({ error: 'Missing required fields: asset_code, date, close' });
    }
    upsertPrice({
      asset_code: asset_code.toUpperCase(),
      date,
      open,
      high,
      low,
      close,
      volume
    });
    res.status(201).json({ message: 'Price created/updated successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
