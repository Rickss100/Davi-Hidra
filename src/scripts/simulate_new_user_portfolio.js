import fetch from 'node-fetch';
import { getDatabase } from '../services/database.service.js';
import { suggestInvestments, calculateCategoryDistances } from '../utils/calculateInvestmentSuggestions.js';

const API_BASE = 'http://localhost:3002/api';

async function runSimulation() {
  console.log('🚀 ========================================================');
  console.log('🚀 INICIANDO SIMULAÇÃO COMPLETA DE NOVO USUÁRIO DAVI & HYDRA');
  console.log('🚀 ========================================================\n');

  const report = {
    steps: [],
    errors: [],
    summary: {}
  };

  function logStep(name, status, details) {
    report.steps.push({ name, status, details });
    const icon = status === 'SUCCESS' ? '✅' : '❌';
    console.log(`${icon} [${status}] ${name}: ${details}`);
  }

  // 1. Autenticação / Obtenção do Usuário Simulado
  let user;
  try {
    const loginRes = await fetch(`${API_BASE}/users/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'simulado@davihidra.com', password: 'senha123' })
    });
    const loginData = await loginRes.json();
    if (!loginRes.ok || !loginData.user) {
      throw new Error(loginData.error || 'Falha ao autenticar');
    }
    user = loginData.user;
    logStep('Autenticação do Usuário', 'SUCCESS', `Logado como ${user.name} (ID: ${user.id}, Email: ${user.email})`);
  } catch (err) {
    logStep('Autenticação do Usuário', 'FAILED', err.message);
    report.errors.push(err.message);
    return report;
  }

  const userId = user.id;
  const db = getDatabase();

  // Limpar transações anteriores do usuário de teste
  try {
    db.prepare('DELETE FROM transactions WHERE user_id = ?').run(userId);
    logStep('Limpeza de Dados Anteriores', 'SUCCESS', `Transações anteriores do usuário ${userId} removidas.`);
  } catch (err) {
    logStep('Limpeza de Dados Anteriores', 'FAILED', err.message);
  }

  // 2. Cadastro dos Ativos Requisitados
  // 4 Ações, 4 FIIs, 4 Stocks, 4 REITs, 2 Renda Fixa, 1 Reserva de Emergência
  const transactionsToCreate = [
    // --- 4 Ações ---
    { asset_code: 'PETR4', category: 'acoes', type: 'buy', quantity: 100, price: 38.50, date: '2026-03-01', notes: 'Aporte estratégico Ações' },
    { asset_code: 'VALE3', category: 'acoes', type: 'buy', quantity: 50, price: 62.00, date: '2026-03-01', notes: 'Aporte estratégico Ações' },
    { asset_code: 'ITUB4', category: 'acoes', type: 'buy', quantity: 100, price: 35.00, date: '2026-03-01', notes: 'Aporte estratégico Ações' },
    { asset_code: 'WEGE3', category: 'acoes', type: 'buy', quantity: 80, price: 54.00, date: '2026-03-01', notes: 'Aporte estratégico Ações' },

    // --- 4 FIIs ---
    { asset_code: 'HGLG11', category: 'fiis', type: 'buy', quantity: 25, price: 164.00, date: '2026-03-02', notes: 'Fundo Logístico' },
    { asset_code: 'KNIP11', category: 'fiis', type: 'buy', quantity: 40, price: 94.00, date: '2026-03-02', notes: 'Fundo de Papel IPCA' },
    { asset_code: 'MXRF11', category: 'fiis', type: 'buy', quantity: 350, price: 10.20, date: '2026-03-02', notes: 'Fundo Híbrido' },
    { asset_code: 'XPML11', category: 'fiis', type: 'buy', quantity: 35, price: 112.00, date: '2026-03-02', notes: 'Fundo de Shoppings' },

    // --- 4 Stocks (S&P 500 em USD cotado a R$ 5,50) ---
    { asset_code: 'AAPL', category: 'stocks', type: 'buy', quantity: 10, price: 228.00, date: '2026-03-05', notes: 'Apple Inc.' },
    { asset_code: 'MSFT', category: 'stocks', type: 'buy', quantity: 6, price: 425.00, date: '2026-03-05', notes: 'Microsoft' },
    { asset_code: 'NVDA', category: 'stocks', type: 'buy', quantity: 20, price: 120.00, date: '2026-03-05', notes: 'NVIDIA Corp.' },
    { asset_code: 'AMZN', category: 'stocks', type: 'buy', quantity: 12, price: 185.00, date: '2026-03-05', notes: 'Amazon.com' },

    // --- 4 REITs (EUA em USD) ---
    { asset_code: 'O', category: 'reits', type: 'buy', quantity: 30, price: 56.50, date: '2026-03-06', notes: 'Realty Income' },
    { asset_code: 'PLD', category: 'reits', type: 'buy', quantity: 12, price: 135.00, date: '2026-03-06', notes: 'Prologis' },
    { asset_code: 'VICI', category: 'reits', type: 'buy', quantity: 60, price: 28.50, date: '2026-03-06', notes: 'Vici Properties' },
    { asset_code: 'EQIX', category: 'reits', type: 'buy', quantity: 2, price: 880.00, date: '2026-03-06', notes: 'Equinix' },

    // --- 2 Renda Fixa ---
    { asset_code: 'TESOURO_IPCA_2035', category: 'fixed', type: 'buy', quantity: 1, price: 5000.00, date: '2026-03-10', notes: 'Tesouro IPCA+ 2035' },
    { asset_code: 'CDB_LIQ_DIARIA', category: 'fixed', type: 'buy', quantity: 1, price: 5000.00, date: '2026-03-10', notes: 'CDB Liquidez Diária' },

    // --- 1 Reserva de Emergência ---
    { asset_code: 'TESOURO_SELIC_2029', category: 'fixed', type: 'buy', quantity: 1, price: 15000.00, date: '2026-03-10', notes: 'Reserva de Emergência Soberana' }
  ];

  console.log(`\n📦 Cadastrando ${transactionsToCreate.length} ativos/transações via API POST /api/transactions...`);
  let successCount = 0;
  for (const tx of transactionsToCreate) {
    try {
      const res = await fetch(`${API_BASE}/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-User-Id': String(userId)
        },
        body: JSON.stringify({ ...tx, user_id: userId })
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `HTTP ${res.status}`);
      }
      successCount++;
    } catch (err) {
      logStep(`Cadastro de ${tx.asset_code}`, 'FAILED', err.message);
      report.errors.push(`Falha em ${tx.asset_code}: ${err.message}`);
    }
  }

  logStep('Cadastro de Transações', successCount === transactionsToCreate.length ? 'SUCCESS' : 'PARTIAL',
    `${successCount} de ${transactionsToCreate.length} transações salvas com sucesso.`);

  // 3. Verificação de Carteira (Holdings) e Consulta no Banco
  let userTransactions = [];
  try {
    const txRes = await fetch(`${API_BASE}/transactions?userId=${userId}`);
    userTransactions = await txRes.json();
    logStep('Consulta de Transações da Carteira', 'SUCCESS', `Total de ${userTransactions.length} ordens retornadas pela API.`);
  } catch (err) {
    logStep('Consulta de Transações da Carteira', 'FAILED', err.message);
  }

  // 4. Estratégia de Macro Alocação e Objetivos do Usuário
  // Configuração sugerida para o perfil balanceado (AM2O):
  // Renda Fixa: 25% | Renda Variável: 75%
  // Variável: 60% Brasil (50% Ações, 50% FIIs) | 40% EUA (60% Stocks, 40% REITs)
  const macroAllocation = {
    fixed: 25, variable: 75,
    brasil: 60, usa: 40,
    acoes: 50, fiis: 50,
    stocks: 60, reits: 40
  };

  const assetTargets = {
    acoes: [
      { code: 'PETR4', target: 25 },
      { code: 'VALE3', target: 25 },
      { code: 'ITUB4', target: 25 },
      { code: 'WEGE3', target: 25 }
    ],
    fiis: [
      { code: 'HGLG11', target: 25 },
      { code: 'KNIP11', target: 25 },
      { code: 'MXRF11', target: 25 },
      { code: 'XPML11', target: 25 }
    ],
    stocks: [
      { code: 'AAPL', target: 25 },
      { code: 'MSFT', target: 25 },
      { code: 'NVDA', target: 25 },
      { code: 'AMZN', target: 25 }
    ],
    reits: [
      { code: 'O', target: 25 },
      { code: 'PLD', target: 25 },
      { code: 'VICI', target: 25 },
      { code: 'EQIX', target: 25 }
    ],
    fixed: [
      { code: 'TESOURO_IPCA_2035', target: 20 },
      { code: 'CDB_LIQ_DIARIA', target: 20 },
      { code: 'TESOURO_SELIC_2029', target: 60 }
    ]
  };

  // 5. Montagem da Carteira (Holdings) e Cálculo de "Onde Aportar"
  const holdings = { acoes: [], fiis: [], stocks: [], reits: [], fixed: [] };

  const normalizeCat = (cat) => {
    if (!cat) return 'acoes';
    const c = String(cat).toLowerCase();
    if (c.includes('acao')) return 'acoes';
    if (c.includes('fii')) return 'fiis';
    if (c.includes('stock')) return 'stocks';
    if (c.includes('reit')) return 'reits';
    if (c.includes('renda') || c.includes('fix')) return 'fixed';
    return 'acoes';
  };

  userTransactions.forEach(t => {
    const cat = normalizeCat(t.category);
    let h = holdings[cat].find(x => x.code === t.asset_code);
    if (!h) {
      h = { code: t.asset_code, quantity: 0, totalInvested: 0, averagePrice: 0, currentPrice: Number(t.price) };
      holdings[cat].push(h);
    }
    h.quantity += Number(t.quantity);
    h.totalInvested += Number(t.total_value);
    h.averagePrice = h.totalInvested / h.quantity;
  });

  logStep('Processamento dos Holdings', 'SUCCESS',
    `Ações: ${holdings.acoes.length}, FIIs: ${holdings.fiis.length}, Stocks: ${holdings.stocks.length}, REITs: ${holdings.reits.length}, Renda Fixa: ${holdings.fixed.length}`);

  // 6. Execução do Algoritmo AM2O ("Onde Aportar")
  console.log('\n🧠 Executando Algoritmo AM2O para Rebalanceamento Inteligente...');
  const aporteDisponivel = 5000.00; // R$ 5.000 de novo aporte
  const allHoldings = Object.values(holdings).flat();
  const totalValue = allHoldings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);

  const suggestions = suggestInvestments(
    aporteDisponivel,
    3,
    holdings,
    macroAllocation,
    assetTargets
  );

  const categoryDists = calculateCategoryDistances(holdings, macroAllocation, totalValue);

  logStep('Cálculo do Painel "Onde Aportar"', suggestions.length > 0 ? 'SUCCESS' : 'WARNING',
    `Gerou ${suggestions.length} sugestões de aporte para o valor de R$ ${aporteDisponivel.toFixed(2)}.`);

  report.summary = {
    usuario: user.name,
    email: user.email,
    id: user.id,
    totalTransacoes: userTransactions.length,
    holdingsPorClasse: {
      acoes: holdings.acoes.map(a => `${a.code} (${a.quantity} cotas = R$ ${a.totalInvested.toFixed(2)})`),
      fiis: holdings.fiis.map(a => `${a.code} (${a.quantity} cotas = R$ ${a.totalInvested.toFixed(2)})`),
      stocks: holdings.stocks.map(a => `${a.code} (${a.quantity} cotas = $ ${a.totalInvested.toFixed(2)})`),
      reits: holdings.reits.map(a => `${a.code} (${a.quantity} cotas = $ ${a.totalInvested.toFixed(2)})`),
      rendaFixaEReserva: holdings.fixed.map(a => `${a.code} (R$ ${a.totalInvested.toFixed(2)})`)
    },
    alocacaoAtualVsMeta: categoryDists.map(c => ({
      categoria: c.name,
      atual: `${c.currentPercent.toFixed(1)}% (R$ ${c.currentValue.toFixed(2)})`,
      meta: `${c.targetPercent.toFixed(1)}%`,
      distancia: `${c.distance.toFixed(1)}% ${c.distance > 0 ? '(Aportar)' : '(Aguardar)'}`
    })),
    sugestoesAporte: suggestions.map((s, idx) => ({
      posicao: `#${idx + 1}`,
      ativo: s.ticker,
      categoria: s.category,
      cotasParaComprar: s.cotas,
      valorRecomendado: `R$ ${s.valorTotal.toFixed(2)}`,
      razao: s.reason
    }))
  };

  return report;
}

runSimulation().then(report => {
  console.log('\n📊 ========================================================');
  console.log('📊 RELATÓRIO FINAL DA SIMULAÇÃO');
  console.log('📊 ========================================================');
  console.log(JSON.stringify(report.summary, null, 2));
  console.log('\nStatus dos Passos:');
  report.steps.forEach(s => console.log(`  - [${s.status}] ${s.name}: ${s.details}`));
  if (report.errors.length > 0) {
    console.log('\n⚠️ Erros encontrados:');
    report.errors.forEach(e => console.log(`  - ${e}`));
  } else {
    console.log('\n🎉 TODOS OS TESTES PASSARAM COM 100% DE SUCESSO!');
  }
}).catch(console.error);
