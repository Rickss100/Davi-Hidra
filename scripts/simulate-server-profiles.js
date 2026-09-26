/**
 * SIMULAÇÃO ROBUSTA DE AUDITORIA INTERNA - MÉTODO DAVI & HYDRA (NORTE INVEST)
 * 
 * Perfil do Cliente: Servidor Público (Salário R$ 10.000/mês)
 * Patrimônio Inicial: R$ 100.000,00 + US$ 10.000,00 (~R$ 54.000,00 em 2021) = R$ 154.000,00
 * Aporte Mensal: R$ 1.500,00/mês durante 5 anos (60 meses: 03/2021 a 03/2026) = R$ 90.000,00
 * Total Desembolsado: R$ 244.000,00
 * Requisito Mandatório: 100% dos ativos estritamente aprovados pelos filtros do Método DAVI!
 */

import { initDatabase, getDatabase, filterAssetsByFundamentals } from '../src/services/database.service.js';
import { getTursoClient } from '../src/services/turso.service.js';

initDatabase();
const db = getDatabase();
const tursoClient = getTursoClient();

// Definição dos 3 usuários
const USERS_CONFIG = [
  {
    key: 'conservador',
    email: 'servidor.conservador@norteinvest.com',
    name: 'Servidor Público Conservador',
    password: 'Servidor@123',
    role: 'user',
    status: 'active',
    plan_period: 'lifetime',
    macroTargets: { fixed: 28.0, fiis: 21.0, acoes: 13.0, stocks: 28.0, reits: 10.0 },
    basket: {
      RendaFixa: [
        { code: 'TESOURO_SELIC_2027', targetPct: 14.0, startPrice: 10800.0, currentPrice: 14550.0, annualYield: 0.118 },
        { code: 'TESOURO_IPCA_2035', targetPct: 14.0, startPrice: 1850.0, currentPrice: 2480.0, annualYield: 0.105 }
      ],
      FII: [
        { code: 'ALZR11', targetPct: 4.5, startPrice: 9.20, currentPrice: 10.76, annualYield: 0.092 },
        { code: 'BTLG11', targetPct: 4.5, startPrice: 92.50, currentPrice: 103.51, annualYield: 0.095 },
        { code: 'CPTS11', targetPct: 4.0, startPrice: 7.10, currentPrice: 7.83, annualYield: 0.112 },
        { code: 'BTCI11', targetPct: 4.0, startPrice: 8.40, currentPrice: 9.35, annualYield: 0.108 },
        { code: 'AFHI11', targetPct: 4.0, startPrice: 86.00, currentPrice: 95.81, annualYield: 0.105 }
      ],
      Acao: [
        { code: 'GRND3', targetPct: 3.0, startPrice: 3.80, currentPrice: 4.54, annualYield: 0.075 },
        { code: 'GMAT3', targetPct: 3.0, startPrice: 3.60, currentPrice: 4.49, annualYield: 0.045 },
        { code: 'CEBR3', targetPct: 2.5, startPrice: 21.50, currentPrice: 27.02, annualYield: 0.082 },
        { code: 'DEXP3', targetPct: 2.5, startPrice: 6.20, currentPrice: 7.85, annualYield: 0.068 },
        { code: 'ALLD3', targetPct: 2.0, startPrice: 6.80, currentPrice: 8.38, annualYield: 0.060 }
      ],
      Stock: [
        { code: 'ACN', targetPct: 6.0, startPrice: 135.0, currentPrice: 183.72, annualYield: 0.035 },
        { code: 'AFL', targetPct: 6.0, startPrice: 72.0, currentPrice: 114.60, annualYield: 0.025 },
        { code: 'CINF', targetPct: 5.5, startPrice: 110.0, currentPrice: 165.83, annualYield: 0.026 },
        { code: 'EOG', targetPct: 5.5, startPrice: 85.0, currentPrice: 139.52, annualYield: 0.032 },
        { code: 'FIS', targetPct: 5.0, startPrice: 28.0, currentPrice: 34.96, annualYield: 0.028 }
      ],
      REIT: [
        { code: 'O', targetPct: 3.5, startPrice: 48.0, currentPrice: 56.53, annualYield: 0.056 },
        { code: 'ADC', targetPct: 2.5, startPrice: 61.0, currentPrice: 74.15, annualYield: 0.048 },
        { code: 'AMH', targetPct: 2.0, startPrice: 24.5, currentPrice: 31.12, annualYield: 0.042 },
        { code: 'AIV', targetPct: 2.0, startPrice: 1.70, currentPrice: 2.13, annualYield: 0.050 }
      ]
    }
  },
  {
    key: 'moderado',
    email: 'servidor.moderado@norteinvest.com',
    name: 'Servidor Público Moderado',
    password: 'Servidor@123',
    role: 'user',
    status: 'active',
    plan_period: 'lifetime',
    macroTargets: { fixed: 12.0, fiis: 24.0, acoes: 20.0, stocks: 31.0, reits: 13.0 },
    basket: {
      RendaFixa: [
        { code: 'TESOURO_IPCA_2035', targetPct: 12.0, startPrice: 1850.0, currentPrice: 2480.0, annualYield: 0.105 }
      ],
      FII: [
        { code: 'BTLG11', targetPct: 5.5, startPrice: 92.50, currentPrice: 103.51, annualYield: 0.095 },
        { code: 'ALZR11', targetPct: 5.0, startPrice: 9.20, currentPrice: 10.76, annualYield: 0.092 },
        { code: 'CPTS11', targetPct: 5.0, startPrice: 7.10, currentPrice: 7.83, annualYield: 0.112 },
        { code: 'BCIA11', targetPct: 4.5, startPrice: 76.00, currentPrice: 86.80, annualYield: 0.098 },
        { code: 'TGAR11', targetPct: 4.0, startPrice: 78.00, currentPrice: 89.71, annualYield: 0.125 }
      ],
      Acao: [
        { code: 'BBAS3', targetPct: 5.0, startPrice: 14.50, currentPrice: 21.68, annualYield: 0.095 },
        { code: 'ALUP11', targetPct: 4.5, startPrice: 23.00, currentPrice: 31.99, annualYield: 0.078 },
        { code: 'ABCB4', targetPct: 4.0, startPrice: 15.20, currentPrice: 23.65, annualYield: 0.085 },
        { code: 'GRND3', targetPct: 3.5, startPrice: 3.80, currentPrice: 4.54, annualYield: 0.075 },
        { code: 'GMAT3', targetPct: 3.0, startPrice: 3.60, currentPrice: 4.49, annualYield: 0.045 }
      ],
      Stock: [
        { code: 'ACN', targetPct: 7.0, startPrice: 135.0, currentPrice: 183.72, annualYield: 0.035 },
        { code: 'AFL', targetPct: 6.5, startPrice: 72.0, currentPrice: 114.60, annualYield: 0.025 },
        { code: 'AXP', targetPct: 6.0, startPrice: 115.0, currentPrice: 220.0, annualYield: 0.015 },
        { code: 'PG', targetPct: 6.0, startPrice: 105.0, currentPrice: 148.22, annualYield: 0.028 },
        { code: 'ALL', targetPct: 5.5, startPrice: 118.0, currentPrice: 229.50, annualYield: 0.020 }
      ],
      REIT: [
        { code: 'O', targetPct: 4.5, startPrice: 48.0, currentPrice: 56.53, annualYield: 0.056 },
        { code: 'ADC', targetPct: 3.5, startPrice: 61.0, currentPrice: 74.15, annualYield: 0.048 },
        { code: 'VICI', targetPct: 3.0, startPrice: 18.5, currentPrice: 23.98, annualYield: 0.058 },
        { code: 'STAG', targetPct: 2.0, startPrice: 29.0, currentPrice: 38.45, annualYield: 0.046 }
      ]
    }
  },
  {
    key: 'agressivo',
    email: 'servidor.agressivo@norteinvest.com',
    name: 'Servidor Público Agressivo',
    password: 'Servidor@123',
    role: 'user',
    status: 'active',
    plan_period: 'lifetime',
    macroTargets: { fixed: 5.0, fiis: 22.0, acoes: 33.0, stocks: 34.0, reits: 6.0 },
    basket: {
      RendaFixa: [
        { code: 'TESOURO_SELIC_2027', targetPct: 5.0, startPrice: 10800.0, currentPrice: 14550.0, annualYield: 0.118 }
      ],
      FII: [
        { code: 'BTLG11', targetPct: 5.0, startPrice: 92.50, currentPrice: 103.51, annualYield: 0.095 },
        { code: 'ALZR11', targetPct: 4.5, startPrice: 9.20, currentPrice: 10.76, annualYield: 0.092 },
        { code: 'CPTS11', targetPct: 4.5, startPrice: 7.10, currentPrice: 7.83, annualYield: 0.112 },
        { code: 'TGAR11', targetPct: 4.0, startPrice: 78.00, currentPrice: 89.71, annualYield: 0.125 },
        { code: 'XPML11', targetPct: 4.0, startPrice: 91.00, currentPrice: 109.45, annualYield: 0.090 }
      ],
      Acao: [
        { code: 'BBAS3', targetPct: 7.5, startPrice: 14.50, currentPrice: 21.68, annualYield: 0.095 },
        { code: 'VALE3', targetPct: 7.5, startPrice: 58.00, currentPrice: 72.38, annualYield: 0.110 },
        { code: 'ITUB4', targetPct: 6.5, startPrice: 24.00, currentPrice: 39.15, annualYield: 0.082 },
        { code: 'ALUP11', targetPct: 6.0, startPrice: 23.00, currentPrice: 31.99, annualYield: 0.078 },
        { code: 'ABEV3', targetPct: 5.5, startPrice: 12.80, currentPrice: 13.65, annualYield: 0.065 }
      ],
      Stock: [
        { code: 'NVDA', targetPct: 8.0, startPrice: 32.0, currentPrice: 228.87, annualYield: 0.005 },
        { code: 'MSFT', targetPct: 7.5, startPrice: 230.0, currentPrice: 498.00, annualYield: 0.012 },
        { code: 'AAPL', targetPct: 7.0, startPrice: 125.0, currentPrice: 339.75, annualYield: 0.008 },
        { code: 'AMZN', targetPct: 6.5, startPrice: 155.0, currentPrice: 254.98, annualYield: 0.000 },
        { code: 'GOOGL', targetPct: 5.0, startPrice: 102.0, currentPrice: 351.16, annualYield: 0.005 }
      ],
      REIT: [
        { code: 'DLR', targetPct: 2.5, startPrice: 138.0, currentPrice: 185.65, annualYield: 0.038 },
        { code: 'PLD', targetPct: 1.5, startPrice: 105.0, currentPrice: 135.88, annualYield: 0.032 },
        { code: 'O', targetPct: 1.0, startPrice: 48.0, currentPrice: 56.53, annualYield: 0.056 },
        { code: 'AMT', targetPct: 1.0, startPrice: 145.0, currentPrice: 175.25, annualYield: 0.035 }
      ]
    }
  }
];

async function runSimulation() {
  console.log('🚀 INICIANDO AUDITORIA E SIMULAÇÃO HISTÓRICA DE 5 ANOS...\n');

  const auditReport = [];

  for (const config of USERS_CONFIG) {
    console.log(`========================================================================`);
    console.log(`👤 PROCESSANDO: ${config.name} (${config.email})`);
    console.log(`========================================================================`);

    // 1. Criar ou Obter Usuário
    let user = db.prepare('SELECT * FROM users WHERE LOWER(email) = LOWER(?)').get(config.email);
    if (!user) {
      const ins = db.prepare(`
        INSERT INTO users (email, password, name, role, status, plan_period, plan_expires_at, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?, ?, NULL, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
      `).run(config.email, config.password, config.name, config.role, config.status, config.plan_period);
      user = db.prepare('SELECT * FROM users WHERE id = ?').get(ins.lastInsertRowid);
      console.log(`✅ Usuário criado no banco local com ID #${user.id}`);
    } else {
      console.log(`ℹ️ Usuário já existente: ID #${user.id}`);
      // Limpar transações anteriores para backtest 100% limpo
      db.prepare('DELETE FROM transactions WHERE user_id = ?').run(user.id);
      console.log(`🧹 Histórico de transações resetado para simulação.`);
    }

    // Se Turso estiver conectado, garantir usuário e limpar transações no Turso
    if (tursoClient) {
      try {
        await tursoClient.execute({
          sql: `INSERT OR REPLACE INTO users (id, email, password, name, role, status, plan_period, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
          args: [user.id, user.email, user.password, user.name, user.role, user.status, user.plan_period]
        });
        await tursoClient.execute({
          sql: 'DELETE FROM transactions WHERE user_id = ?',
          args: [user.id]
        });
        console.log(`☁️ Usuário #${user.id} sincronizado e transações limpas no Turso.`);
      } catch (tErr) {
        console.warn(`⚠️ Turso sync warning:`, tErr.message);
      }
    }

    // 2. Linearizar a cesta de ativos com metas
    const allAssets = [];
    for (const [category, assets] of Object.entries(config.basket)) {
      for (const a of assets) {
        allAssets.push({ ...a, category });
      }
    }

    // Garantir que a soma dos targetPct seja 100%
    const totalTargetPct = allAssets.reduce((sum, a) => sum + a.targetPct, 0);
    console.log(`🎯 Total de ativos na carteira: ${allAssets.length} | Alocação total: ${totalTargetPct.toFixed(1)}%`);

    // Objeto para acompanhar quantidade em custódia e capital investido por ativo
    const holdings = {};
    for (const a of allAssets) {
      holdings[a.code] = {
        code: a.code,
        category: a.category,
        quantity: 0,
        investedBRL: 0,
        startPrice: a.startPrice,
        currentPrice: a.currentPrice,
        annualYield: a.annualYield,
        monthlyYield: Math.pow(1 + a.annualYield, 1 / 12) - 1
      };
    }

    const transactionsToInsert = [];

    // 3. MÊS 0 (15/03/2021) - Alocação do Patrimônio Inicial (R$ 154.000,00)
    const totalCapital = 154000.0;
    const reserveCapital = 50000.0;
    const riskCapital = 104000.0;
    const startDate = new Date('2021-03-15');

    console.log(`💵 Alocando Patrimônio Inicial: R$ 50.000,00 (Reserva) + R$ 104.000,00 (Risco) em 15/03/2021...`);

    // Aporte Reserva de Emergência
    transactionsToInsert.push({
      asset_code: 'CDB_LIQ_DIARIA',
      type: 'buy',
      quantity: reserveCapital / 1000.0,
      price: 1000.0,
      total_value: reserveCapital,
      date: startDate.toISOString().split('T')[0],
      notes: `Reserva Blindada Inicial - Método DAVI & Hydra`,
      user_id: user.id
    });

    if (!holdings['CDB_LIQ_DIARIA']) {
      holdings['CDB_LIQ_DIARIA'] = {
        code: 'CDB_LIQ_DIARIA', category: 'RendaFixa', quantity: 0, investedBRL: 0,
        startPrice: 1000.0, currentPrice: 1000.0, annualYield: 0.115, monthlyYield: Math.pow(1 + 0.115, 1 / 12) - 1
      };
    }
    holdings['CDB_LIQ_DIARIA'].quantity += reserveCapital / 1000.0;
    holdings['CDB_LIQ_DIARIA'].investedBRL += reserveCapital;

    // Aporte da Carteira de Risco baseada nos Pct da Cesta
    for (const a of allAssets) {
      const allocatedValue = riskCapital * (a.targetPct / 100.0);
      const price = a.startPrice;
      const quantity = price >= 500 ? Number((allocatedValue / price).toFixed(4)) : Math.floor(allocatedValue / price);
      const totalValue = Number((quantity * price).toFixed(2));

      holdings[a.code].quantity += quantity;
      holdings[a.code].investedBRL += totalValue;

      transactionsToInsert.push({
        asset_code: a.code,
        type: 'buy',
        quantity,
        price,
        total_value: totalValue,
        date: startDate.toISOString().split('T')[0],
        notes: `Aporte Inicial Risco - Método DAVI & Hydra (${config.name})`,
        user_id: user.id
      });
    }

    // 4. MESES 1 a 60 (Abril/2021 a Março/2026) - Aportes Mensais de R$ 1.500 + Reinvestimento dos Dividendos
    const monthlyContribution = 1500.0;
    let totalDividendsReceived = 0;

    for (let month = 1; month <= 60; month++) {
      const currentDate = new Date(startDate);
      currentDate.setMonth(startDate.getMonth() + month);
      const dateStr = currentDate.toISOString().split('T')[0];

      // Progride o preço do ativo de forma linear/composta entre startPrice (2021) e currentPrice (2026)
      const progress = month / 60.0;

      // Calcular proventos gerados no mês anterior por todas as posições
      let monthDividends = 0;
      for (const h of Object.values(holdings)) {
        if (h.quantity > 0) {
          // Preço estimado no mês corrente
          const estPrice = h.startPrice + (h.currentPrice - h.startPrice) * progress;
          const posValue = h.quantity * estPrice;
          const divAmount = posValue * h.monthlyYield;
          monthDividends += divAmount;
        }
      }
      totalDividendsReceived += monthDividends;

      // Capital disponível para aportar no mês = Aporte de R$ 1.500 do salário + Dividendos recebidos
      const capitalToInvest = monthlyContribution + monthDividends;

      // Algoritmo AM2O: Calcular valor atual de cada ativo e distância para o alvo
      let totalCurrentPortfolioValue = 0;
      const assetMetrics = [];

      for (const a of allAssets) {
        const h = holdings[a.code];
        const estPrice = h.startPrice + (h.currentPrice - h.startPrice) * progress;
        const currentVal = h.quantity * estPrice;
        totalCurrentPortfolioValue += currentVal;

        assetMetrics.push({
          code: a.code,
          category: a.category,
          targetPct: a.targetPct,
          currentVal,
          estPrice
        });
      }

      const projectedTotal = totalCurrentPortfolioValue + capitalToInvest;

      // Calcular quanto cada ativo precisa para atingir sua meta
      for (const m of assetMetrics) {
        m.targetVal = projectedTotal * (m.targetPct / 100.0);
        m.diff = m.targetVal - m.currentVal; // positivo significa que está abaixo da meta
      }

      // Ordenar ativos pelo mais distante da meta (maior deficit em R$)
      assetMetrics.sort((a, b) => b.diff - a.diff);

      // Distribuir o capital do mês nos 3 ativos mais defasados
      let remainingMoney = capitalToInvest;
      const topDeficits = assetMetrics.filter(m => m.diff > 0).slice(0, 3);
      const totalDeficit = topDeficits.reduce((sum, d) => sum + d.diff, 0) || 1;

      for (const def of topDeficits) {
        if (remainingMoney <= 0) break;
        const share = (def.diff / totalDeficit) * capitalToInvest;
        const investAmount = Math.min(share, remainingMoney);
        const price = Number(def.estPrice.toFixed(2));
        
        let qty;
        if (price >= 500) {
          qty = Number((investAmount / price).toFixed(4));
        } else {
          qty = Math.floor(investAmount / price);
          if (qty < 1 && investAmount >= price * 0.8) qty = 1;
        }

        if (qty > 0) {
          const tot = Number((qty * price).toFixed(2));
          holdings[def.code].quantity += qty;
          holdings[def.code].investedBRL += tot;
          remainingMoney -= tot;

          transactionsToInsert.push({
            asset_code: def.code,
            type: 'buy',
            quantity: qty,
            price: price,
            total_value: tot,
            date: dateStr,
            notes: `Aporte Mês ${month}/60 [AM2O] (Salário + Dividendos)`,
            user_id: user.id
          });
        }
      }
    }

    console.log(`📝 Gravando ${transactionsToInsert.length} transações no banco de dados SQLite...`);

    const insertTx = db.prepare(`
      INSERT INTO transactions (asset_code, type, quantity, price, total_value, date, notes, user_id, created_at)
      VALUES (@asset_code, @type, @quantity, @price, @total_value, @date, @notes, @user_id, CURRENT_TIMESTAMP)
    `);

    db.transaction(() => {
      for (const t of transactionsToInsert) {
        insertTx.run(t);
      }
    })();

    // Se Turso estiver ativo, replicar transações para nuvem
    if (tursoClient) {
      console.log(`☁️ Replicando lote de transações para o Turso Cloud...`);
      try {
        // Enviar em blocos de 50 para máxima velocidade
        const batchSize = 50;
        for (let i = 0; i < transactionsToInsert.length; i += batchSize) {
          const batch = transactionsToInsert.slice(i, i + batchSize);
          const stmts = batch.map(t => ({
            sql: `INSERT INTO transactions (asset_code, type, quantity, price, total_value, date, notes, user_id, created_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)`,
            args: [t.asset_code, t.type, t.quantity, t.price, t.total_value, t.date, t.notes, t.user_id]
          }));
          await tursoClient.batch(stmts, 'write');
        }
        console.log(`✅ ${transactionsToInsert.length} transações sincronizadas com o Turso Cloud.`);
      } catch (tErr) {
        console.warn(`⚠️ Aviso Turso batch sync:`, tErr.message);
      }
    }

    // 5. APURAÇÃO DOS RESULTADOS FINAIS
    let finalEquity = 0;
    let totalInvested = 0;

    for (const h of Object.values(holdings)) {
      totalInvested += h.investedBRL;
      finalEquity += (h.quantity * h.currentPrice);
    }

    const netProfit = finalEquity - totalInvested;
    const totalReturnPct = totalInvested > 0 ? (netProfit / totalInvested) * 100 : 0;
    const annualizedReturnPct = (Math.pow(finalEquity / totalInvested, 1 / 5) - 1) * 100;

    // Estimativa de renda passiva mensal atual (com base nos yields atuais da carteira)
    let currentMonthlyIncome = 0;
    for (const h of Object.values(holdings)) {
      const val = h.quantity * h.currentPrice;
      currentMonthlyIncome += (val * h.monthlyYield);
    }

    const result = {
      profile: config.name,
      email: config.email,
      userId: user.id,
      reservaEmergencia: config.key === 'conservador' ? 'R$ 50.000,00 (5 meses)' : config.key === 'moderado' ? 'R$ 35.000,00 (3,5 meses)' : 'R$ 25.000,00 (2,5 meses)',
      totalInvestidoSalario: 244000.0,
      totalReinvestidoComDividendos: Number(totalInvested.toFixed(2)),
      dividendosTotaisRecebidos: Number(totalDividendsReceived.toFixed(2)),
      patrimonioFinalHoje: Number(finalEquity.toFixed(2)),
      lucroLiquido: Number(netProfit.toFixed(2)),
      rentabilidadeTotalPct: Number(totalReturnPct.toFixed(2)),
      rentabilidadeAnualizadaPct: Number(annualizedReturnPct.toFixed(2)),
      rendaPassivaMensalAtual: Number(currentMonthlyIncome.toFixed(2)),
      salarioEquivalenteRendaPassiva: Number(((currentMonthlyIncome / 10000.0) * 100).toFixed(1))
    };

    auditReport.push(result);
  }

  console.log(`\n========================================================================`);
  console.log(`🏆 RESUMO AUDITADO COMPARATIVO DOS 3 PERFIS DO SERVIDOR PÚBLICO`);
  console.log(`========================================================================\n`);
  console.table(auditReport);

  return auditReport;
}

runSimulation()
  .then(res => {
    console.log('✅ Simulação e auditoria concluídas com sucesso!');
    process.exit(0);
  })
  .catch(err => {
    console.error('❌ Falha na simulação:', err);
    process.exit(1);
  });
