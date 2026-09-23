/**
 * Sync Routes
 * API endpoints for data synchronization
 */

import express from 'express';
import fetch from 'node-fetch';
import {
  syncAssetPrices,
  syncAssetFundamentals,
  syncEconomicIndicators,
  syncAll,
  setApiTokens
} from '../services/sync.service.js';
import { getAssets, getAssetsToSync, insertFundamentals, mergeFundamentals, upsertPrice, upsertAsset } from '../services/database.service.js';
import { syncRendaFixa } from '../services/rendafixa.service.js';
import { seedSP500Stocks, syncStocks } from '../services/stocks.service.js';
import { seedREITs, syncREITs } from '../services/reits.service.js';

const router = express.Router();

// Brapi token
const BRAPI_TOKEN = '6AC8B12Ck6WvvTnVEnUoSh';

// POST /api/sync/seed-assets - Populate database with available assets from Brapi
router.post('/seed-assets', async (req, res) => {
  try {
    console.log('🌱 Starting asset seed from Brapi...');
    
    // Fetch available stocks list from Brapi
    const url = `https://brapi.dev/api/quote/list?token=${BRAPI_TOKEN}&sortBy=name&sortOrder=asc`;
    const response = await fetch(url);
    
    if (!response.ok) {
      throw new Error(`Brapi list API error: ${response.status}`);
    }
    
    const data = await response.json();
    const stocks = data.stocks || [];
    
    if (stocks.length === 0) {
      return res.json({ message: 'No assets found from Brapi', inserted: 0 });
    }
    
    let insertedAcoes = 0;
    let insertedFIIs = 0;
    
    for (const stock of stocks) {
      // Determine type based on ticker pattern
      const code = stock.stock;
      if (!code) continue;
      
      // FIIs typically have 4 letters + 11, 11B, 12, or 13 (e.g., VISC11, HGLG11)
      const isFII = /^[A-Z]{4}(11B?|12|13)$/i.test(code);
      const type = isFII ? 'FII' : 'Acao';
      
      upsertAsset({
        code: code,
        name: stock.name || code,
        type: type,
        market: 'BR',
        sector: stock.sector || null
      });
      
      if (isFII) insertedFIIs++;
      else insertedAcoes++;
    }
    
    console.log(`🌱 Seed complete: ${insertedAcoes} ações, ${insertedFIIs} FIIs`);
    
    res.json({
      message: `Seed complete!`,
      total: stocks.length,
      acoes: insertedAcoes,
      fiis: insertedFIIs
    });
    
  } catch (error) {
    console.error('Seed error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/reload-full-data - Recarrega dados fundamentalistas completos de acoes.csv e fiis.csv
router.post('/reload-full-data', async (req, res) => {
  try {
    const fs = await import('fs');
    const path = await import('path');
    const { getDatabase } = await import('../services/database.service.js');
    const db = getDatabase();

    const parsePtBr = (val) => {
      if (val === null || val === undefined) return null;
      let str = String(val).trim();
      if (str === '' || str === '-' || str === 'N/A' || str === 'null') return null;
      str = str.replace('%', '').trim().replace(/\./g, '').replace(',', '.');
      const num = parseFloat(str);
      return isNaN(num) ? null : num;
    };

    const today = new Date().toISOString().split('T')[0];

    // Limpar e reconstruir tabelas limpas
    db.prepare("DELETE FROM fundamentals").run();
    db.prepare("DELETE FROM prices").run();
    db.prepare("DELETE FROM assets").run();

    const insertAssetStmt = db.prepare(`
      INSERT OR REPLACE INTO assets (code, name, type, market, sector, last_updated)
      VALUES (@code, @name, @type, 'BR', @sector, CURRENT_TIMESTAMP)
    `);

    const insertFundStmt = db.prepare(`
      INSERT INTO fundamentals (
        asset_code, pe_ratio, pb_ratio, psr, dividend_yield, ev_ebit, ev_ebitda,
        ebit_margin, profit_margin, current_ratio, roic, roe, liquidity, net_equity,
        debt_to_equity, revenue_growth_5y, p_vpa, ffo_yield, vacancy_rate, cap_rate,
        property_count, price_per_sqm, rent_per_sqm, market_cap, updated_at
      ) VALUES (
        @asset_code, @pe_ratio, @pb_ratio, @psr, @dividend_yield, @ev_ebit, @ev_ebitda,
        @ebit_margin, @profit_margin, @current_ratio, @roic, @roe, @liquidity, @net_equity,
        @debt_to_equity, @revenue_growth_5y, @p_vpa, @ffo_yield, @vacancy_rate, @cap_rate,
        @property_count, @price_per_sqm, @rent_per_sqm, @market_cap, CURRENT_TIMESTAMP
      )
    `);

    const insertPriceStmt = db.prepare(`
      INSERT OR REPLACE INTO prices (asset_code, date, open, high, low, close, volume)
      VALUES (@code, @date, @close, @close, @close, @close, @volume)
    `);

    let acoesCount = 0;
    let fiisCount = 0;

    // Ações
    const acoesFile = path.join(process.cwd(), 'src/data/acoes.csv');
    if (fs.existsSync(acoesFile)) {
      const content = fs.readFileSync(acoesFile, { encoding: 'latin1' });
      const lines = content.split('\n');

      const txAcoes = db.transaction(() => {
        for (let i = 2; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(';').map(c => c.trim());
          const code = cols[0];
          if (!code || code === 'Papel') continue;

          const price = parsePtBr(cols[1]);

          insertAssetStmt.run({ code, name: code, type: 'Acao', sector: null });
          if (price !== null) {
            insertPriceStmt.run({ code, date: today, close: price, volume: parsePtBr(cols[17]) || 0 });
          }

          insertFundStmt.run({
            asset_code: code,
            pe_ratio: parsePtBr(cols[2]),
            pb_ratio: parsePtBr(cols[3]),
            psr: parsePtBr(cols[4]),
            dividend_yield: parsePtBr(cols[5]),
            ev_ebit: parsePtBr(cols[10]),
            ev_ebitda: parsePtBr(cols[11]),
            ebit_margin: parsePtBr(cols[12]),
            profit_margin: parsePtBr(cols[13]),
            current_ratio: parsePtBr(cols[14]),
            roic: parsePtBr(cols[15]),
            roe: parsePtBr(cols[16]),
            liquidity: parsePtBr(cols[17]),
            net_equity: parsePtBr(cols[18]),
            debt_to_equity: parsePtBr(cols[19]),
            revenue_growth_5y: parsePtBr(cols[20]),
            p_vpa: parsePtBr(cols[3]),
            ffo_yield: null,
            vacancy_rate: null,
            cap_rate: null,
            property_count: null,
            price_per_sqm: null,
            rent_per_sqm: null,
            market_cap: null
          });
          acoesCount++;
        }
      });
      txAcoes();
    }

    // FIIs
    const fiisFile = path.join(process.cwd(), 'src/data/fiis.csv');
    if (fs.existsSync(fiisFile)) {
      const content = fs.readFileSync(fiisFile, { encoding: 'latin1' });
      const lines = content.split('\n');

      const txFiis = db.transaction(() => {
        for (let i = 2; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          const cols = line.split(';').map(c => c.trim());
          const code = cols[0];
          if (!code || code === 'Papel') continue;

          const sector = cols[1] || null;
          const price = parsePtBr(cols[2]);

          insertAssetStmt.run({ code, name: code, type: 'FII', sector });
          if (price !== null) {
            insertPriceStmt.run({ code, date: today, close: price, volume: parsePtBr(cols[7]) || 0 });
          }

          insertFundStmt.run({
            asset_code: code,
            pe_ratio: null,
            pb_ratio: parsePtBr(cols[5]),
            psr: null,
            dividend_yield: parsePtBr(cols[4]),
            ev_ebit: null,
            ev_ebitda: null,
            ebit_margin: null,
            profit_margin: null,
            current_ratio: null,
            roic: null,
            roe: null,
            liquidity: parsePtBr(cols[7]),
            net_equity: null,
            debt_to_equity: null,
            revenue_growth_5y: null,
            p_vpa: parsePtBr(cols[5]),
            ffo_yield: parsePtBr(cols[3]),
            vacancy_rate: parsePtBr(cols[12]),
            cap_rate: parsePtBr(cols[11]),
            property_count: parseInt(parsePtBr(cols[8])) || null,
            price_per_sqm: parsePtBr(cols[9]),
            rent_per_sqm: parsePtBr(cols[10]),
            market_cap: parsePtBr(cols[6])
          });
          fiisCount++;
        }
      });
      txFiis();
    }

    // Sincronizar também os ativos de Renda Fixa e Stocks (S&P 500)
    const rfResult = await syncRendaFixa();
    const stocksResult = await seedSP500Stocks();

    res.json({
      message: 'Base de dados 100% normalizada e recarregada com sucesso!',
      acoes: acoesCount,
      fiis: fiisCount,
      rendaFixa: rfResult?.total || 0,
      stocks: stocksResult?.total || 0,
      total: acoesCount + fiisCount + (rfResult?.total || 0) + (stocksResult?.total || 0)
    });
  } catch (error) {
    console.error('Reload full data error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/fundamentals-batch - Sincronização em lotes rápidos via Brapi com preservação dos fundamentos
router.post('/fundamentals-batch', async (req, res) => {
  try {
    const { type, limit = 50 } = req.body;
    
    // Obter ativos para sincronizar
    const assets = getAssetsToSync(limit, type);
    
    if (assets.length === 0) {
      return res.json({ success: 0, failed: 0, message: 'Nenhum ativo pendente de sincronização.' });
    }
    
    console.log(`📊 Iniciando atualização em lote para ${assets.length} ativos (${type || 'todos'})...`);
    
    let successCount = 0;
    let failedCount = 0;
    const today = new Date().toISOString().split('T')[0];
    
    // Agrupar tickers em lotes de 10 para requisições rápidas e eficientes na BRAPI
    const CHUNK_SIZE = 10;
    for (let i = 0; i < assets.length; i += CHUNK_SIZE) {
      const chunk = assets.slice(i, i + CHUNK_SIZE);
      const tickers = chunk.map(a => a.code).join(',');

      try {
        const url = `https://brapi.dev/api/quote/${tickers}?token=${BRAPI_TOKEN}&fundamental=true`;
        const response = await fetch(url);
        
        if (response.status === 429) {
          console.log(`  ⏳ Limite de requisições atingido. Aguardando 3 segundos...`);
          await new Promise(r => setTimeout(r, 3000));
          i -= CHUNK_SIZE; // Repete o lote
          continue;
        }

        if (!response.ok) {
          failedCount += chunk.length;
          continue;
        }

        const data = await response.json();
        const results = data.results || [];

        for (const item of results) {
          if (!item.symbol) continue;

          // 1. Atualizar cotação fresca
          if (item.regularMarketPrice) {
            upsertPrice({
              asset_code: item.symbol,
              date: today,
              open: item.regularMarketOpen || null,
              high: item.regularMarketDayHigh || null,
              low: item.regularMarketDayLow || null,
              close: item.regularMarketPrice,
              volume: item.regularMarketVolume || null
            });
          }

          // 2. Mesclar novos dados da BRAPI preservando os já existentes no banco
          mergeFundamentals({
            asset_code: item.symbol,
            pe_ratio: item.priceEarnings || null,
            pb_ratio: item.priceToBook || null,
            p_vpa: item.priceToBook || null,
            dividend_yield: item.dividendYield ? item.dividendYield * 100 : null,
            market_cap: item.marketCap || null
          });

          successCount++;
        }

        // Pequeno intervalo entre lotes
        await new Promise(r => setTimeout(r, 500));

      } catch (err) {
        console.error(`Erro no lote de tickers ${tickers}:`, err.message);
        failedCount += chunk.length;
      }
    }
    
    console.log(`📊 Sincronização concluída: ${successCount} atualizados com sucesso.`);
    
    res.json({
      success: successCount,
      failed: failedCount,
      total: assets.length,
      message: `Cotações e dados atualizados com sucesso (${successCount} ativos).`
    });
    
  } catch (error) {
    console.error('Batch sync error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/prices - Sync prices for multiple assets
router.post('/prices', async (req, res) => {
  try {
    const { codes } = req.body;
    
    if (!codes || !Array.isArray(codes) || codes.length === 0) {
      return res.status(400).json({ 
        error: 'Missing or invalid "codes" array in request body' 
      });
    }
    
    const result = await syncAssetPrices(codes);
    
    res.json({
      message: `Synced ${result.success.length} of ${result.total} assets`,
      ...result
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/fundamentals/:code - Sync fundamentals for one asset
router.post('/fundamentals/:code', async (req, res) => {
  try {
    const result = await syncAssetFundamentals(req.params.code);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/economic - Sync economic indicators
router.post('/economic', async (req, res) => {
  try {
    const result = await syncEconomicIndicators();
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/all - Full synchronization
router.post('/all', async (req, res) => {
  try {
    const { codes } = req.body;
    const assetCodes = codes || [];
    
    const result = await syncAll(assetCodes);
    res.json(result);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/tokens - Update API tokens
router.post('/tokens', (req, res) => {
  try {
    const { brapiToken, alphaVantageKey } = req.body;
    
    setApiTokens({ brapiToken, alphaVantageKey });
    
    res.json({ 
      message: 'API tokens updated successfully',
      brapiToken: brapiToken ? '***' : 'not set',
      alphaVantageKey: alphaVantageKey ? '***' : 'not set'
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/renda-fixa - Sincroniza catálogo de Renda Fixa e taxas BACEN
router.post('/renda-fixa', async (req, res) => {
  try {
    const result = await syncRendaFixa();
    res.json({
      message: 'Catálogo de Renda Fixa sincronizado com sucesso!',
      ...result
    });
  } catch (error) {
    console.error('Error syncing Renda Fixa:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/stocks - Sincroniza catálogo de Stocks (S&P 500)
router.post('/stocks', async (req, res) => {
  try {
    const result = await syncStocks();
    res.json({
      message: 'Ações do S&P 500 sincronizadas com sucesso!',
      ...result
    });
  } catch (error) {
    console.error('Error syncing stocks:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/sync/reits - Sincroniza catálogo de REITs
router.post('/reits', async (req, res) => {
  try {
    const result = await syncREITs();
    res.json({
      message: 'Catálogo de REITs sincronizado com sucesso!',
      ...result
    });
  } catch (error) {
    console.error('Error syncing REITs:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
