import { describe, expect, it } from 'vitest';
import {
  buildDividendCalendar,
  calculatePassiveIncomeMetrics,
  projectFutureIncome,
  type DividendEventInput
} from '@/server/engines/passive-income.engine';
import { calculateMagicNumbers, type HoldingPosition } from '@/server/engines/davi-hydra.engine';

function holding(o: Partial<HoldingPosition> & { code: string; category: HoldingPosition['category'] }): HoldingPosition {
  return {
    name: o.code,
    market: 'BR',
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

function event(id: number, code: string, date: string, qty: number, total: number, notes = 'Rendimento'): DividendEventInput {
  return { id, assetCode: code, assetName: code, category: 'fiis', date, quantity: qty, totalBrl: total, notes };
}

describe('Renda Passiva — métricas', () => {
  it('usa proventos reais 12m e calcula DY, YoC e cobertura sem DY inventado', () => {
    const m = calculatePassiveIncomeMetrics({
      holdings: [
        holding({ code: 'ITUB4', category: 'acoes', currentValueBrl: 20000, investedBrl: 17000 }),
        holding({ code: 'SELIC', category: 'fixed', currentValueBrl: 50000, investedBrl: 50000 })
      ],
      dividends12mBrl: 1700,
      monthlyExpenseBrl: 3000
    });
    expect(m.source).toBe('real');
    expect(m.estimatedMonthlyIncomeBrl).toBe(141.67);
    expect(m.dividendYieldPercent).toBe(8.5); // renda fixa fora da base
    expect(m.yieldOnCostPercent).toBe(10);
    expect(m.costCoveragePercent).toBe(4.7);
  });

  it('sem proventos usa DY fundamentalista e, sem nenhum dado, retorna zero (não inventa)', () => {
    const est = calculatePassiveIncomeMetrics({
      holdings: [holding({ code: 'HGLG11', category: 'fiis', currentValueBrl: 12000, dividendYieldAnnual: 9 })],
      dividends12mBrl: 0,
      monthlyExpenseBrl: 3000
    });
    expect(est.source).toBe('estimated');
    expect(est.estimatedAnnualIncomeBrl).toBe(1080);

    const none = calculatePassiveIncomeMetrics({
      holdings: [holding({ code: 'XPTO3', category: 'acoes' })],
      dividends12mBrl: 0,
      monthlyExpenseBrl: 3000
    });
    expect(none.source).toBe('none');
    expect(none.estimatedMonthlyIncomeBrl).toBe(0);
  });
});

describe('Renda Passiva — calendário', () => {
  const holdings = [holding({ code: 'HGLG11', category: 'fiis', quantity: 100 })];
  const events = [
    event(1, 'HGLG11', '2026-07-14', 100, 110),
    event(2, 'HGLG11', '2026-08-14', 100, 120),
    event(3, 'HGLG11', '2026-09-14', 100, 130),
    event(4, 'HGLG11', '2026-10-14', 100, 140)
  ];

  it('marca como pago o provento real passado e soma o mês', () => {
    const cal = buildDividendCalendar({ events, holdings, year: 2026, month: 10, today: '2026-10-31' });
    expect(cal.receivedBrl).toBe(140);
    expect(cal.estimatedBrl).toBe(0);
    expect(cal.days[14]?.payments[0]?.status).toBe('pago');
  });

  it('estima o próximo mês de pagador mensal pela média por cota dos 3 últimos pagamentos', () => {
    const cal = buildDividendCalendar({ events, holdings, year: 2026, month: 11, today: '2026-10-31' });
    // média por cota (1,40 + 1,30 + 1,20) / 3 = 1,30 × 100 cotas = 130
    expect(cal.estimatedBrl).toBe(130);
    expect(cal.days[14]?.payments[0]?.status).toBe('estimado');
  });

  it('não gera estimativa para meses passados nem para ativos já vendidos', () => {
    const past = buildDividendCalendar({ events, holdings, year: 2026, month: 9, today: '2026-10-31' });
    expect(past.estimatedBrl).toBe(0);
    const sold = buildDividendCalendar({ events, holdings: [], year: 2026, month: 11, today: '2026-10-31' });
    expect(sold.paymentCount).toBe(0);
  });
});

describe('Renda Passiva — previsão futura', () => {
  it('sem reinvestimento a renda cresce só com aporte e valorização; com bola de neve cresce mais', () => {
    const base = {
      currentEquityBrl: 30000,
      monthlyContributionBrl: 1500,
      months: 36,
      dividendYieldAnnualPercent: 8.5,
      monthlyExpenseBrl: 3000
    };
    const snow = projectFutureIncome({ ...base, reinvest: true });
    const plain = projectFutureIncome({ ...base, reinvest: false });
    expect(snow.finalEquityBrl).toBeGreaterThan(plain.finalEquityBrl);
    expect(snow.totalContributedBrl).toBe(54000);
    expect(snow.timeline.at(-1)?.month).toBe(36);
    expect(snow.coveragePercent).toBeGreaterThan(0);
  });

  it('com patrimônio zero e aporte zero, a renda é zero', () => {
    const f = projectFutureIncome({
      currentEquityBrl: 0,
      monthlyContributionBrl: 0,
      months: 12,
      dividendYieldAnnualPercent: 8,
      reinvest: true,
      monthlyExpenseBrl: 3000
    });
    expect(f.finalMonthlyIncomeBrl).toBe(0);
  });
});

describe('Renda Passiva — Número Mágico enriquecido', () => {
  it('informa provento mensal, cotas geradas por mês e ativação da bola de neve', () => {
    const rows = calculateMagicNumbers({
      acoes: [],
      stocks: [],
      reits: [],
      fixed: [],
      fiis: [
        // R$ 100/cota, 1,00/mês por cota => Número Mágico 100
        holding({ code: 'HGLG11', category: 'fiis', quantity: 25, currentValueBrl: 2500, dividends12mBrl: 300 }),
        holding({ code: 'MXRF11', category: 'fiis', quantity: 150, currentValueBrl: 1500, dividends12mBrl: 1800 })
      ]
    });
    const hglg = rows.find((r) => r.code === 'HGLG11')!;
    expect(hglg.magicNumberShares).toBe(100);
    expect(hglg.monthlyIncomeBrl).toBe(25);
    expect(hglg.sharesGeneratedPerMonth).toBe(0.25);
    expect(hglg.isMagicReached).toBe(false);
    expect(hglg.dataSource).toBe('real_12m');
    expect(rows.find((r) => r.code === 'MXRF11')!.isMagicReached).toBe(true);
  });
});
