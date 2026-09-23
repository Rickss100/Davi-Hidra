import express from 'express';
import { getDatabase } from '../services/database.service.js';

const router = express.Router();

/**
 * GET /api/resumo/metrics
 * Retorna as métricas essenciais consolidadas da carteira do usuário
 */
router.get('/metrics', (req, res) => {
  try {
    const userId = parseInt(req.query.userId || req.headers['x-user-id'] || '1', 10);
    const db = getDatabase();

    // 1. Obter transações e posições atuais do usuário
    const holdingsRows = db.prepare(`
      SELECT 
        t.asset_code,
        SUM(CASE WHEN t.type = 'buy' THEN t.quantity ELSE -t.quantity END) as quantity,
        SUM(CASE WHEN t.type = 'buy' THEN t.total_value ELSE -t.total_value END) as invested,
        AVG(t.price) as avg_price,
        a.name,
        a.type as category
      FROM transactions t
      JOIN assets a ON a.code = t.asset_code
      WHERE t.user_id = ?
      GROUP BY t.asset_code
      HAVING quantity > 0
    `).all(userId);

    let totalEquity = 0;
    let investedCapital = 0;

    holdingsRows.forEach(h => {
      investedCapital += Number(h.invested);

      // Buscar último preço
      const priceRow = db.prepare(`
        SELECT close FROM prices WHERE asset_code = ? ORDER BY date DESC LIMIT 1
      `).get(h.asset_code);

      const currentPrice = priceRow?.close || h.avg_price || 1;
      totalEquity += (Number(h.quantity) * currentPrice);
    });

    // Se a carteira estiver vazia, usar valores mínimos para não dividir por zero
    const profitBRL = totalEquity - investedCapital;
    const returnPct = investedCapital > 0 ? (profitBRL / investedCapital) * 100 : 0;

    // 2. Proventos acumulados recebidos
    const userCodes = holdingsRows.map(h => `'${h.asset_code}'`).join(',');
    let totalDividends = 0;
    if (userCodes.length > 0) {
      const divRow = db.prepare(`
        SELECT SUM(amount) as total 
        FROM dividends 
        WHERE asset_code IN (${userCodes}) 
          AND payment_date <= date('now')
      `).get();
      totalDividends = divRow?.total ? Number(divRow.total) : 0;
    }

    // 3. Benchmarks de mercado de referência do período
    const cdiPerformance = 11.25; // % acumulado de referência
    const ibovPerformance = 12.80; // % acumulado de referência B3
    const sp500Performance = 18.90; // % acumulado S&P 500
    const ipcaPerformance = 4.35;  // % acumulado inflação oficial
    const ifixPerformance = 9.80;  // % acumulado IFIX fundos imobiliários

    const alphaVsCdi = returnPct - cdiPerformance;
    const alphaVsIbov = returnPct - ibovPerformance;
    const pctOfCdi = cdiPerformance > 0 ? (returnPct / cdiPerformance) * 100 : 0;

    res.json({
      totalEquity: Number(totalEquity.toFixed(2)),
      investedCapital: Number(investedCapital.toFixed(2)),
      totalProfitBRL: Number(profitBRL.toFixed(2)),
      totalReturnPct: Number(returnPct.toFixed(2)),
      totalDividendsBRL: Number(totalDividends.toFixed(2)),
      benchmarks: {
        cdi: cdiPerformance,
        ibov: ibovPerformance,
        sp500: sp500Performance,
        ipca: ipcaPerformance,
        ifix: ifixPerformance
      },
      comparisons: {
        pctOfCdi: Number(pctOfCdi.toFixed(1)),
        alphaVsCdi: Number(alphaVsCdi.toFixed(2)),
        alphaVsIbov: Number(alphaVsIbov.toFixed(2)),
        isOutperformingCdi: returnPct >= cdiPerformance,
        isOutperformingIbov: returnPct >= ibovPerformance
      }
    });
  } catch (err) {
    console.error('Erro ao buscar métricas de resumo:', err);
    res.status(500).json({ error: 'Erro ao buscar métricas', message: err.message });
  }
});

/**
 * GET /api/resumo/benchmark-data
 * Retorna série histórica para o gráfico comparativo (Carteira vs S&P 500 vs Ibov vs Selic/CDI vs IPCA vs IFIX)
 */
router.get('/benchmark-data', (req, res) => {
  try {
    const userId = parseInt(req.query.userId || req.headers['x-user-id'] || '1', 10);
    const period = req.query.period || '12m'; // '6m', 'ytd', '12m', '24m', 'total'
    const db = getDatabase();

    // 1. Obter posições reais do usuário para verificar se há aportes e calcular rentabilidade real
    const holdingsRows = db.prepare(`
      SELECT 
        t.asset_code,
        SUM(CASE WHEN t.type = 'buy' THEN t.quantity ELSE -t.quantity END) as quantity,
        SUM(CASE WHEN t.type = 'buy' THEN t.total_value ELSE -t.total_value END) as invested,
        AVG(t.price) as avg_price
      FROM transactions t
      WHERE t.user_id = ?
      GROUP BY t.asset_code
      HAVING quantity > 0
    `).all(userId);

    let totalEquity = 0;
    let investedCapital = 0;

    holdingsRows.forEach(h => {
      investedCapital += Number(h.invested);
      const priceRow = db.prepare(`
        SELECT close FROM prices WHERE asset_code = ? ORDER BY date DESC LIMIT 1
      `).get(h.asset_code);
      const currentPrice = priceRow?.close || h.avg_price || 1;
      totalEquity += (Number(h.quantity) * currentPrice);
    });

    const hasInvestments = investedCapital > 0;
    const realReturnPct = hasInvestments ? ((totalEquity - investedCapital) / investedCapital) * 100 : 0;

    // Definir quantos meses gerar
    let monthCount = 12;
    if (period === '6m') monthCount = 6;
    else if (period === 'ytd') monthCount = 4;
    else if (period === '24m') monthCount = 24;
    else if (period === 'total') monthCount = 36;

    const dataPoints = [];
    const now = new Date();

    // Variações mensais aproximadas dos índices de mercado
    let sp500Acum = 0;
    let ibovAcum = 0;
    let cdiAcum = 0;
    let ipcaAcum = 0;
    let ifixAcum = 0;

    const monthlyVariations = [
      { sp500: 2.1, ibov: 1.8, cdi: 0.88, ipca: 0.35, ifix: 0.75 },
      { sp500: 1.9, ibov: -0.5, cdi: 0.86, ipca: 0.40, ifix: 0.80 },
      { sp500: 2.5, ibov: 2.4, cdi: 0.89, ipca: 0.32, ifix: 0.90 },
      { sp500: -1.2, ibov: -2.8, cdi: 0.87, ipca: 0.38, ifix: 0.45 },
      { sp500: 3.0, ibov: 1.5, cdi: 0.91, ipca: 0.30, ifix: 0.85 },
      { sp500: 1.7, ibov: 0.8, cdi: 0.90, ipca: 0.34, ifix: 0.70 },
      { sp500: 2.2, ibov: 3.1, cdi: 0.92, ipca: 0.28, ifix: 0.95 },
      { sp500: -0.8, ibov: -1.9, cdi: 0.88, ipca: 0.35, ifix: 0.60 },
      { sp500: 2.4, ibov: 1.7, cdi: 0.89, ipca: 0.31, ifix: 0.82 },
      { sp500: 1.5, ibov: 0.4, cdi: 0.87, ipca: 0.36, ifix: 0.78 },
      { sp500: 3.2, ibov: 2.8, cdi: 0.90, ipca: 0.29, ifix: 0.90 },
      { sp500: 1.8, ibov: 1.2, cdi: 0.88, ipca: 0.33, ifix: 0.85 }
    ];

    for (let i = monthCount; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = d.toLocaleDateString('pt-BR', { month: 'short', year: '2-digit' }).replace('.', '');

      if (i === monthCount) {
        dataPoints.push({
          date: label,
          fullDate: d.toISOString().split('T')[0],
          carteira: 0,
          sp500: 0,
          ibov: 0,
          cdi: 0,
          ipca: 0,
          ifix: 0
        });
      } else {
        const v = monthlyVariations[(monthCount - i) % monthlyVariations.length];
        sp500Acum = ((1 + sp500Acum / 100) * (1 + v.sp500 / 100) - 1) * 100;
        ibovAcum = ((1 + ibovAcum / 100) * (1 + v.ibov / 100) - 1) * 100;
        cdiAcum = ((1 + cdiAcum / 100) * (1 + v.cdi / 100) - 1) * 100;
        ipcaAcum = ((1 + ipcaAcum / 100) * (1 + v.ipca / 100) - 1) * 100;
        ifixAcum = ((1 + ifixAcum / 100) * (1 + v.ifix / 100) - 1) * 100;

        // Se o usuário não tem investimentos, a carteira fica zerada (0.00%)
        // Se possui investimentos, interpola progressivamente até o retorno real
        let carteiraVal = 0;
        if (hasInvestments) {
          const progress = (monthCount - i) / monthCount;
          carteiraVal = Number((realReturnPct * progress).toFixed(2));
        }

        dataPoints.push({
          date: label,
          fullDate: d.toISOString().split('T')[0],
          carteira: carteiraVal,
          sp500: Number(sp500Acum.toFixed(2)),
          ibov: Number(ibovAcum.toFixed(2)),
          cdi: Number(cdiAcum.toFixed(2)),
          ipca: Number(ipcaAcum.toFixed(2)),
          ifix: Number(ifixAcum.toFixed(2))
        });
      }
    }

    res.json({
      period,
      hasInvestments,
      realReturnPct: Number(realReturnPct.toFixed(2)),
      investedCapital: Number(investedCapital.toFixed(2)),
      totalEquity: Number(totalEquity.toFixed(2)),
      dataPoints
    });
  } catch (err) {
    console.error('Erro ao gerar benchmark:', err);
    res.status(500).json({ error: 'Erro ao gerar dados de benchmark', message: err.message });
  }
});

/**
 * GET /api/resumo/allocation
 * Retorna divisão patrimonial por classe de ativo e moeda
 */
router.get('/allocation', (req, res) => {
  try {
    const userId = parseInt(req.query.userId || req.headers['x-user-id'] || '1', 10);
    const db = getDatabase();

    const holdings = db.prepare(`
      SELECT 
        t.asset_code,
        SUM(CASE WHEN t.type = 'buy' THEN t.quantity ELSE -t.quantity END) as quantity,
        SUM(CASE WHEN t.type = 'buy' THEN t.total_value ELSE -t.total_value END) as invested,
        AVG(t.price) as avg_price,
        a.type as category,
        a.market
      FROM transactions t
      JOIN assets a ON a.code = t.asset_code
      WHERE t.user_id = ?
      GROUP BY t.asset_code
      HAVING quantity > 0
    `).all(userId);

    const categoriesMap = {
      acoes: { name: 'Ações B3', invested: 0, current: 0, color: '#10b981' },
      fiis: { name: 'Fundos Imobiliários', invested: 0, current: 0, color: '#a855f7' },
      stocks: { name: 'Stocks (EUA)', invested: 0, current: 0, color: '#f59e0b' },
      reits: { name: 'REITs (EUA)', invested: 0, current: 0, color: '#38bdf8' },
      fixed: { name: 'Renda Fixa & Reserva', invested: 0, current: 0, color: '#04d361' }
    };

    let totalEquity = 0;
    let totalInvested = 0;
    let brlTotal = 0;
    let usdTotal = 0;

    holdings.forEach(h => {
      const cat = String(h.category).toLowerCase();
      let key = 'acoes';
      if (cat.includes('fii')) key = 'fiis';
      else if (cat.includes('stock')) key = 'stocks';
      else if (cat.includes('reit')) key = 'reits';
      else if (cat.includes('renda') || cat.includes('fix')) key = 'fixed';

      const priceRow = db.prepare(`
        SELECT close FROM prices WHERE asset_code = ? ORDER BY date DESC LIMIT 1
      `).get(h.asset_code);

      const price = priceRow?.close || h.avg_price || 1;
      const curVal = h.quantity * price;
      const invVal = Number(h.invested);

      categoriesMap[key].current += curVal;
      categoriesMap[key].invested += invVal;

      totalEquity += curVal;
      totalInvested += invVal;

      if (h.market === 'US' || key === 'stocks' || key === 'reits') {
        usdTotal += curVal;
      } else {
        brlTotal += curVal;
      }
    });

    const categoriesList = Object.keys(categoriesMap).map(k => {
      const c = categoriesMap[k];
      const percent = totalEquity > 0 ? (c.current / totalEquity) * 100 : 0;
      const profit = c.current - c.invested;
      const returnPct = c.invested > 0 ? (profit / c.invested) * 100 : 0;

      return {
        key: k,
        name: c.name,
        invested: Number(c.invested.toFixed(2)),
        current: Number(c.current.toFixed(2)),
        percent: Number(percent.toFixed(1)),
        profit: Number(profit.toFixed(2)),
        returnPct: Number(returnPct.toFixed(2)),
        color: c.color
      };
    }).filter(c => c.current > 0 || c.invested > 0);

    res.json({
      totalEquity: Number(totalEquity.toFixed(2)),
      totalInvested: Number(totalInvested.toFixed(2)),
      categories: categoriesList,
      geography: {
        brasilPct: totalEquity > 0 ? Number(((brlTotal / totalEquity) * 100).toFixed(1)) : 0,
        usaPct: totalEquity > 0 ? Number(((usdTotal / totalEquity) * 100).toFixed(1)) : 0,
        brlTotal: Number(brlTotal.toFixed(2)),
        usdTotal: Number(usdTotal.toFixed(2))
      }
    });
  } catch (err) {
    console.error('Erro na alocação:', err);
    res.status(500).json({ error: 'Erro ao buscar alocação', message: err.message });
  }
});

export default router;
