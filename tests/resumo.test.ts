import { describe, expect, it } from 'vitest';
import { buildAllocationBreakdown } from '@/server/engines/allocation.engine';
import {
  addMonths,
  buildBenchmarkChart,
  calculateTwrIndex,
  computeMonthlyPortfolio,
  monthRange,
  type LedgerOp
} from '@/server/engines/performance.engine';
import type { CategorizedHoldings, HoldingPosition } from '@/server/engines/davi-hydra.engine';

function holding(o: Partial<HoldingPosition> & { code: string; category: HoldingPosition['category'] }): HoldingPosition {
  return {
    name: o.code,
    market: o.category === 'stocks' || o.category === 'reits' ? 'US' : 'BR',
    sector: null,
    quantity: 10,
    averagePrice: 10,
    currentPrice: 10,
    investedBrl: 100,
    currentValueBrl: 100,
    profitBrl: 0,
    profitPercent: 0,
    portfolioWeightPercent: 0,
    dividendYieldAnnual: 0,
    dividends12mBrl: 0,
    totalDividendsBrl: 0,
    yieldOnCostPercent: 0,
    ...o
  };
}

const buy = (code: string, date: string, qty: number, total: number): LedgerOp => ({
  assetCode: code,
  type: 'buy',
  quantity: qty,
  totalValue: total,
  date,
  category: 'acoes',
  market: 'BR'
});

describe('Resumo — helpers de mês', () => {
  it('soma meses atravessando o ano e gera intervalos contíguos', () => {
    expect(addMonths('2026-11', 3)).toBe('2027-02');
    expect(addMonths('2026-01', -1)).toBe('2025-12');
    expect(monthRange('2025-11', '2026-02')).toEqual(['2025-11', '2025-12', '2026-01', '2026-02']);
  });
});

describe('Resumo — rentabilidade TWR (Dietz modificado)', () => {
  const months = ['2026-01', '2026-02', '2026-03', '2026-04'];
  const prices = { ITUB4: { '2026-01': 10, '2026-02': 11, '2026-03': 11, '2026-04': 12 } };

  it('um aporte no meio do caminho NÃO distorce a rentabilidade (preço 10→12 = +20%)', () => {
    const { points } = computeMonthlyPortfolio({
      ops: [buy('ITUB4', '2026-01-10', 10, 100), buy('ITUB4', '2026-03-10', 10, 110)],
      months,
      priceByAsset: prices,
      usdBrl: {},
      fallbackUsdBrl: 5,
      cdiRates: {}
    });
    expect(points.map((p) => p.equityBrl)).toEqual([100, 110, 220, 240]);
    expect(points.map((p) => p.investedBrl)).toEqual([100, 100, 210, 210]);

    const idx = calculateTwrIndex(points);
    expect(idx[3]).toBeCloseTo(1.2, 4);
  });

  it('proventos recebidos entram como retorno', () => {
    const { points } = computeMonthlyPortfolio({
      ops: [
        buy('ITUB4', '2026-01-10', 10, 100),
        { assetCode: 'ITUB4', type: 'event', quantity: 0, totalValue: 11, date: '2026-02-15', category: 'acoes', market: 'BR' }
      ],
      months: ['2026-01', '2026-02'],
      priceByAsset: { ITUB4: { '2026-01': 10, '2026-02': 10 } },
      usdBrl: {},
      fallbackUsdBrl: 5,
      cdiRates: {}
    });
    expect(calculateTwrIndex(points)[1]).toBeCloseTo(1.11, 4);
  });

  it('renda fixa é capitalizada pelo CDI e ativo sem cotação é valorizado ao custo e sinalizado', () => {
    const fixed: LedgerOp = {
      assetCode: 'TESOURO_SELIC_2029',
      type: 'buy',
      quantity: 1000,
      totalValue: 1000,
      date: '2026-01-05',
      category: 'fixed',
      market: 'BR'
    };
    const { points, missingPriceAssets } = computeMonthlyPortfolio({
      ops: [fixed, buy('SEMHIST3', '2026-01-06', 10, 100)],
      months: ['2026-01', '2026-02'],
      priceByAsset: {},
      usdBrl: {},
      fallbackUsdBrl: 5,
      cdiRates: { '2026-02': 1 }
    });
    expect(points[1]!.equityBrl).toBe(1110); // 1000 × 1,01 + 100 ao custo
    expect(missingPriceAssets).toEqual(['SEMHIST3']);
  });
});

describe('Resumo — janelas e benchmarks', () => {
  const inputs = {
    sp500: {},
    ibov: { '2026-01': 100, '2026-02': 110, '2026-03': 121 },
    ifix: {},
    cdiRates: { '2026-01': 1, '2026-02': 1, '2026-03': 1 },
    ipcaRates: { '2026-01': 0.5, '2026-02': 0.5, '2026-03': 0.5 }
  };

  it('rebaseia todas as curvas no mesmo mês-base e calcula alfa, ganho real e % do CDI', () => {
    const result = buildBenchmarkChart({
      period: 'total',
      currentYm: '2026-03',
      portfolioMonths: ['2026-01', '2026-02', '2026-03'],
      portfolioIndex: [1, 1.05, 1.1025],
      realReturnPercent: 10.25,
      hasInvestments: true,
      inputs
    });
    const last = result.points[2]!;
    expect(result.points[0]).toMatchObject({ carteira: 0, ibov: 0, cdi: 0 });
    expect(last.carteira).toBe(10.25);
    expect(last.ibov).toBe(21);
    expect(last.cdi).toBe(2.01); // (1,01²)−1
    expect(result.summary.alphaVsCdiPp).toBe(8.24);
    expect(result.summary.percentOfCdi).toBe(510);
    expect(result.summary.realGainVsIpcaPercent).toBeGreaterThan(9);
    expect(result.hasEnoughHistory).toBe(true);
  });

  it('usa a última taxa conhecida em meses ainda não divulgados e sinaliza a estimativa', () => {
    const result = buildBenchmarkChart({
      period: 'total',
      currentYm: '2026-03',
      portfolioMonths: ['2026-01', '2026-02', '2026-03'],
      portfolioIndex: [1, 1, 1],
      realReturnPercent: 10,
      hasInvestments: true,
      inputs: { ...inputs, cdiRates: { '2026-01': 1, '2026-02': 1 } }
    });
    expect(result.ratesEstimated).toBe(true);
    expect(result.points[2]!.cdi).toBe(2.01);
  });

  it('carteira sem aportes mostra só os índices de referência (sem inventar curva da carteira)', () => {
    const result = buildBenchmarkChart({
      period: '6m',
      currentYm: '2026-03',
      portfolioMonths: [],
      portfolioIndex: [],
      realReturnPercent: 0,
      hasInvestments: false,
      inputs
    });
    expect(result.points).toHaveLength(7);
    expect(result.points.every((p) => p.carteira === null)).toBe(true);
    expect(result.summary.portfolioReturnPercent).toBeNull();
  });

  it('YTD converge exatamente para o retorno real da carteira', () => {
    const result = buildBenchmarkChart({
      period: 'ytd',
      currentYm: '2026-03',
      portfolioMonths: ['2026-02', '2026-03'],
      portfolioIndex: [1, 1.02],
      realReturnPercent: 16.94,
      hasInvestments: true,
      inputs
    });
    const last = result.points[result.points.length - 1]!;
    expect(last.carteira).toBe(16.94);
  });
});

describe('Resumo — composição por classe', () => {
  it('separa a Reserva de Emergência da Renda Fixa e calcula exposição Brasil × Exterior', () => {
    const holdings: CategorizedHoldings = {
      acoes: [holding({ code: 'ITUB4', category: 'acoes', investedBrl: 800, currentValueBrl: 1000 })],
      fiis: [],
      stocks: [holding({ code: 'AAPL', category: 'stocks', investedBrl: 900, currentValueBrl: 1000 })],
      reits: [],
      fixed: [
        holding({ code: 'TESOURO_SELIC_2029', category: 'fixed', investedBrl: 1900, currentValueBrl: 2000 }),
        holding({ code: 'IPCA_2035', category: 'fixed', investedBrl: 1000, currentValueBrl: 1000 })
      ]
    };
    const alloc = buildAllocationBreakdown(holdings, ['TESOURO_SELIC_2029']);

    expect(alloc.totalCurrentBrl).toBe(5000);
    expect(alloc.classes.map((c) => c.key)).toEqual(['acoes', 'stocks', 'fixed', 'reserva']);
    expect(alloc.classes.find((c) => c.key === 'reserva')!.sharePercent).toBe(40);
    expect(alloc.classes.find((c) => c.key === 'acoes')!.returnPercent).toBe(25);
    expect(alloc.geography.exteriorPercent).toBe(20);
    expect(alloc.geography.brasilPercent).toBe(80);
    expect(alloc.classes.reduce((s, c) => s + c.sharePercent, 0)).toBe(100);
  });
});
