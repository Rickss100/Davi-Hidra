import { desc, eq } from 'drizzle-orm';
import { getDb } from '@/db';
import {
  assets,
  cachedPrices,
  economicIndicators,
  fundamentals,
  transactions,
  userObjectives,
  type AssetTargetsConfig,
  type EmergencyReserveConfig,
  type MacroAllocationConfig
} from '@/db/schema';
import { calculateCustodyPosition, convertToBRL, d, roundCurrency, roundPercent } from '@/lib/money';
import {
  calculateCategoryDistances,
  calculateEmergencyReserveStatus,
  calculateMagicNumbers,
  GOLD_PRESET_BRASIL,
  type CategorizedHoldings,
  type CategoryDistanceDTO,
  type EmergencyReserveSummaryDTO,
  type HoldingPosition,
  type MagicNumberRowDTO,
  type PortfolioCategoryKey
} from '@/server/engines/davi-hydra.engine';

export interface MonthlyDividendPoint {
  month: string; // YYYY-MM
  label: string; // ex: Out/26
  totalBrl: number;
}

export interface PortfolioSnapshotDTO {
  ownerUserId: number;
  usdToBrl: number;
  selicRate: number;
  totalEquityBrl: number;
  totalInvestedBrl: number;
  totalProfitBrl: number;
  totalProfitPercent: number;
  passiveIncome: {
    last90DaysBrl: number;
    currentMonthBrl: number;
    last12MonthsBrl: number;
    monthlyAverage12mBrl: number;
    allTimeBrl: number;
    portfolioYieldOnCostPercent: number;
    monthlySeries: MonthlyDividendPoint[];
  };
  holdings: CategorizedHoldings;
  flatHoldings: HoldingPosition[];
  objectives: {
    hasCustomObjectives: boolean;
    macroAllocation: MacroAllocationConfig;
    assetTargets: AssetTargetsConfig;
    emergencyConfig: EmergencyReserveConfig;
  };
  categoryDistances: CategoryDistanceDTO[];
  emergencyReserve: EmergencyReserveSummaryDTO;
  magicNumbers: MagicNumberRowDTO[];
  priceMapBrl: Record<string, number>;
  recentTransactions: Array<{
    id: number;
    assetCode: string;
    type: string;
    quantity: number;
    price: number;
    totalValue: number;
    executedDate: string;
    notes: string | null;
  }>;
}

const DEFAULT_EMERGENCY_CONFIG: EmergencyReserveConfig = {
  monthlyExpense: 3000,
  monthsTarget: 6,
  manualReserveBalance: 0,
  strategyMode: 'hybrid_70_30'
};

function mapAssetTypeToCategory(type: string, market: string, code: string): PortfolioCategoryKey {
  const t = type.toLowerCase();
  const m = market.toUpperCase();
  const c = code.toUpperCase();

  if (
    t.includes('fixa') ||
    t.includes('fixed') ||
    t.includes('tesouro') ||
    c.includes('TESOURO') ||
    c.includes('SELIC') ||
    c.includes('CDB')
  ) {
    return 'fixed';
  }
  if (t.includes('fii')) return 'fiis';
  if (t.includes('reit')) return 'reits';
  if (t.includes('stock') || m === 'US') return 'stocks';
  if (/^[A-Z]{4}11B?$/.test(c)) return 'fiis';
  return 'acoes';
}

function formatMonthLabel(ym: string): string {
  const [year, month] = ym.split('-');
  const names = ['Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun', 'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'];
  const idx = Math.max(0, Math.min(11, Number(month || 1) - 1));
  return `${names[idx]}/${String(year || '').slice(-2)}`;
}

export async function buildPortfolioSnapshot(userId: number): Promise<PortfolioSnapshotDTO> {
  const db = await getDb();

  const [userTxRows, allAssets, allFunds, allPrices, econRows, objRows] = await Promise.all([
    db
      .select()
      .from(transactions)
      .where(eq(transactions.userId, userId))
      .orderBy(desc(transactions.executedDate), desc(transactions.id)),
    db.select().from(assets),
    db.select().from(fundamentals),
    db.select().from(cachedPrices),
    db.select().from(economicIndicators),
    db.select().from(userObjectives).where(eq(userObjectives.userId, userId)).limit(1)
  ]);

  // Indicadores Macro
  let usdToBrl = 5.65;
  let selicRate = 13.75;
  for (const row of econRows) {
    const ind = row.indicator.toUpperCase();
    const val = Number(row.value);
    if (ind === 'DOLAR' && val > 0) usdToBrl = val;
    if (ind === 'SELIC' && val > 0) selicRate = val;
  }

  const assetMap = new Map(allAssets.map((a) => [a.code.toUpperCase(), a]));
  const fundMap = new Map(allFunds.map((f) => [f.assetCode.toUpperCase(), f]));
  const rawPriceMap = new Map(allPrices.map((p) => [p.assetCode.toUpperCase(), Number(p.price)]));

  // Construir priceMapBrl para o motor de sugestões
  const priceMapBrl: Record<string, number> = {};
  for (const [code, price] of rawPriceMap.entries()) {
    const assetInfo = assetMap.get(code);
    const market = assetInfo?.market === 'US' ? 'US' : 'BR';
    priceMapBrl[code] = roundCurrency(convertToBRL(price, market, usdToBrl));
    if (assetInfo) {
      priceMapBrl[assetInfo.code] = priceMapBrl[code]!;
    }
  }

  // Datas de corte para Renda Passiva Real (baseadas na data mais recente ou relógio atual)
  const now = new Date();
  const currentYm = now.toISOString().slice(0, 7);
  const cutoff90d = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const cutoff12m = new Date(now.getTime() - 365 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

  let div90d = d(0);
  let divCurrentMonth = d(0);
  let div12m = d(0);
  let divAllTime = d(0);
  const monthlyBucket = new Map<string, ReturnType<typeof d>>();
  const div12mByAsset = new Map<string, ReturnType<typeof d>>();

  // Agrupar transações por ticker
  const txByAsset = new Map<
    string,
    Array<{ type: string; quantity: string; price: string; totalValue: string; date: string }>
  >();

  for (const tx of userTxRows) {
    const upperCode = tx.assetCode.trim().toUpperCase();
    const list = txByAsset.get(upperCode) ?? [];
    list.push({
      type: tx.type,
      quantity: tx.quantity,
      price: tx.price,
      totalValue: tx.totalValue,
      date: tx.executedDate
    });
    txByAsset.set(upperCode, list);

    if (tx.type === 'event') {
      const assetInfo = assetMap.get(upperCode);
      const market = assetInfo?.market === 'US' ? 'US' : 'BR';
      const valBrl = convertToBRL(tx.totalValue, market, usdToBrl);

      divAllTime = divAllTime.plus(valBrl);
      if (tx.executedDate >= cutoff90d) div90d = div90d.plus(valBrl);
      if (tx.executedDate.startsWith(currentYm)) divCurrentMonth = divCurrentMonth.plus(valBrl);
      if (tx.executedDate >= cutoff12m) {
        div12m = div12m.plus(valBrl);
        div12mByAsset.set(upperCode, (div12mByAsset.get(upperCode) ?? d(0)).plus(valBrl));
      }

      const ym = tx.executedDate.slice(0, 7);
      if (/^\d{4}-\d{2}$/.test(ym)) {
        monthlyBucket.set(ym, (monthlyBucket.get(ym) ?? d(0)).plus(valBrl));
      }
    }
  }

  // Calcular custódia ativa com Decimal.js
  const categorized: CategorizedHoldings = {
    acoes: [],
    fiis: [],
    stocks: [],
    reits: [],
    fixed: []
  };

  let totalEquityDec = d(0);
  let totalInvestedDec = d(0);

  const rawPositions: Array<{
    pos: HoldingPosition;
    valDec: ReturnType<typeof d>;
  }> = [];

  for (const [upperCode, ops] of txByAsset.entries()) {
    const calc = calculateCustodyPosition(ops);
    if (calc.quantity.lessThanOrEqualTo(0)) continue;

    const assetInfo = assetMap.get(upperCode);
    const displayCode = assetInfo?.code || upperCode;
    const market: 'BR' | 'US' = assetInfo?.market === 'US' ? 'US' : 'BR';
    const category = mapAssetTypeToCategory(assetInfo?.type || 'Acao', market, displayCode);
    const fund = fundMap.get(upperCode);

    const cachedLivePrice = rawPriceMap.get(upperCode);
    const nativeCurrentPrice =
      cachedLivePrice && cachedLivePrice > 0
        ? d(cachedLivePrice)
        : calc.averagePrice.greaterThan(0)
          ? calc.averagePrice
          : category === 'fixed'
            ? d(1)
            : d(0);

    const investedBrlDec = convertToBRL(calc.investedCost, market, usdToBrl);
    const currentValBrlDec = convertToBRL(calc.quantity.mul(nativeCurrentPrice), market, usdToBrl);
    const profitBrlDec = currentValBrlDec.minus(investedBrlDec);
    const profitPctDec = investedBrlDec.greaterThan(0)
      ? profitBrlDec.div(investedBrlDec).mul(100)
      : d(0);

    const assetDiv12mBrl = div12mByAsset.get(upperCode) ?? d(0);
    const assetAllTimeDivBrl = convertToBRL(calc.realizedDividends, market, usdToBrl);
    const fundDy = fund?.dividendYield ? Number(fund.dividendYield) : 0;
    const yocPctDec = investedBrlDec.greaterThan(0)
      ? assetDiv12mBrl.greaterThan(0)
        ? assetDiv12mBrl.div(investedBrlDec).mul(100)
        : d(fundDy)
      : d(0);

    totalEquityDec = totalEquityDec.plus(currentValBrlDec);
    totalInvestedDec = totalInvestedDec.plus(investedBrlDec);

    rawPositions.push({
      valDec: currentValBrlDec,
      pos: {
        code: displayCode,
        name: assetInfo?.name || displayCode,
        category,
        market,
        sector: assetInfo?.sector || null,
        quantity: Number(calc.quantity.toFixed(6)),
        averagePrice: roundCurrency(calc.averagePrice),
        currentPrice: roundCurrency(nativeCurrentPrice),
        investedBrl: roundCurrency(investedBrlDec),
        currentValueBrl: roundCurrency(currentValBrlDec),
        profitBrl: roundCurrency(profitBrlDec),
        profitPercent: roundPercent(profitPctDec, 2),
        portfolioWeightPercent: 0,
        dividendYieldAnnual: roundPercent(fundDy, 2),
        dividends12mBrl: roundCurrency(assetDiv12mBrl),
        totalDividendsBrl: roundCurrency(assetAllTimeDivBrl),
        yieldOnCostPercent: roundPercent(yocPctDec, 2)
      }
    });
  }

  const flatHoldings: HoldingPosition[] = [];
  for (const item of rawPositions) {
    const weight = totalEquityDec.greaterThan(0)
      ? roundPercent(item.valDec.div(totalEquityDec).mul(100), 2)
      : 0;
    item.pos.portfolioWeightPercent = weight;
    categorized[item.pos.category].push(item.pos);
    flatHoldings.push(item.pos);
  }

  // Ordenar posições por maior valor financeiro
  (Object.keys(categorized) as PortfolioCategoryKey[]).forEach((cat) => {
    categorized[cat].sort((a, b) => b.currentValueBrl - a.currentValueBrl);
  });
  flatHoldings.sort((a, b) => b.currentValueBrl - a.currentValueBrl);

  // Objetivos (ou Preset Padrão Ouro Brasil como baseline inicial)
  const savedObj = objRows[0];
  const macroAllocation = savedObj?.macroAllocation ?? GOLD_PRESET_BRASIL.macroAllocation;
  const assetTargets = savedObj?.assetTargets ?? GOLD_PRESET_BRASIL.assetTargets;
  const emergencyConfig = savedObj?.emergencyConfig ?? DEFAULT_EMERGENCY_CONFIG;

  const totalProfitDec = totalEquityDec.minus(totalInvestedDec);
  const totalProfitPct = totalInvestedDec.greaterThan(0)
    ? roundPercent(totalProfitDec.div(totalInvestedDec).mul(100), 2)
    : 0;

  const portfolioYoc = totalInvestedDec.greaterThan(0)
    ? roundPercent(div12m.div(totalInvestedDec).mul(100), 2)
    : 0;

  // Série mensal ordenada dos últimos 12 meses com proventos
  const monthlySeries: MonthlyDividendPoint[] = Array.from(monthlyBucket.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .slice(-12)
    .map(([month, val]) => ({
      month,
      label: formatMonthLabel(month),
      totalBrl: roundCurrency(val)
    }));

  const categoryDistances = calculateCategoryDistances(
    categorized,
    macroAllocation,
    roundCurrency(totalEquityDec)
  );
  const emergencyReserve = calculateEmergencyReserveStatus(categorized, emergencyConfig);
  const magicNumbers = calculateMagicNumbers(categorized);

  return {
    ownerUserId: userId,
    usdToBrl,
    selicRate,
    totalEquityBrl: roundCurrency(totalEquityDec),
    totalInvestedBrl: roundCurrency(totalInvestedDec),
    totalProfitBrl: roundCurrency(totalProfitDec),
    totalProfitPercent: totalProfitPct,
    passiveIncome: {
      last90DaysBrl: roundCurrency(div90d),
      currentMonthBrl: roundCurrency(divCurrentMonth),
      last12MonthsBrl: roundCurrency(div12m),
      monthlyAverage12mBrl: roundCurrency(div12m.div(12)),
      allTimeBrl: roundCurrency(divAllTime),
      portfolioYieldOnCostPercent: portfolioYoc,
      monthlySeries
    },
    holdings: categorized,
    flatHoldings,
    objectives: {
      hasCustomObjectives: Boolean(savedObj),
      macroAllocation,
      assetTargets,
      emergencyConfig
    },
    categoryDistances,
    emergencyReserve,
    magicNumbers,
    priceMapBrl,
    recentTransactions: userTxRows.slice(0, 200).map((t) => ({
      id: t.id,
      assetCode: t.assetCode,
      type: t.type,
      quantity: Number(d(t.quantity).toFixed(4)),
      price: roundCurrency(t.price),
      totalValue: roundCurrency(t.totalValue),
      executedDate: t.executedDate,
      notes: t.notes
    }))
  };
}
