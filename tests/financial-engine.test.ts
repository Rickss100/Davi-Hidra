import { describe, expect, it } from 'vitest';
import {
  calculateCustodyPosition,
  convertToBRL,
  d,
  roundCurrency,
  roundCurrencyStr
} from '@/lib/money';
import {
  calculateAssetDistancesByCategory,
  calculateCategoryDistances,
  calculateEmergencyReserveStatus,
  calculateMagicNumbers,
  distributeEqualTargetWeights,
  EMPTY_ASSET_TARGETS,
  GOLD_PRESET_BRASIL,
  GOLD_PRESET_GLOBAL,
  MACRO_MODEL_BRASIL,
  MACRO_MODEL_GLOBAL,
  suggestInvestments,
  type CategorizedHoldings,
  type HoldingPosition
} from '@/server/engines/davi-hydra.engine';

function makeHolding(overrides: Partial<HoldingPosition> & { code: string; category: HoldingPosition['category'] }): HoldingPosition {
  return {
    code: overrides.code,
    name: overrides.name ?? overrides.code,
    category: overrides.category,
    market: overrides.market ?? (overrides.category === 'stocks' || overrides.category === 'reits' ? 'US' : 'BR'),
    sector: overrides.sector ?? 'Geral',
    quantity: overrides.quantity ?? 10,
    averagePrice: overrides.averagePrice ?? 10,
    currentPrice: overrides.currentPrice ?? 10,
    investedBrl: overrides.investedBrl ?? 100,
    currentValueBrl: overrides.currentValueBrl ?? 100,
    profitBrl: overrides.profitBrl ?? 0,
    profitPercent: overrides.profitPercent ?? 0,
    portfolioWeightPercent: overrides.portfolioWeightPercent ?? 0,
    dividendYieldAnnual: overrides.dividendYieldAnnual ?? 0,
    dividends12mBrl: overrides.dividends12mBrl ?? 0,
    totalDividendsBrl: overrides.totalDividendsBrl ?? 0,
    yieldOnCostPercent: overrides.yieldOnCostPercent ?? 0
  };
}

function emptyHoldings(): CategorizedHoldings {
  return {
    acoes: [],
    fiis: [],
    stocks: [],
    reits: [],
    fixed: []
  };
}

describe('Motor Matemático Bancário (decimal.js)', () => {
  it('elimina erros clássicos de ponto flutuante IEEE-754 (0.1 + 0.2 === 0.30)', () => {
    const sum = d('0.1').plus(d('0.2'));
    expect(sum.equals(d('0.3'))).toBe(true);
    expect(roundCurrencyStr(sum)).toBe('0.30');

    // Soma centenária de centavos quebrados
    const tradeA = d('19.99').mul(3);
    const tradeB = d('0.01').mul(3);
    expect(roundCurrencyStr(tradeA.plus(tradeB))).toBe('60.00');
  });

  it('calcula Preço Médio Ponderado real de custódia sem distorcer vendas parciais ou proventos', () => {
    const pos = calculateCustodyPosition([
      // 1) Compra 100 cotas a R$ 10,00 = Custo R$ 1.000,00 | PM R$ 10,00
      { type: 'buy', quantity: 100, price: 10, date: '2026-01-10' },
      // 2) Compra 100 cotas a R$ 20,00 = Custo R$ 3.000,00 | 200 cotas | PM R$ 15,00
      { type: 'buy', quantity: 100, price: 20, date: '2026-02-10' },
      // 3) Recebe R$ 85,50 de dividendos (não pode alterar quantidade nem PM!)
      { type: 'event', quantity: 0, price: 0, totalValue: '85.50', date: '2026-02-25' },
      // 4) Vende 50 cotas a R$ 25,00 (reduz cotas para 150, mas PM fiscal das restantes permanece R$ 15,00!)
      { type: 'sell', quantity: 50, price: 25, date: '2026-03-05' }
    ]);

    expect(pos.quantity.toNumber()).toBe(150);
    expect(roundCurrency(pos.averagePrice)).toBe(15.0);
    expect(roundCurrency(pos.investedCost)).toBe(2250.0);
    expect(roundCurrency(pos.realizedDividends)).toBe(85.5);
  });

  it('zera posição e preço médio quando ocorre liquidação total do ativo', () => {
    const pos = calculateCustodyPosition([
      { type: 'buy', quantity: 40, price: '32.75', date: '2026-01-01' },
      { type: 'sell', quantity: 40, price: '40.00', date: '2026-02-01' }
    ]);

    expect(pos.quantity.toNumber()).toBe(0);
    expect(pos.averagePrice.toNumber()).toBe(0);
    expect(pos.investedCost.toNumber()).toBe(0);
  });

  it('converte ativos internacionais (US) com câmbio explícito e preserva BRL intacto', () => {
    expect(roundCurrency(convertToBRL('100', 'US', '5.80'))).toBe(580.0);
    expect(roundCurrency(convertToBRL('100', 'BR', '5.80'))).toBe(100.0);
  });
});

describe('Motor Proprietário Método DAVI & Hydra (Server-Side)', () => {
  it('calcula distâncias macro de categorias com soma exata de 100%', () => {
    const holdings = emptyHoldings();
    holdings.acoes.push(makeHolding({ code: 'WEGE3', category: 'acoes', currentValueBrl: 6000 }));
    holdings.fiis.push(makeHolding({ code: 'HGLG11', category: 'fiis', currentValueBrl: 2000 }));
    holdings.fixed.push(makeHolding({ code: 'Tesouro Selic 2029', category: 'fixed', currentValueBrl: 2000 }));

    const distances = calculateCategoryDistances(
      holdings,
      GOLD_PRESET_BRASIL.macroAllocation,
      10000
    );

    const targetSum = distances.reduce((acc, item) => acc + item.targetPercent, 0);
    expect(roundCurrency(targetSum)).toBe(100);

    // Preset Brasil: Variável 85% * Brasil 100% * FIIs 40% = 34% alvo vs 20% atual => distância +14%
    const fiisDist = distances.find((c) => c.category === 'fiis');
    expect(fiisDist?.targetPercent).toBe(34);
    expect(fiisDist?.currentPercent).toBe(20);
    expect(fiisDist?.distance).toBe(14);
  });

  it('prioriza 100% na Reserva de Emergência quando modo focus_100 está ativo e reserva incompleta', () => {
    const holdings = emptyHoldings();
    const reserveSummary = calculateEmergencyReserveStatus(holdings, {
      monthlyExpense: 5000,
      monthsTarget: 6, // Meta R$ 30.000
      manualReserveBalance: 10000, // Faltam R$ 20.000
      strategyMode: 'focus_100'
    });

    expect(reserveSummary.targetReserveAmount).toBe(30000);
    expect(reserveSummary.missingReserveAmount).toBe(20000);
    expect(reserveSummary.reserveStatus).toBe('em_construcao');

    const suggestions = suggestInvestments({
      availableAmountBrl: 2500,
      numAssets: 3,
      holdings,
      macroAllocation: GOLD_PRESET_BRASIL.macroAllocation,
      assetTargets: GOLD_PRESET_BRASIL.assetTargets,
      priceMapBrl: { WEGE3: 50, HGLG11: 160 },
      emergencyReserveSummary: reserveSummary
    });

    expect(suggestions).toHaveLength(1);
    expect(suggestions[0]?.isEmergencyReserve).toBe(true);
    expect(suggestions[0]?.valorTotal).toBe(2500);
  });

  it('divide aporte 70/30 no modo híbrido e converte cotações USD para sugerir ativos globais', () => {
    const holdings = emptyHoldings();
    const reserveSummary = calculateEmergencyReserveStatus(holdings, {
      monthlyExpense: 4000,
      monthsTarget: 6, // R$ 24.000
      manualReserveBalance: 12000, // 50% concluída
      strategyMode: 'hybrid_70_30'
    });

    const suggestions = suggestInvestments({
      availableAmountBrl: 5000,
      numAssets: 3,
      holdings,
      macroAllocation: GOLD_PRESET_GLOBAL.macroAllocation,
      assetTargets: GOLD_PRESET_GLOBAL.assetTargets,
      priceMapBrl: {
        ITUB4: 35,
        ALZR11: 105,
        AAPL: 200 * 5.75, // preço no mapa em BRL
        O: 55 * 5.75
      },
      emergencyReserveSummary: reserveSummary,
      usdRate: 5.75
    });

    // 70% de R$ 5.000 = R$ 3.500 para Reserva + restante distribuído nos ativos mais descontados
    expect(suggestions.length).toBeGreaterThanOrEqual(2);
    expect(suggestions[0]?.isEmergencyReserve).toBe(true);
    expect(suggestions[0]?.valorTotal).toBe(3500);

    const totalAllocated = suggestions.reduce((acc, s) => acc + s.valorTotal, 0);
    expect(totalAllocated).toBeLessThanOrEqual(5000);
  });

  it('calcula Magic Number (efeito bola de neve) corretamente a partir dos dividendos 12m', () => {
    const holdings = emptyHoldings();
    // FII custando R$ 100,00 que pagou R$ 120,00 no ano para 10 cotas => R$ 1,00/mês por cota => Magic Number = 100 cotas
    holdings.fiis.push(
      makeHolding({
        code: 'HGLG11',
        category: 'fiis',
        quantity: 25,
        currentPrice: 100,
        currentValueBrl: 2500,
        dividends12mBrl: 300 // 300 / 12 / 25 = R$ 1,00/mês por cota
      })
    );

    const magic = calculateMagicNumbers(holdings);
    expect(magic).toHaveLength(1);
    expect(magic[0]?.magicNumberShares).toBe(100);
    expect(magic[0]?.missingShares).toBe(75);
    expect(magic[0]?.investmentNeededBrl).toBe(7500);
    expect(magic[0]?.progressPercent).toBe(25);
  });

  it('calcula distâncias individuais por ativo (RDM) e sinaliza ativos fora da meta', () => {
    const holdings = emptyHoldings();
    // Carteira total R$ 10.000: WEGE3 tem R$ 1.000 (10%) e MGLU3 (fora da meta) tem R$ 500 (5%)
    holdings.acoes.push(makeHolding({ code: 'WEGE3', category: 'acoes', currentValueBrl: 1000 }));
    holdings.acoes.push(makeHolding({ code: 'MGLU3', category: 'acoes', currentValueBrl: 500 }));
    holdings.fixed.push(
      makeHolding({ code: 'Tesouro Selic 2029', category: 'fixed', currentValueBrl: 8500 })
    );

    const catDistances = calculateCategoryDistances(
      holdings,
      GOLD_PRESET_BRASIL.macroAllocation,
      10000
    );
    const byCat = calculateAssetDistancesByCategory(
      holdings,
      GOLD_PRESET_BRASIL.assetTargets,
      catDistances,
      10000
    );

    // Preset Brasil: Ações = 51% da carteira; WEGE3 = 15% de Ações => 7,65% global vs 10% atual => distância -2,35%
    const wege = byCat.acoes.find((a) => a.ticker === 'WEGE3');
    expect(wege?.targetPercent).toBe(7.65);
    expect(wege?.currentPercent).toBe(10);
    expect(wege?.distance).toBe(-2.35);
    expect(wege?.inObjective).toBe(true);

    // MGLU3 fora da meta => target 0%, distância -5%
    const mglu = byCat.acoes.find((a) => a.ticker === 'MGLU3');
    expect(mglu?.inObjective).toBe(false);
    expect(mglu?.targetPercent).toBe(0);
    expect(mglu?.distance).toBe(-5);
  });

  it('retorna exatamente 5 indicações com R$ 1.000 na carteira Global mesmo com Stocks EUA acima de R$ 1.900 (frações EUA)', () => {
    const holdings = emptyHoldings();
    // Simula carteira onde Ações BR estão sobrealocadas e FIIs/Stocks/REITs/Renda Fixa estão zerados
    holdings.acoes.push(
      makeHolding({ code: 'VALE3', category: 'acoes', currentPrice: 60, currentValueBrl: 20000 })
    );

    const suggestions = suggestInvestments({
      availableAmountBrl: 1000,
      numAssets: 5,
      holdings,
      macroAllocation: GOLD_PRESET_GLOBAL.macroAllocation,
      assetTargets: GOLD_PRESET_GLOBAL.assetTargets,
      priceMapBrl: {
        WEGE3: 52.4,
        ITUB4: 34.8,
        VALE3: 60.0,
        BBAS3: 16.47,
        TAEE11: 35.1,
        HGLG11: 156.2,
        XPML11: 104.5,
        KNRI11: 141.0,
        MXRF11: 9.85,
        AAPL: 1919.59,
        MSFT: 2813.7,
        GOOGL: 1050.0,
        VOO: 3100.0,
        O: 318.5,
        PLD: 650.0,
        AMT: 1120.0
      },
      emergencyReserveSummary: null,
      usdRate: 5.75
    });

    expect(suggestions).toHaveLength(5);
    const totalAllocated = suggestions.reduce((sum, s) => sum + s.valorTotal, 0);
    expect(totalAllocated).toBeGreaterThan(900);
    expect(totalAllocated).toBeLessThanOrEqual(1000);
    expect(suggestions.every((s) => s.cotas > 0 && s.valorTotal > 0)).toBe(true);
  });

  it('mantém modelos Macro isentos de indicação de ativos e distribui pesos iguais fechando 100% exato', () => {
    expect(MACRO_MODEL_BRASIL.fixed + MACRO_MODEL_BRASIL.variable).toBe(100);
    expect(MACRO_MODEL_BRASIL.brasil).toBe(100);
    expect(MACRO_MODEL_BRASIL.usa).toBe(0);

    expect(MACRO_MODEL_GLOBAL.fixed + MACRO_MODEL_GLOBAL.variable).toBe(100);
    expect(MACRO_MODEL_GLOBAL.brasil + MACRO_MODEL_GLOBAL.usa).toBe(100);

    // Lista inicial de metas deve ser 100% vazia (zero carteira recomendada pronta)
    expect(EMPTY_ASSET_TARGETS.acoes).toHaveLength(0);
    expect(EMPTY_ASSET_TARGETS.fiis).toHaveLength(0);
    expect(EMPTY_ASSET_TARGETS.stocks).toHaveLength(0);
    expect(EMPTY_ASSET_TARGETS.reits).toHaveLength(0);
    expect(EMPTY_ASSET_TARGETS.fixed).toHaveLength(0);

    // 3 ativos escolhidos pelo investidor -> 34% + 33% + 33% = 100%
    const eq3 = distributeEqualTargetWeights([
      { code: 'WEGE3', target: 10 },
      { code: 'ITUB4', target: 10 },
      { code: 'TAEE11', target: 10 }
    ]);
    expect(eq3.map((i) => i.target)).toEqual([34, 33, 33]);
    expect(eq3.reduce((acc, i) => acc + i.target, 0)).toBe(100);
  });

  it('preserva saldo da Reserva em resgate parcial (1 unidade = R$ 1,00) e reconhece títulos de liquidez diária', () => {
    // Aporte R$ 5.000 + R$ 2.500,50 e resgate parcial de R$ 1.200,25 => R$ 6.300,25 remanescente
    const pos = calculateCustodyPosition([
      { type: 'buy', quantity: '5000', price: 1, totalValue: '5000', date: '2026-01-05' },
      { type: 'buy', quantity: '2500.50', price: 1, totalValue: '2500.50', date: '2026-02-05' },
      { type: 'sell', quantity: '1200.25', price: 1, totalValue: '1200.25', date: '2026-03-05' }
    ]);
    expect(pos.quantity.toFixed(2)).toBe('6300.25');

    const holdings = emptyHoldings();
    holdings.fixed.push(
      makeHolding({ code: 'TESOURO_SELIC_2029', category: 'fixed', currentValueBrl: 6300.25 }),
      makeHolding({ code: 'CONTA_REMUNERADA_CDI', category: 'fixed', currentValueBrl: 1699.75 }),
      makeHolding({ code: 'IPCA_2035', category: 'fixed', currentValueBrl: 9999 }) // não é reserva
    );

    const summary = calculateEmergencyReserveStatus(holdings, {
      monthlyExpense: 2000,
      monthsTarget: 6, // meta R$ 12.000
      manualReserveBalance: 0,
      strategyMode: 'hybrid_70_30'
    });

    expect(summary.reserveAssets).toHaveLength(2);
    expect(summary.totalCurrentReserve).toBe(8000);
    expect(summary.missingReserveAmount).toBe(4000);
    expect(summary.reserveMonthsCovered).toBe(4);
    expect(summary.reserveStatus).toBe('em_construcao');
  });
});
