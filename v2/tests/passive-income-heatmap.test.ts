import { describe, it, expect, vi } from 'vitest';
import {
  buildAnnualDividendHeatmap,
  type DividendEventInput
} from '../src/server/engines/passive-income.engine';
import type { HoldingPosition } from '../src/server/engines/davi-hydra.engine';

describe('Motor de Renda Passiva — Mapa de Calor Anual (12 Meses)', () => {
  const sampleHoldings: HoldingPosition[] = [
    {
      code: 'HGLG11',
      name: 'CSHG Logística',
      category: 'fiis',
      market: 'BR',
      sector: 'Logística',
      quantity: 100,
      averagePrice: 150,
      currentPrice: 160,
      investedBrl: 15000,
      currentValueBrl: 16000,
      profitBrl: 1000,
      profitPercent: 6.67,
      portfolioWeightPercent: 50,
      dividendYieldAnnual: 8.5,
      dividends12mBrl: 1360,
      totalDividendsBrl: 2000,
      yieldOnCostPercent: 9.07
    },
    {
      code: 'BBAS3',
      name: 'Banco do Brasil',
      category: 'acoes',
      market: 'BR',
      sector: 'Financeiro',
      quantity: 200,
      averagePrice: 25,
      currentPrice: 28,
      investedBrl: 5000,
      currentValueBrl: 5600,
      profitBrl: 600,
      profitPercent: 12.0,
      portfolioWeightPercent: 50,
      dividendYieldAnnual: 9.0,
      dividends12mBrl: 504,
      totalDividendsBrl: 800,
      yieldOnCostPercent: 10.08
    }
  ];

  it('deve gerar 12 meses cronológicos (Janeiro a Dezembro) com totais precisos', () => {
    const heatmap = buildAnnualDividendHeatmap({
      events: [],
      holdings: sampleHoldings,
      year: 2026,
      today: '2026-06-15'
    });

    expect(heatmap.year).toBe(2026);
    expect(heatmap.months).toHaveLength(12);
    expect(heatmap.months[0]?.monthName).toBe('Jan');
    expect(heatmap.months[11]?.monthName).toBe('Dez');
    expect(heatmap.totalYearBrl).toBeGreaterThan(0);
    expect(heatmap.monthlyAverageBrl).toBeGreaterThan(0);
  });

  it('deve priorizar proventos reais registrados no mês e somá-los corretamente', () => {
    const realEvents: DividendEventInput[] = [
      {
        id: 1,
        assetCode: 'BBAS3',
        assetName: 'Banco do Brasil',
        category: 'acoes',
        date: '2026-03-12',
        quantity: 200,
        totalBrl: 450.0,
        notes: 'Dividendo'
      },
      {
        id: 2,
        assetCode: 'HGLG11',
        assetName: 'CSHG Logística',
        category: 'fiis',
        date: '2026-03-15',
        quantity: 100,
        totalBrl: 110.0,
        notes: 'Rendimento FII'
      }
    ];

    const heatmap = buildAnnualDividendHeatmap({
      events: realEvents,
      holdings: sampleHoldings,
      year: 2026,
      today: '2026-06-15'
    });

    const marco = heatmap.months[2]; // Mês 3 (Março)
    expect(marco).toBeDefined();
    expect(marco?.month).toBe(3);
    expect(marco?.hasRealPayments).toBe(true);
    expect(marco?.totalBrl).toBe(560.0); // 450 + 110
    expect(marco?.assets).toHaveLength(2);
    expect(marco?.assets[0]?.code).toBe('BBAS3');
    expect(marco?.assets[0]?.totalBrl).toBe(450.0);
    expect(marco?.assets[0]?.isEstimated).toBe(false);
  });

  it('deve identificar corretamente o Mês Campeão (recorde de proventos)', () => {
    const realEvents: DividendEventInput[] = [
      {
        id: 1,
        assetCode: 'BBAS3',
        assetName: 'Banco do Brasil',
        category: 'acoes',
        date: '2026-08-20',
        quantity: 200,
        totalBrl: 2500.0, // Grande distribuição em Agosto
        notes: 'Dividendo Extraordinário'
      }
    ];

    const heatmap = buildAnnualDividendHeatmap({
      events: realEvents,
      holdings: sampleHoldings,
      year: 2026,
      today: '2026-06-15'
    });

    expect(heatmap.bestMonth).not.toBeNull();
    expect(heatmap.bestMonth?.month).toBe(8);
    expect(heatmap.bestMonth?.monthName).toBe('Ago');
    expect(heatmap.bestMonth?.totalBrl).toBeGreaterThanOrEqual(2500.0);
  });

  it('deve sinalizar o mês atual conforme a data fornecida', () => {
    const heatmap = buildAnnualDividendHeatmap({
      events: [],
      holdings: sampleHoldings,
      year: 2026,
      today: '2026-11-01'
    });

    const novembro = heatmap.months[10]; // Mês 11 (Novembro)
    expect(novembro?.isCurrentMonth).toBe(true);

    const outubro = heatmap.months[9];
    expect(outubro?.isCurrentMonth).toBe(false);
  });
});
