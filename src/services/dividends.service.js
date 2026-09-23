import { getDatabase } from './database.service.js';

/**
 * Service for managing dividends and calculating passive income calendar
 */

/**
 * Upsert a dividend record
 */
export function upsertDividend(dividend) {
  const db = getDatabase();
  const stmt = db.prepare(`
    INSERT INTO dividends (asset_code, ex_date, payment_date, amount, type)
    VALUES (?, ?, ?, ?, ?)
  `);
  return stmt.run(
    dividend.asset_code,
    dividend.ex_date,
    dividend.payment_date,
    dividend.amount,
    dividend.type || 'rendimento'
  );
}

/**
 * Seed realistic dividend calendar data for popular assets (FIIs, Ações, Stocks, REITs)
 */
export function seedDividendsData() {
  const db = getDatabase();

  // Tabela de proventos padrão por ativo (valor médio por cota e dias de pagamento típicos)
  const defaultDividendSchedule = [
    // --- FIIs (Pagamento mensal tradicional) ---
    { code: 'HGLG11', type: 'rendimento', day: 14, amount: 1.10, months: [1,2,3,4,5,6,7,8,9,10,11,12] },
    { code: 'KNIP11', type: 'rendimento', day: 12, amount: 0.82, months: [1,2,3,4,5,6,7,8,9,10,11,12] },
    { code: 'MXRF11', type: 'rendimento', day: 15, amount: 0.10, months: [1,2,3,4,5,6,7,8,9,10,11,12] },
    { code: 'XPML11', type: 'rendimento', day: 25, amount: 0.92, months: [1,2,3,4,5,6,7,8,9,10,11,12] },
    { code: 'BTLG11', type: 'rendimento', day: 15, amount: 0.78, months: [1,2,3,4,5,6,7,8,9,10,11,12] },
    { code: 'VISC11', type: 'rendimento', day: 14, amount: 0.85, months: [1,2,3,4,5,6,7,8,9,10,11,12] },
    { code: 'CPTS11', type: 'rendimento', day: 18, amount: 0.08, months: [1,2,3,4,5,6,7,8,9,10,11,12] },
    { code: 'VGIR11', type: 'rendimento', day: 19, amount: 0.11, months: [1,2,3,4,5,6,7,8,9,10,11,12] },

    // --- Ações B3 (Mensais, Trimestrais e Semestrais) ---
    { code: 'ITUB4', type: 'jcp', day: 1, amount: 0.0176, months: [1,2,3,4,5,6,7,8,9,10,11,12] }, // JCP mensal
    { code: 'ITUB4', type: 'dividendo', day: 28, amount: 0.75, months: [3, 8] }, // Dividendo semestral
    { code: 'PETR4', type: 'dividendo', day: 20, amount: 1.45, months: [2, 5, 8, 11] }, // Trimestral
    { code: 'VALE3', type: 'jcp', day: 18, amount: 2.10, months: [3, 9] }, // Semestral
    { code: 'WEGE3', type: 'dividendo', day: 15, amount: 0.28, months: [3, 8] },
    { code: 'BBAS3', type: 'jcp', day: 28, amount: 0.85, months: [3, 6, 9, 12] },
    { code: 'TAEE11', type: 'dividendo', day: 22, amount: 0.98, months: [5, 8, 11, 12] },
    { code: 'EGIE3', type: 'dividendo', day: 24, amount: 1.35, months: [4, 10] },

    // --- REITs (EUA em USD) ---
    { code: 'O', type: 'reit_dividend', day: 15, amount: 0.263, months: [1,2,3,4,5,6,7,8,9,10,11,12] }, // Mensal em USD
    { code: 'VICI', type: 'reit_dividend', day: 5, amount: 0.432, months: [1, 4, 7, 10] }, // Trimestral
    { code: 'PLD', type: 'reit_dividend', day: 31, amount: 0.96, months: [3, 6, 9, 12] },
    { code: 'EQIX', type: 'reit_dividend', day: 18, amount: 4.26, months: [3, 6, 9, 12] },

    // --- Stocks (EUA em USD) ---
    { code: 'AAPL', type: 'dividendo_usd', day: 13, amount: 0.25, months: [2, 5, 8, 11] },
    { code: 'MSFT', type: 'dividendo_usd', day: 12, amount: 0.75, months: [3, 6, 9, 12] },
    { code: 'NVDA', type: 'dividendo_usd', day: 26, amount: 0.04, months: [3, 6, 9, 12] }
  ];

  const insertStmt = db.prepare(`
    INSERT INTO dividends (asset_code, ex_date, payment_date, amount, type)
    VALUES (?, ?, ?, ?, ?)
  `);

  const yearsToSeed = [2024, 2025, 2026, 2027];
  let totalInserted = 0;

  const insertTransaction = db.transaction(() => {
    for (const yr of yearsToSeed) {
      // Verificar se este ano já tem proventos
      const checkYear = db.prepare("SELECT COUNT(*) as c FROM dividends WHERE payment_date LIKE ?").get(`${yr}%`);
      if (checkYear && checkYear.c > 30) continue; // Pular se já tem dados para esse ano

      for (const item of defaultDividendSchedule) {
        for (const m of item.months) {
          const monthStr = String(m).padStart(2, '0');
          const dayStr = String(item.day).padStart(2, '0');
          const exDayStr = String(Math.max(1, item.day - 7)).padStart(2, '0');

          const paymentDate = `${yr}-${monthStr}-${dayStr}`;
          const exDate = `${yr}-${monthStr}-${exDayStr}`;

          insertStmt.run(
            item.code,
            exDate,
            paymentDate,
            item.amount,
            item.type
          );
          totalInserted++;
        }
      }
    }
  });

  insertTransaction();

  return { message: 'Proventos inseridos com sucesso!', count: totalInserted };
}

/**
 * Get dividends calendar for a specific user and month
 * @param {number} userId - User ID
 * @param {number} year - Year (e.g. 2026)
 * @param {number} month - Month (1 to 12)
 */
export function getUserDividendsCalendar(userId, year, month) {
  const db = getDatabase();

  // 1. Obter a posição atual de custódia do usuário por ativo a partir das transações
  const holdingsRows = db.prepare(`
    SELECT 
      asset_code,
      SUM(CASE WHEN type = 'buy' THEN quantity ELSE -quantity END) as quantity,
      AVG(price) as avg_price
    FROM transactions
    WHERE user_id = ?
    GROUP BY asset_code
    HAVING quantity > 0
  `).all(userId);

  const holdingsMap = {};
  holdingsRows.forEach(h => {
    holdingsMap[h.asset_code] = {
      quantity: Number(h.quantity),
      avgPrice: Number(h.avg_price)
    };
  });

  const userAssetCodes = Object.keys(holdingsMap);
  if (userAssetCodes.length === 0) {
    return {
      month,
      year,
      totalIncome: 0,
      days: {},
      events: []
    };
  }

  // 2. Buscar dados cadastrais dos ativos (nome, tipo, cotação atual)
  const placeholders = userAssetCodes.map(() => '?').join(',');
  const assetsInfo = db.prepare(`
    SELECT code, name, type as category 
    FROM assets 
    WHERE code IN (${placeholders})
  `).all(...userAssetCodes);

  const assetDetailsMap = {};
  assetsInfo.forEach(a => {
    assetDetailsMap[a.code] = a;
  });

  // 3. Buscar proventos no mês desejado
  const monthStr = String(month).padStart(2, '0');
  const datePattern = `${year}-${monthStr}-%`;

  const dividends = db.prepare(`
    SELECT id, asset_code, ex_date, payment_date, amount, type
    FROM dividends
    WHERE asset_code IN (${placeholders})
      AND payment_date LIKE ?
    ORDER BY payment_date ASC
  `).all(...userAssetCodes, datePattern);

  // Cotação estimada do dólar para ativos em USD
  const USD_BRL = 5.50;

  let totalIncomeMonth = 0;
  const daysMap = {};
  const eventsList = [];

  dividends.forEach(div => {
    const holding = holdingsMap[div.asset_code];
    if (!holding || holding.quantity <= 0) return;

    const assetInfo = assetDetailsMap[div.asset_code] || { name: div.asset_code, category: 'acao' };
    const isUSD = div.type === 'reit_dividend' || div.type === 'dividendo_usd';
    
    // Converter valor para BRL se for em moeda estrangeira
    const unitAmountBRL = isUSD ? div.amount * USD_BRL : div.amount;
    const totalAmount = holding.quantity * unitAmountBRL;

    totalIncomeMonth += totalAmount;

    // Extrair dia
    const day = parseInt(div.payment_date.split('-')[2], 10);

    const event = {
      id: div.id,
      day,
      date: div.payment_date,
      exDate: div.ex_date,
      assetCode: div.asset_code,
      assetName: assetInfo.name,
      category: assetInfo.category,
      type: div.type,
      isUSD,
      unitAmount: div.amount,
      unitAmountBRL,
      quantity: holding.quantity,
      totalAmountBRL: Number(totalAmount.toFixed(2)),
      status: new Date(div.payment_date) <= new Date() ? 'pago' : 'previsto'
    };

    eventsList.push(event);

    if (!daysMap[day]) {
      daysMap[day] = {
        day,
        date: div.payment_date,
        totalDayBRL: 0,
        payments: []
      };
    }
    daysMap[day].totalDayBRL += event.totalAmountBRL;
    daysMap[day].payments.push(event);
  });

  return {
    month,
    year,
    totalIncomeBRL: Number(totalIncomeMonth.toFixed(2)),
    days: daysMap,
    events: eventsList
  };
}
