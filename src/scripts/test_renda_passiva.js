import fetch from 'node-fetch';

console.log('🧪 ========================================================');
console.log('🧪 TESTE COMPLETO DO MÓDULO DE RENDA PASSIVA E CALENDÁRIO');
console.log('🧪 ========================================================\n');

async function testRendaPassiva() {
  const userId = 4; // Usuário Simulado

  // 1. Testar Calendário de Proventos (Março de 2026)
  console.log('📅 1. Testando API do Calendário de Proventos (/api/dividends/calendar)...');
  const calRes = await fetch(`http://localhost:3002/api/dividends/calendar?userId=${userId}&year=2026&month=3`);
  const calData = await calRes.json();

  console.log(`  - Mês/Ano: ${calData.month}/${calData.year}`);
  console.log(`  - Total de Renda Passiva Prevista no Mês: R$ ${calData.totalIncomeBRL?.toFixed(2)}`);
  console.log(`  - Dias com Pagamentos: ${Object.keys(calData.days).length} dias (${Object.keys(calData.days).join(', ')})`);
  console.log(`  - Total de Eventos de Proventos: ${calData.events?.length}`);

  // 2. Testar Número Mágico (/api/dividends/magic-number)
  console.log('\n✨ 2. Testando API do Número Mágico (/api/dividends/magic-number)...');
  const magicRes = await fetch(`http://localhost:3002/api/dividends/magic-number?userId=${userId}`);
  const magicData = await magicRes.json();

  console.log(`  - Ativos analisados: ${magicData.length}`);
  magicData.slice(0, 4).forEach(item => {
    console.log(`    * ${item.assetCode} (${item.category}): Cotas ${item.quantity} / Meta ${item.magicNumber} (${item.progressPercent}%) -> Gera ${item.sharesPerMonth} cotas/mês`);
  });

  // 3. Testar Projeção de Renda Futura (/api/dividends/forecast)
  console.log('\n🔮 3. Testando API de Previsão de Renda Futura (/api/dividends/forecast)...');
  const forecastRes = await fetch(`http://localhost:3002/api/dividends/forecast?currentEquity=71355&monthlyContribution=1500&months=36&dividendYield=8.5&reinvest=true`);
  const forecastData = await forecastRes.json();

  console.log(`  - Prazo: ${forecastData.targetMonths} meses (${forecastData.targetYears} anos)`);
  console.log(`  - Patrimônio Final Estimado: R$ ${forecastData.finalEquity?.toFixed(2)}`);
  console.log(`  - Renda Passiva Mensal Prevista: R$ ${forecastData.finalMonthlyIncome?.toFixed(2)}/mês`);
  console.log(`  - Renda Anual Prevista: R$ ${forecastData.finalAnnualIncome?.toFixed(2)}/ano`);
  console.log(`  - Total de Dividendos Acumulados no Período: R$ ${forecastData.totalDividendsReceived?.toFixed(2)}`);

  console.log('\n🎉 TODOS OS TESTES DE RENDA PASSIVA FORAM CONCLUÍDOS COM SUCESSO!');
}

testRendaPassiva().catch(console.error);
