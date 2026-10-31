import { describe, expect, it } from 'vitest';
import {
  calculateCustodyPosition,
  convertToBRL,
  d,
  roundCurrency,
  roundCurrencyStr
} from '@/lib/money';
import {
  calculateCategoryDistances,
  calculateEmergencyReserveStatus,
  calculateMagicNumbers,
  GOLD_PRESET_BRASIL,
  GOLD_PRESET_GLOBAL,
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
});
