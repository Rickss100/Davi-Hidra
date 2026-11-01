import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { assets, transactions } from '@/db/schema';
import { d, roundCurrency, roundPercent } from '@/lib/money';
import {
  addMonths,
  buildBenchmarkChart,
  calculateTwrIndex,
  computeMonthlyPortfolio,
  monthLabel,
  monthRange,
  type BenchmarkInputs,
  type BenchmarkPeriod,
  type BenchmarkPointDTO,
  type LedgerOp,
  type MonthlySeries,
  type PerformanceSummaryDTO
} from '@/server/engines/performance.engine';
import {
  getBcbMonthlyRates,
  getManyMonthlyCloses,
  getMonthlyCloses,
  type HistoryRange
} from '@/server/services/market-history.service';
import { mapAssetTypeToCategory, type PortfolioSnapshotDTO } from '@/server/engines/portfolio.service';

export interface EvolutionPointDTO {
  ym: string;
  label: string;
  investedBrl: number;
  equityBrl: number;
}

export interface ResumoPerformanceDTO {
  period: BenchmarkPeriod;
  hasInvestments: boolean;
  hasEnoughHistory: boolean;
  points: BenchmarkPointDTO[];
  summary: PerformanceSummaryDTO;
  /** Resumo desde o 1º aporte (alimenta o card "Desempenho vs. CDI"). */
  totalSummary: PerformanceSummaryDTO;
  evolution: EvolutionPointDTO[];
  quality: {
    missingPriceAssets: string[];
    unavailableSources: string[];
    ratesEstimated: boolean;
  };
}

/** Mês corrente no fuso de São Paulo (evita virar o mês antes da hora por causa do UTC). */
export function currentYmSaoPaulo(now = new Date()): string {
  const parts = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'America/Sao_Paulo',
    year: 'numeric',
    month: '2-digit'
  }).formatToParts(now);
  const year = parts.find((p) => p.type === 'year')?.value ?? String(now.getUTCFullYear());
  const month = parts.find((p) => p.type === 'month')?.value ?? '01';
  return `${year}-${month}`;
}

const SYMBOL_BY_MARKET = (code: string, market: 'BR' | 'US') =>
  market === 'US' ? code.toUpperCase() : `${code.toUpperCase()}.SA`;

export async function buildResumoPerformance(
  userId: number,
  period: BenchmarkPeriod,
  snapshot: PortfolioSnapshotDTO
): Promise<ResumoPerformanceDTO> {
  const db = await getDb();
  const [txRows, assetRows] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(
        and(eq(transactions.userId, userId), inArray(transactions.type, ['buy', 'sell', 'event']))
      ),
    db.select().from(assets)
  ]);

  const assetMap = new Map(assetRows.map((a) => [a.code.toUpperCase(), a]));

  const ops: LedgerOp[] = txRows.map((tx) => {
    const upper = tx.assetCode.trim().toUpperCase();
    const info = assetMap.get(upper);
    const market: 'BR' | 'US' = info?.market === 'US' ? 'US' : 'BR';
    return {
      assetCode: info?.code || upper,
      type: tx.type as LedgerOp['type'],
      quantity: Number(tx.quantity),
      totalValue: Number(tx.totalValue),
      date: tx.executedDate,
      category: mapAssetTypeToCategory(info?.type || 'Acao', market, info?.code || upper),
      market
    };
  });

  const trades = ops.filter((o) => o.type === 'buy' || o.type === 'sell');
  const hasInvestments = trades.length > 0;
  const currentYm = currentYmSaoPaulo();
  const firstYm = hasInvestments
    ? trades.map((o) => o.date.slice(0, 7)).sort()[0]!
    : null;
  const months = firstYm ? monthRange(firstYm, currentYm) : [];

  // Janela de dados necessária (carteira sem aportes: até 36 meses de referência)
  const spanMonths = months.length > 0 ? months.length : 36;
  const range: HistoryRange = spanMonths <= 22 ? '2y' : spanMonths <= 58 ? '5y' : '10y';
  const fromYm = addMonths(firstYm ?? currentYm, firstYm ? -1 : -37);

  const tradedAssets = Array.from(
    new Map(
      trades.filter((o) => o.category !== 'fixed').map((o) => [o.assetCode.toUpperCase(), o.market])
    ).entries()
  );

  const [cdiRates, ipcaRates, ibov, gspc, ifix, usdBrl, assetPrices] = await Promise.all([
    getBcbMonthlyRates('CDI', fromYm),
    getBcbMonthlyRates('IPCA', fromYm),
    getMonthlyCloses('^BVSP', range),
    getMonthlyCloses('^GSPC', range),
    getMonthlyCloses('IFIX.SA', range).then(async (res) =>
      Object.keys(res).length >= 2 ? res : getMonthlyCloses('XFIX11.SA', range)
    ),
    getMonthlyCloses('BRL=X', range),
    getManyMonthlyCloses(
      tradedAssets.map(([code, market]) => SYMBOL_BY_MARKET(code, market)),
      range
    )
  ]);

  // S&P 500 em reais (o investidor brasileiro sente o efeito cambial)
  const sp500Brl: MonthlySeries = {};
  for (const [ym, level] of Object.entries(gspc)) {
    const fx = usdBrl[ym];
    if (fx) sp500Brl[ym] = d(level).mul(fx).toNumber();
  }

  const priceByAsset: Record<string, MonthlySeries> = {};
  for (const [code, market] of tradedAssets) {
    priceByAsset[code] = assetPrices[SYMBOL_BY_MARKET(code, market)] ?? {};
  }

  const monthly = hasInvestments
    ? computeMonthlyPortfolio({
        ops,
        months,
        priceByAsset,
        usdBrl,
        fallbackUsdBrl: snapshot.usdToBrl,
        cdiRates
      })
    : { points: [], missingPriceAssets: [] as string[] };

  // Âncora no presente: último ponto reflete exatamente o que os cards mostram
  const lastPoint = monthly.points[monthly.points.length - 1];
  if (lastPoint) {
    lastPoint.equityBrl = roundCurrency(snapshot.totalEquityBrl);
    lastPoint.investedBrl = roundCurrency(snapshot.totalInvestedBrl);
  }

  const twrIndex = calculateTwrIndex(monthly.points);
  const inputs: BenchmarkInputs = { sp500: sp500Brl, ibov, ifix, cdiRates, ipcaRates };
  const common = {
    currentYm,
    portfolioMonths: monthly.points.map((p) => p.ym),
    portfolioIndex: twrIndex,
    realReturnPercent: snapshot.totalProfitPercent,
    hasInvestments,
    inputs,
    userId
  };

  const selected = buildBenchmarkChart({ ...common, period });
  const total = period === 'total' ? selected : buildBenchmarkChart({ ...common, period: 'total' });

  // Cálculo pro-rata do CDI para o card "Desempenho vs. CDI" desde o 1º aporte real
  let years = 1;
  if (firstYm) {
    const firstTxDate = trades.map((t) => t.date).sort()[0];
    if (firstTxDate) {
      const msDiff = Date.now() - new Date(firstTxDate).getTime();
      years = Math.max(msDiff / (1000 * 60 * 60 * 24 * 365), 0.08); // mínimo ~1 mês
    }
  }

  const cdiAnnual = 11.19; // Taxa CDI anualizada de mercado
  const cdiPerformanceSinceInception = roundPercent(d((Math.pow(1 + cdiAnnual / 100, years) - 1) * 100), 2);
  const alphaVsCdiSinceInception = roundPercent(d(snapshot.totalProfitPercent).minus(cdiPerformanceSinceInception), 2);
  const pctOfCdi =
    cdiPerformanceSinceInception > 0
      ? roundPercent(d(snapshot.totalProfitPercent).div(cdiPerformanceSinceInception).mul(100), 0)
      : null;

  const totalSummary: PerformanceSummaryDTO = {
    portfolioReturnPercent: snapshot.totalProfitPercent,
    cdiReturnPercent: cdiPerformanceSinceInception,
    ipcaReturnPercent: total.summary.ipcaReturnPercent,
    ibovReturnPercent: total.summary.ibovReturnPercent,
    sp500ReturnPercent: total.summary.sp500ReturnPercent,
    ifixReturnPercent: total.summary.ifixReturnPercent,
    alphaVsCdiPp: alphaVsCdiSinceInception,
    alphaVsIbovPp: total.summary.alphaVsIbovPp,
    realGainVsIpcaPercent: total.summary.realGainVsIpcaPercent,
    percentOfCdi: pctOfCdi
  };

  const unavailableSources: string[] = [];
  if (Object.keys(cdiRates).length === 0) unavailableSources.push('CDI (Banco Central)');
  if (Object.keys(ipcaRates).length === 0) unavailableSources.push('IPCA (Banco Central)');
  if (Object.keys(ibov).length === 0) unavailableSources.push('Ibovespa');
  if (Object.keys(sp500Brl).length === 0) unavailableSources.push('S&P 500');
  if (Object.keys(ifix).length === 0) unavailableSources.push('IFIX');

  // Evolução do Capital Aplicado: estritamente os meses reais de transações (sem injetar ponto 0 artificial)
  const evolutionPoints: EvolutionPointDTO[] = [];
  if (monthly.points.length > 0) {
    monthly.points.forEach((p) => {
      evolutionPoints.push({
        ym: p.ym,
        label: p.label,
        investedBrl: p.investedBrl,
        equityBrl: p.equityBrl
      });
    });
  }

  return {
    period,
    hasInvestments,
    hasEnoughHistory: selected.hasEnoughHistory,
    points: selected.points,
    summary: selected.summary,
    totalSummary,
    evolution: evolutionPoints,
    quality: {
      missingPriceAssets: monthly.missingPriceAssets,
      unavailableSources,
      ratesEstimated: selected.ratesEstimated || total.ratesEstimated
    }
  };
}
