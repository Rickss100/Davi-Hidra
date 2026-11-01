import { PGlite } from '@electric-sql/pglite';

async function main() {
  const p = new PGlite('./.pgdata');
  await p.waitReady;

  console.log('🌱 Semeando carteira demonstrativa R$ 50k para os usuários 1 (IA) e 3 (Aluno)...');

  // Assegurar ativos no catálogo
  const assetsToAdd = [
    { code: 'BBAS3', name: 'Banco do Brasil', type: 'Acao', sector: 'Financeiro' },
    { code: 'ITUB4', name: 'Itaú Unibanco', type: 'Acao', sector: 'Financeiro' },
    { code: 'WEGE3', name: 'WEG S.A.', type: 'Acao', sector: 'Bens Industriais' },
    { code: 'VALE3', name: 'Vale S.A.', type: 'Acao', sector: 'Materiais Básicos' },
    { code: 'HGLG11', name: 'CSHG Logística FII', type: 'FII', sector: 'Logística' },
    { code: 'KNRI11', name: 'Kinea Renda Imobiliária', type: 'FII', sector: 'Híbrido' },
    { code: 'XPLG11', name: 'XP Log FII', type: 'FII', sector: 'Logística' },
    { code: 'TESOURO_SELIC_2029', name: 'Tesouro Selic 2029', type: 'Renda Fixa', sector: 'Títulos Públicos' }
  ];

  for (const a of assetsToAdd) {
    await p.query(`
      INSERT INTO assets (code, name, type, market, sector)
      VALUES ($1, $2, $3, 'BR', $4)
      ON CONFLICT (code) DO NOTHING;
    `, [a.code, a.name, a.type, a.sector]);

    // Cotação em cached_prices
    let price = 30.0;
    if (a.code === 'BBAS3') price = 28.5;
    if (a.code === 'ITUB4') price = 34.2;
    if (a.code === 'WEGE3') price = 54.0;
    if (a.code === 'VALE3') price = 61.5;
    if (a.code === 'HGLG11') price = 163.5;
    if (a.code === 'KNRI11') price = 158.0;
    if (a.code === 'XPLG11') price = 106.0;
    if (a.code === 'TESOURO_SELIC_2029') price = 14850.0;

    await p.query(`
      INSERT INTO cached_prices (asset_code, price, change_percent, currency, source)
      VALUES ($1, $2, 0.5, 'BRL', 'manual')
      ON CONFLICT (asset_code) DO UPDATE SET price = EXCLUDED.price;
    `, [a.code, price]);
  }

  // Operações de Compra e Proventos para usuários 1 e 3
  const txs = [
    // Compras
    { code: 'BBAS3', type: 'buy', qty: 200, price: 27.0, val: 5400, date: '2025-01-15', notes: 'Aporte Inicial DAVI' },
    { code: 'ITUB4', type: 'buy', qty: 180, price: 32.0, val: 5760, date: '2025-02-10', notes: 'Aporte Mensal' },
    { code: 'WEGE3', type: 'buy', qty: 100, price: 50.0, val: 5000, date: '2025-03-12', notes: 'Aporte Estratégico' },
    { code: 'VALE3', type: 'buy', qty: 70, price: 60.0, val: 4200, date: '2025-04-18', notes: 'Aporte Commodities' },
    { code: 'HGLG11', type: 'buy', qty: 60, price: 160.0, val: 9600, date: '2025-05-15', notes: 'Aporte FII Logístico' },
    { code: 'KNRI11', type: 'buy', qty: 55, price: 154.0, val: 8470, date: '2025-06-12', notes: 'Aporte FII Corporativo' },
    { code: 'XPLG11', type: 'buy', qty: 60, price: 102.0, val: 6120, date: '2025-07-20', notes: 'Aporte FII Renda' },
    { code: 'TESOURO_SELIC_2029', type: 'buy', qty: 0.5, price: 14500.0, val: 7250, date: '2025-08-05', notes: 'Reserva de Oportunidade' },

    // Proventos 2026 (Para o Mapa Anual de Renda Passiva)
    { code: 'HGLG11', type: 'event', qty: 60, price: 1.10, val: 66.0, date: '2026-01-15', notes: 'Rendimento FII Jan' },
    { code: 'KNRI11', type: 'event', qty: 55, price: 1.00, val: 55.0, date: '2026-01-15', notes: 'Rendimento FII Jan' },
    { code: 'HGLG11', type: 'event', qty: 60, price: 1.10, val: 66.0, date: '2026-02-15', notes: 'Rendimento FII Fev' },
    { code: 'BBAS3', type: 'event', qty: 200, price: 0.90, val: 180.0, date: '2026-02-28', notes: 'Dividendo BBAS3' },
    { code: 'HGLG11', type: 'event', qty: 60, price: 1.10, val: 66.0, date: '2026-03-15', notes: 'Rendimento FII Mar' },
    { code: 'KNRI11', type: 'event', qty: 55, price: 1.00, val: 55.0, date: '2026-03-15', notes: 'Rendimento FII Mar' },
    { code: 'ITUB4', type: 'event', qty: 180, price: 0.85, val: 153.0, date: '2026-04-10', notes: 'JCP Itaú' },
    { code: 'HGLG11', type: 'event', qty: 60, price: 1.10, val: 66.0, date: '2026-05-15', notes: 'Rendimento FII Mai' },
    { code: 'WEGE3', type: 'event', qty: 100, price: 1.20, val: 120.0, date: '2026-05-20', notes: 'Dividendo WEG' },
    { code: 'HGLG11', type: 'event', qty: 60, price: 1.10, val: 66.0, date: '2026-06-15', notes: 'Rendimento FII Jun' },
    { code: 'VALE3', type: 'event', qty: 70, price: 3.50, val: 245.0, date: '2026-08-20', notes: 'Dividendo Vale Recorde' }
  ];

  for (const uid of [1, 3]) {
    for (const t of txs) {
      await p.query(`
        INSERT INTO transactions (user_id, asset_code, type, quantity, price, total_value, executed_date, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      `, [uid, t.code, t.type, t.qty, t.price, t.val, t.date, t.notes]);
    }

    // Configurar metas macro padrão
    const macro = { fixed: 15, variable: 85, brasil: 100, usa: 0, acoes: 60, fiis: 40, stocks: 0, reits: 0 };
    const targets = { acoes: [], fiis: [], stocks: [], reits: [], fixed: [], reserva: [] };
    const emergency = { essentialMonthlyExpensesBrl: 4000, targetMonths: 6, safetyMarginPercent: 10 };

    await p.query(`
      INSERT INTO user_objectives (user_id, macro_allocation, asset_targets, emergency_config)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO UPDATE 
      SET macro_allocation = EXCLUDED.macro_allocation,
          asset_targets = EXCLUDED.asset_targets,
          emergency_config = EXCLUDED.emergency_config;
    `, [uid, JSON.stringify(macro), JSON.stringify(targets), JSON.stringify(emergency)]);
  }

  console.log('✅ Carteira semeada com sucesso no PostgreSQL (PGlite)!');
  await p.close();
}

main().catch(console.error);
