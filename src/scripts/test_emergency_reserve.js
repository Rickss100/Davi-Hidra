import { calculateEmergencyReserveStatus, suggestInvestments } from '../utils/calculateInvestmentSuggestions.js';

console.log('🧪 ========================================================');
console.log('🧪 TESTANDO LÓGICA DE CÁLCULO E APORTE DA RESERVA DE EMERGÊNCIA');
console.log('🧪 ========================================================\n');

// 1. Simulação: Carteira com Reserva Incompleta
const holdingsIncompleta = {
  acoes: [{ code: 'PETR4', quantity: 100, currentPrice: 38.50, averagePrice: 38.50 }],
  fiis: [{ code: 'HGLG11', quantity: 20, currentPrice: 164.00, averagePrice: 164.00 }],
  stocks: [{ code: 'AAPL', quantity: 10, currentPrice: 228.00, averagePrice: 228.00 }],
  reits: [{ code: 'O', quantity: 30, currentPrice: 56.50, averagePrice: 56.50 }],
  fixed: [
    { code: 'TESOURO_SELIC_2029', quantity: 1, currentPrice: 6000.00, averagePrice: 6000.00 } // R$ 6.000 acumulado
  ]
};

const macroAllocation = {
  fixed: 20, variable: 80,
  brasil: 60, usa: 40,
  acoes: 50, fiis: 50,
  stocks: 60, reits: 40
};

const assetTargets = {
  acoes: [{ code: 'PETR4', target: 100 }],
  fiis: [{ code: 'HGLG11', target: 100 }],
  stocks: [{ code: 'AAPL', target: 100 }],
  reits: [{ code: 'O', target: 100 }],
  fixed: [{ code: 'TESOURO_SELIC_2029', target: 100 }]
};

// Custo de vida: R$ 3.000 | 6 meses = R$ 18.000 de meta
const configIncompleta = {
  monthlyExpense: 3000,
  monthsTarget: 6,
  strategyMode: 'hybrid_70_30'
};

const statusIncompleta = calculateEmergencyReserveStatus(holdingsIncompleta, configIncompleta);

console.log('📊 Status da Reserva (Cenário Incompleto):');
console.log(`  - Saldo Atual: R$ ${statusIncompleta.totalCurrentReserve.toFixed(2)}`);
console.log(`  - Meta da Reserva: R$ ${statusIncompleta.targetReserveAmount.toFixed(2)}`);
console.log(`  - Faltante: R$ ${statusIncompleta.missingReserveAmount.toFixed(2)}`);
console.log(`  - % Concluído: ${statusIncompleta.reserveCompletionPercent.toFixed(1)}%`);
console.log(`  - Meses Cobertos: ${statusIncompleta.reserveMonthsCovered.toFixed(1)} meses`);
console.log(`  - Classificação: ${statusIncompleta.reserveStatus}`);

// Testar Aporte no modo Híbrido (70/30) para um aporte de R$ 2.000
const sugestoesHibrido = suggestInvestments(
  2000,
  2,
  holdingsIncompleta,
  macroAllocation,
  assetTargets,
  statusIncompleta
);

console.log('\n🎯 Sugestões de Aporte (Modo Híbrido 70/30 para R$ 2.000):');
sugestoesHibrido.forEach((s, idx) => {
  console.log(`  #${idx + 1} ${s.ticker} (${s.categoria}) - R$ ${s.valorTotal.toFixed(2)} | Motivo: ${s.reason}`);
});

// Testar Aporte no modo Foco Total (100% Reserva)
const statusFoco100 = { ...statusIncompleta, strategyMode: 'focus_100' };
const sugestoesFoco100 = suggestInvestments(
  2000,
  2,
  holdingsIncompleta,
  macroAllocation,
  assetTargets,
  statusFoco100
);

console.log('\n🎯 Sugestões de Aporte (Modo Foco 100% Reserva para R$ 2.000):');
sugestoesFoco100.forEach((s, idx) => {
  console.log(`  #${idx + 1} ${s.ticker} (${s.categoria}) - R$ ${s.valorTotal.toFixed(2)} | Motivo: ${s.reason}`);
});

// 2. Simulação: Carteira com Reserva Blindada (100%)
const holdingsBlindada = {
  ...holdingsIncompleta,
  fixed: [
    { code: 'TESOURO_SELIC_2029', quantity: 1, currentPrice: 18000.00, averagePrice: 18000.00 } // R$ 18.000 acumulado
  ]
};

const statusBlindada = calculateEmergencyReserveStatus(holdingsBlindada, configIncompleta);

console.log('\n🛡️ Status da Reserva (Cenário Blindado):');
console.log(`  - Saldo Atual: R$ ${statusBlindada.totalCurrentReserve.toFixed(2)}`);
console.log(`  - Meta da Reserva: R$ ${statusBlindada.targetReserveAmount.toFixed(2)}`);
console.log(`  - % Concluído: ${statusBlindada.reserveCompletionPercent.toFixed(1)}%`);
console.log(`  - Classificação: ${statusBlindada.reserveStatus}`);

const sugestoesBlindada = suggestInvestments(
  2000,
  2,
  holdingsBlindada,
  macroAllocation,
  assetTargets,
  statusBlindada
);

console.log('\n🎯 Sugestões de Aporte com Reserva Blindada (100% Carteira para R$ 2.000):');
sugestoesBlindada.forEach((s, idx) => {
  console.log(`  #${idx + 1} ${s.ticker} (${s.categoria}) - R$ ${s.valorTotal.toFixed(2)} | Cotas: ${s.cotas}`);
});

console.log('\n✅ TESTE CONCLUÍDO COM SUCESSO!');
