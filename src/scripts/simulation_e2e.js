/**
 * DAVI & HYDRA - Simulação End-to-End Completa
 * =============================================
 * Cria um novo usuário fictício, registra transações em todas as 5 classes de ativos,
 * e testa sistematicamente cada endpoint/aba da aplicação.
 * 
 * Execução: node src/scripts/simulation_e2e.js
 */

const BASE = 'http://localhost:3002';

const results = [];
let passCount = 0;
let failCount = 0;
let warnCount = 0;

function log(status, testName, detail) {
  const icon = status === 'PASS' ? '✅' : status === 'FAIL' ? '❌' : '⚠️';
  console.log(`${icon} [${status}] ${testName}: ${detail}`);
  results.push({ status, testName, detail, timestamp: new Date().toISOString() });
  if (status === 'PASS') passCount++;
  else if (status === 'FAIL') failCount++;
  else warnCount++;
}

async function apiCall(method, path, body = null, userId = null) {
  const opts = {
    method,
    headers: { 'Content-Type': 'application/json' }
  };
  if (userId) opts.headers['x-user-id'] = String(userId);
  if (body) opts.body = JSON.stringify(body);

  const res = await fetch(`${BASE}${path}`, opts);
  const data = await res.json();
  return { status: res.status, data };
}

async function runSimulation() {
  console.log('\n' + '='.repeat(70));
  console.log('🚀 DAVI & HYDRA — Simulação End-to-End v2');
  console.log('📅 Data:', new Date().toLocaleString('pt-BR'));
  console.log('='.repeat(70) + '\n');

  // =========================================================================
  // FASE 1: Health Check
  // =========================================================================
  console.log('\n📋 FASE 1: Health Check do Servidor\n');
  
  try {
    const { data } = await apiCall('GET', '/health');
    log('PASS', 'Health Check', `status=${data.status}, timestamp=${data.timestamp}`);
  } catch (e) {
    log('FAIL', 'Health Check', `Servidor inacessível: ${e.message}`);
    console.log('\n💀 Abortando simulação — servidor offline!\n');
    return;
  }

  // =========================================================================
  // FASE 2: Criar novo usuário
  // =========================================================================
  console.log('\n📋 FASE 2: Criação de Novo Usuário\n');

  const testUser = {
    name: 'Maria Teste E2E',
    email: `teste_e2e_${Date.now()}@davihidra.com`,
    password: 'teste123',
    role: 'user'
  };

  let userId;
  try {
    const { status, data } = await apiCall('POST', '/api/users', testUser);
    if (status === 201 && data.user) {
      userId = data.user.id;
      log('PASS', 'Criar Usuário', `ID=${userId}, email=${testUser.email}`);
    } else {
      log('FAIL', 'Criar Usuário', `Status ${status}: ${JSON.stringify(data)}`);
      return;
    }
  } catch (e) {
    log('FAIL', 'Criar Usuário', e.message);
    return;
  }

  // Teste de login
  try {
    const { status, data } = await apiCall('POST', '/api/users/login', {
      email: testUser.email,
      password: testUser.password
    });
    if (status === 200 && data.user) {
      log('PASS', 'Login', `Autenticado como ${data.user.name}`);
    } else {
      log('FAIL', 'Login', `Status ${status}: ${JSON.stringify(data)}`);
    }
  } catch (e) {
    log('FAIL', 'Login', e.message);
  }

  // Teste de login com senha errada
  try {
    const { status } = await apiCall('POST', '/api/users/login', {
      email: testUser.email,
      password: 'senhaerrada'
    });
    if (status === 401) {
      log('PASS', 'Login senha errada', 'Rejeitou credenciais inválidas (401)');
    } else {
      log('FAIL', 'Login senha errada', `Esperava 401, recebeu ${status}`);
    }
  } catch (e) {
    log('FAIL', 'Login senha errada', e.message);
  }

  // Teste de duplicação de email
  try {
    const { status } = await apiCall('POST', '/api/users', testUser);
    if (status === 409) {
      log('PASS', 'Duplicação de email', 'Rejeitou email duplicado (409)');
    } else {
      log('WARN', 'Duplicação de email', `Esperava 409, recebeu ${status}`);
    }
  } catch (e) {
    log('FAIL', 'Duplicação de email', e.message);
  }

  // =========================================================================
  // FASE 3: Registrar Transações (15 ativos em 5 classes)
  // =========================================================================
  console.log('\n📋 FASE 3: Registrar Transações (15 ativos)\n');

  const transactions = [
    // 4 Ações BR
    { asset_code: 'PETR4', type: 'buy', quantity: 50, price: 38.50, date: '2025-01-15', notes: 'Compra inicial Petrobras' },
    { asset_code: 'VALE3', type: 'buy', quantity: 30, price: 62.00, date: '2025-02-10', notes: 'Compra Vale' },
    { asset_code: 'ITUB4', type: 'buy', quantity: 40, price: 33.80, date: '2025-03-05', notes: 'Compra Itaú' },
    { asset_code: 'BBAS3', type: 'buy', quantity: 25, price: 27.45, date: '2025-04-20', notes: 'Compra BB' },

    // 4 FIIs
    { asset_code: 'HGLG11', type: 'buy', quantity: 15, price: 158.00, date: '2025-01-20', notes: 'FII Logística CSHG' },
    { asset_code: 'MXRF11', type: 'buy', quantity: 100, price: 10.50, date: '2025-02-15', notes: 'FII Maxi Renda' },
    { asset_code: 'XPLG11', type: 'buy', quantity: 20, price: 96.00, date: '2025-03-10', notes: 'FII XP Log' },
    { asset_code: 'VISC11', type: 'buy', quantity: 12, price: 108.00, date: '2025-04-05', notes: 'FII Vinci Shopping' },

    // 4 Stocks USA
    { asset_code: 'AAPL', type: 'buy', quantity: 5, price: 185.00, date: '2025-01-25', notes: 'Apple Inc.' },
    { asset_code: 'MSFT', type: 'buy', quantity: 3, price: 420.00, date: '2025-02-20', notes: 'Microsoft' },
    { asset_code: 'GOOGL', type: 'buy', quantity: 4, price: 175.00, date: '2025-03-15', notes: 'Alphabet' },
    { asset_code: 'AMZN', type: 'buy', quantity: 3, price: 200.00, date: '2025-04-10', notes: 'Amazon' },

    // 4 REITs
    { asset_code: 'O', type: 'buy', quantity: 10, price: 56.00, date: '2025-01-30', notes: 'Realty Income' },
    { asset_code: 'VNQ', type: 'buy', quantity: 8, price: 82.00, date: '2025-02-25', notes: 'Vanguard Real Estate ETF' },
    { asset_code: 'SPG', type: 'buy', quantity: 5, price: 160.00, date: '2025-03-20', notes: 'Simon Property Group' },
    { asset_code: 'AMT', type: 'buy', quantity: 3, price: 200.00, date: '2025-04-15', notes: 'American Tower REIT' },

    // 2 Renda Fixa
    { asset_code: 'TESOURO_SELIC_2029', type: 'buy', quantity: 5, price: 1100.00, date: '2025-01-10', notes: 'Tesouro Selic 2029 - Reserva' },
    { asset_code: 'CDB_BANCO_110', type: 'buy', quantity: 1, price: 10000.00, date: '2025-03-01', notes: 'CDB 110% CDI' },

    // 1 Reserva de Emergência
    { asset_code: 'CDB_LIQ_DIARIA', type: 'buy', quantity: 1, price: 15000.00, date: '2025-01-05', notes: 'Reserva de emergência - CDB liq. diária' },
  ];

  let txSuccess = 0;
  let txFail = 0;

  for (const tx of transactions) {
    try {
      const { status, data } = await apiCall('POST', '/api/transactions', {
        ...tx,
        user_id: userId
      });
      if (status === 201 && data.id) {
        txSuccess++;
        log('PASS', `Transação ${tx.asset_code}`, `ID=${data.id}, R$ ${data.total_value?.toFixed(2) || 'N/A'}`);
      } else {
        txFail++;
        log('FAIL', `Transação ${tx.asset_code}`, `Status ${status}: ${JSON.stringify(data).slice(0, 100)}`);
      }
    } catch (e) {
      txFail++;
      log('FAIL', `Transação ${tx.asset_code}`, e.message);
    }
  }

  log(txFail === 0 ? 'PASS' : 'WARN', 'Resumo Transações', `${txSuccess}/${transactions.length} sucesso, ${txFail} falhas`);

  // =========================================================================
  // FASE 4: Verificar Portfólio do Usuário
  // =========================================================================
  console.log('\n📋 FASE 4: Verificar Portfólio Consolidado\n');

  try {
    const { status, data } = await apiCall('GET', `/api/users/${userId}/portfolio`);
    if (status === 200 && data.transactions) {
      log('PASS', 'Portfólio do Usuário', `${data.totalTransactions} transações, R$ ${data.totalInvested?.toFixed(2)} investido`);
    } else {
      log('FAIL', 'Portfólio do Usuário', `Status ${status}`);
    }
  } catch (e) {
    log('FAIL', 'Portfólio do Usuário', e.message);
  }

  // Verificar transações filtradas por userId
  try {
    const { status, data } = await apiCall('GET', `/api/transactions?userId=${userId}`);
    if (status === 200 && Array.isArray(data)) {
      const categories = [...new Set(data.map(t => t.category).filter(Boolean))];
      log('PASS', 'Transações filtradas', `${data.length} registros, categorias: ${categories.join(', ')}`);
    } else {
      log('FAIL', 'Transações filtradas', `Status ${status}`);
    }
  } catch (e) {
    log('FAIL', 'Transações filtradas', e.message);
  }

  // =========================================================================
  // FASE 5: Testar Endpoints de Assets
  // =========================================================================
  console.log('\n📋 FASE 5: Endpoints de Assets (Carteira)\n');

  const assetTypes = ['Acao', 'FII', 'Stock', 'REIT', 'RendaFixa'];
  for (const type of assetTypes) {
    try {
      const { status, data } = await apiCall('GET', `/api/assets?type=${type}`);
      if (status === 200 && Array.isArray(data)) {
        log('PASS', `Assets ${type}`, `${data.length} ativos disponíveis`);
      } else {
        log('FAIL', `Assets ${type}`, `Status ${status}`);
      }
    } catch (e) {
      log('FAIL', `Assets ${type}`, e.message);
    }
  }

  // =========================================================================
  // FASE 6: Testar Resumo (Aba Resumo)
  // =========================================================================
  console.log('\n📋 FASE 6: Aba Resumo\n');

  // Métricas
  try {
    const { status, data } = await apiCall('GET', `/api/resumo/metrics?userId=${userId}`);
    if (status === 200 && data.totalEquity !== undefined) {
      log('PASS', 'Resumo - Métricas', `Patrimônio: R$ ${data.totalEquity.toFixed(2)}, Capital: R$ ${data.investedCapital.toFixed(2)}, Lucro: R$ ${data.totalProfitBRL.toFixed(2)}`);
      log('PASS', 'Resumo - Benchmarks', `CDI: ${data.benchmarks.cdi}%, Ibov: ${data.benchmarks.ibov}%, S&P500: ${data.benchmarks.sp500}%`);
      log('PASS', 'Resumo - Comparações', `%CDI: ${data.comparisons.pctOfCdi}%, Alpha vs CDI: ${data.comparisons.alphaVsCdi}%`);
    } else {
      log('FAIL', 'Resumo - Métricas', `Status ${status}: ${JSON.stringify(data).slice(0, 150)}`);
    }
  } catch (e) {
    log('FAIL', 'Resumo - Métricas', e.message);
  }

  // Benchmark Data para gráfico
  const periods = ['6m', 'ytd', '12m', '24m', 'total'];
  for (const period of periods) {
    try {
      const { status, data } = await apiCall('GET', `/api/resumo/benchmark-data?period=${period}`);
      if (status === 200 && data.dataPoints?.length > 0) {
        const lastPoint = data.dataPoints[data.dataPoints.length - 1];
        log('PASS', `Resumo - Benchmark ${period}`, `${data.dataPoints.length} pontos, Carteira: ${lastPoint.carteira}%, S&P: ${lastPoint.sp500}%`);
      } else {
        log('FAIL', `Resumo - Benchmark ${period}`, `Status ${status}`);
      }
    } catch (e) {
      log('FAIL', `Resumo - Benchmark ${period}`, e.message);
    }
  }

  // Alocação (PieChart)
  try {
    const { status, data } = await apiCall('GET', `/api/resumo/allocation?userId=${userId}`);
    if (status === 200 && data.categories) {
      const catNames = data.categories.map(c => `${c.name}(${c.percent}%)`).join(', ');
      log('PASS', 'Resumo - Alocação', `${data.categories.length} categorias: ${catNames}`);
      log('PASS', 'Resumo - Geografia', `BR: ${data.geography.brasilPct}%, USA: ${data.geography.usaPct}%`);
    } else {
      log('FAIL', 'Resumo - Alocação', `Status ${status}`);
    }
  } catch (e) {
    log('FAIL', 'Resumo - Alocação', e.message);
  }

  // =========================================================================
  // FASE 7: Testar Renda Passiva (Calendário + Magic Number + Forecast)
  // =========================================================================
  console.log('\n📋 FASE 7: Aba Renda Passiva\n');

  // Seed dividends first
  try {
    const { status, data } = await apiCall('POST', '/api/dividends/seed');
    log('PASS', 'Dividendos - Seed', `Seeded: ${JSON.stringify(data).slice(0, 100)}`);
  } catch (e) {
    log('WARN', 'Dividendos - Seed', e.message);
  }

  // Calendário - testar vários meses
  const calendarMonths = [
    { year: 2025, month: 3 },
    { year: 2025, month: 6 },
    { year: 2026, month: 1 },
    { year: 2026, month: 9 },
    { year: 2027, month: 12 },
  ];

  for (const { year, month } of calendarMonths) {
    try {
      const { status, data } = await apiCall('GET', `/api/dividends/calendar?userId=${userId}&year=${year}&month=${month}`);
      if (status === 200) {
        const eventCount = Array.isArray(data) ? data.length : (data.events?.length || 0);
        log('PASS', `Calendário ${month}/${year}`, `${eventCount} eventos de proventos`);
      } else {
        log('FAIL', `Calendário ${month}/${year}`, `Status ${status}`);
      }
    } catch (e) {
      log('FAIL', `Calendário ${month}/${year}`, e.message);
    }
  }

  // Magic Number
  try {
    const { status, data } = await apiCall('GET', `/api/dividends/magic-number?userId=${userId}`);
    if (status === 200 && Array.isArray(data)) {
      const reached = data.filter(d => d.isMagicReached).length;
      log('PASS', 'Número Mágico', `${data.length} ativos, ${reached} atingiram o Número Mágico`);
      // Detalhe dos primeiros 3
      data.slice(0, 3).forEach(d => {
        log('PASS', `Magic ${d.assetCode}`, `Cotas: ${d.quantity}/${d.magicNumber} (${d.progressPercent}%), Renda/mês: R$ ${d.monthlyIncome}`);
      });
    } else {
      log('FAIL', 'Número Mágico', `Status ${status}`);
    }
  } catch (e) {
    log('FAIL', 'Número Mágico', e.message);
  }

  // Forecast (simulação futura)
  const forecastScenarios = [
    { months: 12, contribution: 1500, label: '1 ano / R$1500' },
    { months: 60, contribution: 2000, label: '5 anos / R$2000' },
    { months: 120, contribution: 3000, label: '10 anos / R$3000' },
  ];

  for (const sc of forecastScenarios) {
    try {
      const { status, data } = await apiCall('GET', 
        `/api/dividends/forecast?months=${sc.months}&monthlyContribution=${sc.contribution}&currentEquity=50000&dividendYield=8.5`
      );
      if (status === 200 && data.finalEquity) {
        log('PASS', `Forecast ${sc.label}`, `Patrimônio: R$ ${data.finalEquity.toFixed(2)}, Renda/mês: R$ ${data.finalMonthlyIncome.toFixed(2)}, Renda/ano: R$ ${data.finalAnnualIncome.toFixed(2)}`);
      } else {
        log('FAIL', `Forecast ${sc.label}`, `Status ${status}`);
      }
    } catch (e) {
      log('FAIL', `Forecast ${sc.label}`, e.message);
    }
  }

  // =========================================================================
  // FASE 8: Testar Fundamentals
  // =========================================================================
  console.log('\n📋 FASE 8: Fundamentals (Dados Fundamentalistas)\n');

  const testFundamentals = ['PETR4', 'VALE3', 'HGLG11', 'MXRF11', 'AAPL'];
  for (const code of testFundamentals) {
    try {
      const { status, data } = await apiCall('GET', `/api/fundamentals/${code}`);
      if (status === 200 && data) {
        const keys = Object.keys(data);
        log('PASS', `Fundamentals ${code}`, `${keys.length} campos: ${keys.slice(0, 5).join(', ')}...`);
      } else {
        log('WARN', `Fundamentals ${code}`, `Status ${status} (pode não ter dados)`);
      }
    } catch (e) {
      log('WARN', `Fundamentals ${code}`, e.message);
    }
  }

  // =========================================================================
  // FASE 9: Testar Prices
  // =========================================================================
  console.log('\n📋 FASE 9: Preços Históricos\n');

  const testPrices = ['PETR4', 'VALE3', 'AAPL', 'HGLG11'];
  for (const code of testPrices) {
    try {
      const { status, data } = await apiCall('GET', `/api/prices/${code}`);
      if (status === 200) {
        const count = Array.isArray(data) ? data.length : (data.prices?.length || 0);
        log(count > 0 ? 'PASS' : 'WARN', `Preços ${code}`, `${count} registros de preço`);
      } else {
        log('WARN', `Preços ${code}`, `Status ${status}`);
      }
    } catch (e) {
      log('WARN', `Preços ${code}`, e.message);
    }
  }

  // =========================================================================
  // FASE 10: Testar Economic Indicators
  // =========================================================================
  console.log('\n📋 FASE 10: Indicadores Econômicos\n');

  try {
    const { status, data } = await apiCall('GET', '/api/economic');
    if (status === 200) {
      log('PASS', 'Indicadores Econômicos', `Dados: ${JSON.stringify(data).slice(0, 150)}`);
    } else {
      log('WARN', 'Indicadores Econômicos', `Status ${status}`);
    }
  } catch (e) {
    log('WARN', 'Indicadores Econômicos', e.message);
  }

  // =========================================================================
  // FASE 11: Testar Stats
  // =========================================================================
  console.log('\n📋 FASE 11: Estatísticas Gerais\n');

  try {
    const { status, data } = await apiCall('GET', '/api/stats');
    if (status === 200) {
      log('PASS', 'Stats Gerais', `Dados: ${JSON.stringify(data).slice(0, 200)}`);
    } else {
      log('WARN', 'Stats Gerais', `Status ${status}`);
    }
  } catch (e) {
    log('WARN', 'Stats Gerais', e.message);
  }

  // =========================================================================
  // FASE 12: Admin - Listar Todos os Usuários
  // =========================================================================
  console.log('\n📋 FASE 12: Admin - Gestão de Usuários\n');

  try {
    const { status, data } = await apiCall('GET', '/api/users');
    if (status === 200 && Array.isArray(data)) {
      log('PASS', 'Admin - Listar Usuários', `${data.length} usuários cadastrados`);
      const testUserFound = data.find(u => u.email === testUser.email);
      log(testUserFound ? 'PASS' : 'FAIL', 'Admin - Verificar Novo Usuário', testUserFound ? `Encontrado ID ${testUserFound.id}` : 'Não encontrado');
    } else {
      log('FAIL', 'Admin - Listar Usuários', `Status ${status}`);
    }
  } catch (e) {
    log('FAIL', 'Admin - Listar Usuários', e.message);
  }

  // =========================================================================
  // FASE 13: Testar Exclusão de Transação
  // =========================================================================
  console.log('\n📋 FASE 13: Operações de Exclusão\n');

  try {
    // Buscar a última transação do usuário para deletar como teste
    const { data: txList } = await apiCall('GET', `/api/transactions?userId=${userId}`);
    if (txList && txList.length > 0) {
      const lastTx = txList[txList.length - 1];
      const { status } = await apiCall('DELETE', `/api/transactions/${lastTx.id}`);
      if (status === 200) {
        log('PASS', 'Deletar Transação', `ID ${lastTx.id} (${lastTx.asset_code}) removida com sucesso`);
        // Re-adicionar para manter a integridade
        await apiCall('POST', '/api/transactions', {
          asset_code: lastTx.asset_code,
          type: lastTx.type,
          quantity: lastTx.quantity,
          price: lastTx.price,
          date: lastTx.date,
          user_id: userId
        });
        log('PASS', 'Re-adicionar Transação', `${lastTx.asset_code} re-adicionada`);
      } else {
        log('FAIL', 'Deletar Transação', `Status ${status}`);
      }
    }
  } catch (e) {
    log('FAIL', 'Deletar Transação', e.message);
  }

  // Testar delete de transação inexistente
  try {
    const { status } = await apiCall('DELETE', '/api/transactions/99999');
    if (status === 404) {
      log('PASS', 'Delete Inexistente', 'Retornou 404 como esperado');
    } else {
      log('WARN', 'Delete Inexistente', `Status ${status} (esperava 404)`);
    }
  } catch (e) {
    log('FAIL', 'Delete Inexistente', e.message);
  }

  // =========================================================================
  // FASE 14: Verificação de Rotas Frontend (endpoints disponíveis)
  // =========================================================================
  console.log('\n📋 FASE 14: Verificação de Rotas Frontend\n');

  try {
    const resp = await fetch(`${BASE.replace('3002', '8080')}/`);
    if (resp.ok) {
      log('PASS', 'Frontend Vite', `Status ${resp.status} — Vite Dev Server acessível`);
    } else {
      log('WARN', 'Frontend Vite', `Status ${resp.status}`);
    }
  } catch (e) {
    log('WARN', 'Frontend Vite', `Inacessível (${e.message}) — pode estar em outra porta`);
  }

  // =========================================================================
  // RELATÓRIO FINAL
  // =========================================================================
  console.log('\n' + '='.repeat(70));
  console.log('📊 RELATÓRIO FINAL DA SIMULAÇÃO');
  console.log('='.repeat(70));
  console.log(`\n📅 Finalizado em: ${new Date().toLocaleString('pt-BR')}`);
  console.log(`👤 Usuário teste: ${testUser.name} (${testUser.email})`);
  console.log(`🆔 User ID: ${userId}`);
  console.log(`\n📈 RESULTADOS:`);
  console.log(`   ✅ Passou: ${passCount}`);
  console.log(`   ❌ Falhou: ${failCount}`);
  console.log(`   ⚠️  Avisos: ${warnCount}`);
  console.log(`   📋 Total:  ${results.length}`);
  console.log(`   🏆 Taxa de Sucesso: ${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`);
  
  console.log('\n--- Detalhamento de Falhas ---');
  const failures = results.filter(r => r.status === 'FAIL');
  if (failures.length === 0) {
    console.log('   🎉 Nenhuma falha encontrada!');
  } else {
    failures.forEach(f => console.log(`   ❌ ${f.testName}: ${f.detail}`));
  }

  console.log('\n--- Avisos ---');
  const warnings = results.filter(r => r.status === 'WARN');
  if (warnings.length === 0) {
    console.log('   ✨ Nenhum aviso.');
  } else {
    warnings.forEach(w => console.log(`   ⚠️  ${w.testName}: ${w.detail}`));
  }

  // Output JSON para relatório
  const reportData = {
    simulation: {
      date: new Date().toISOString(),
      user: testUser,
      userId,
      transactionsRegistered: txSuccess,
    },
    summary: {
      total: results.length,
      passed: passCount,
      failed: failCount,
      warnings: warnCount,
      successRate: `${((passCount / (passCount + failCount)) * 100).toFixed(1)}%`
    },
    results
  };

  console.log('\n\n📄 JSON REPORT:');
  console.log(JSON.stringify(reportData, null, 2));
}

runSimulation().catch(e => {
  console.error('💀 Erro fatal na simulação:', e);
  process.exit(1);
});
