import { d, roundCurrency, roundPercent } from '@/lib/money';
import type {
  AssetTargetsConfig,
  EmergencyReserveConfig,
  MacroAllocationConfig
} from '@/db/schema';

export type PortfolioCategoryKey = 'acoes' | 'fiis' | 'stocks' | 'reits' | 'fixed';

export interface HoldingPosition {
  code: string;
  name: string;
  category: PortfolioCategoryKey;
  market: 'BR' | 'US';
  sector: string | null;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  investedBrl: number;
  currentValueBrl: number;
  profitBrl: number;
  profitPercent: number;
  portfolioWeightPercent: number;
  dividendYieldAnnual: number;
  dividends12mBrl: number;
  totalDividendsBrl: number;
  yieldOnCostPercent: number;
}

export type CategorizedHoldings = Record<PortfolioCategoryKey, HoldingPosition[]>;

export interface CategoryDistanceDTO {
  category: PortfolioCategoryKey;
  name: string;
  currentValueBrl: number;
  currentPercent: number;
  targetPercent: number;
  distance: number;
}

export interface AssetDistanceDTO {
  ticker: string;
  category: PortfolioCategoryKey;
  currentPercent: number;
  targetPercent: number;
  distance: number;
  financialDistanceBrl: number;
  currentPriceBrl: number;
  nativePrice: number;
  market: 'BR' | 'US';
}

export interface EmergencyReserveSummaryDTO {
  monthlyExpense: number;
  monthsTarget: number;
  manualReserveBalance: number;
  strategyMode: 'focus_100' | 'hybrid_70_30' | 'hybrid_50_50';
  totalCurrentReserve: number;
  targetReserveAmount: number;
  missingReserveAmount: number;
  reserveCompletionPercent: number;
  reserveMonthsCovered: number;
  reserveStatus: 'critico' | 'em_construcao' | 'quase_blindada' | 'blindada';
  reserveAssets: HoldingPosition[];
}

export interface AssetDistanceBreakdownDTO {
  ticker: string;
  name: string;
  category: PortfolioCategoryKey;
  currentPercent: number;
  targetPercent: number;
  classTargetPercent: number;
  distance: number;
  inObjective: boolean;
}

export interface InvestmentSuggestionDTO {
  ticker: string;
  assetName?: string;
  categoria: PortfolioCategoryKey;
  cotas: number;
  currentPrice: number;
  valorTotal: number;
  distance: number;
  isEmergencyReserve?: boolean;
  reason: string;
  daviWarning?: string;
  mfsWarning?: string;
  magicNumberText?: string;
}

export interface MagicNumberRowDTO {
  code: string;
  name: string;
  category: PortfolioCategoryKey;
  currentShares: number;
  currentPriceBrl: number;
  estimatedMonthlyDividendPerShareBrl: number;
  magicNumberShares: number;
  missingShares: number;
  investmentNeededBrl: number;
  progressPercent: number;
  monthlyIncomeBrl: number;
  sharesGeneratedPerMonth: number;
  isMagicReached: boolean;
  dataSource: 'real_12m' | 'dy_fundamentalista';
}

// ============================================================================
// MODELOS EDUCACIONAIS DE ALOCAÇÃO MACRO (SEM INDICAÇÃO DE ATIVOS — CVM 19/2021)
// ============================================================================
export const MACRO_MODEL_BRASIL: MacroAllocationConfig = {
  fixed: 15,
  variable: 85,
  brasil: 100,
  usa: 0,
  acoes: 60,
  fiis: 40,
  stocks: 0,
  reits: 0
};

export const MACRO_MODEL_GLOBAL: MacroAllocationConfig = {
  fixed: 20,
  variable: 80,
  brasil: 75,
  usa: 25,
  acoes: 66.67,
  fiis: 33.33,
  stocks: 75,
  reits: 25
};

export const EMPTY_ASSET_TARGETS: AssetTargetsConfig = {
  acoes: [],
  fiis: [],
  stocks: [],
  reits: [],
  fixed: [],
  reserva: []
};

/**
 * Distribui 100% igualmente entre os ativos escolhidos pelo investidor sem sobras de arredondamento.
 */
export function distributeEqualTargetWeights<T extends { code: string; target: number }>(
  items: T[]
): T[] {
  if (items.length === 0) return [];
  const base = Math.floor(100 / items.length);
  const remainder = 100 - base * items.length;
  return items.map((item, idx) => ({
    ...item,
    target: base + (idx < remainder ? 1 : 0)
  }));
}

// Fixtures internas mantidas apenas para testes automatizados de regressão matemática
export const GOLD_PRESET_BRASIL: {
  macroAllocation: MacroAllocationConfig;
  assetTargets: AssetTargetsConfig;
} = {
  macroAllocation: MACRO_MODEL_BRASIL,
  assetTargets: {
    acoes: [
      { code: 'WEGE3', sector: 'Bens Industriais', target: 15 },
      { code: 'ITUB3', sector: 'Financeiro', target: 15 },
      { code: 'PSSA3', sector: 'Seguros', target: 12 },
      { code: 'EQTL3', sector: 'Utilidade Pública', target: 12 },
      { code: 'EGIE3', sector: 'Utilidade Pública', target: 10 },
      { code: 'CPFE3', sector: 'Utilidade Pública', target: 10 },
      { code: 'RENT3', sector: 'Locação / Consumo', target: 10 },
      { code: 'FLRY3', sector: 'Saúde', target: 8 },
      { code: 'BBDC3', sector: 'Financeiro', target: 8 }
    ],
    fiis: [
      { code: 'HGLG11', sector: 'Logística', target: 15 },
      { code: 'XPML11', sector: 'Shoppings', target: 15 },
      { code: 'KNRI11', sector: 'Híbrido', target: 15 },
      { code: 'FIIB11', sector: 'Industrial', target: 15 },
      { code: 'HGRU11', sector: 'Renda Urbana', target: 10 },
      { code: 'VISC11', sector: 'Shoppings', target: 10 },
      { code: 'VRTA11', sector: 'Papel', target: 10 },
      { code: 'BCRI11', sector: 'Papel', target: 10 }
    ],
    stocks: [],
    reits: [],
    fixed: [{ code: 'Tesouro Selic 2029', sector: 'Títulos Públicos', target: 100 }],
    reserva: [{ code: 'TESOURO_SELIC_2029', sector: 'Título Público Federal', target: 100 }]
  }
};

export const GOLD_PRESET_GLOBAL: {
  macroAllocation: MacroAllocationConfig;
  assetTargets: AssetTargetsConfig;
} = {
  macroAllocation: {
    fixed: 15,
    variable: 85,
    brasil: 60,
    usa: 40,
    acoes: 60,
    fiis: 40,
    stocks: 70,
    reits: 30
  },
  assetTargets: {
    acoes: [
      { code: 'ITUB4', sector: 'Financeiro', target: 20 },
      { code: 'BBAS3', sector: 'Financeiro', target: 15 },
      { code: 'WEGE3', sector: 'Bens Industriais', target: 15 },
      { code: 'EGIE3', sector: 'Utilidade Pública', target: 15 },
      { code: 'ALUP11', sector: 'Utilidade Pública', target: 15 },
      { code: 'SAPR11', sector: 'Saneamento', target: 10 },
      { code: 'VALE3', sector: 'Materiais Básicos', target: 10 }
    ],
    fiis: [
      { code: 'ALZR11', sector: 'Híbrido', target: 20 },
      { code: 'XPML11', sector: 'Shoppings', target: 20 },
      { code: 'HGLG11', sector: 'Logística', target: 20 },
      { code: 'KNRI11', sector: 'Híbrido', target: 20 },
      { code: 'KNIP11', sector: 'Papel', target: 20 }
    ],
    stocks: [
      { code: 'AAPL', sector: 'Tecnologia', target: 20 },
      { code: 'MSFT', sector: 'Tecnologia', target: 20 },
      { code: 'GOOGL', sector: 'Comunicação', target: 15 },
      { code: 'JNJ', sector: 'Saúde', target: 15 },
      { code: 'PG', sector: 'Consumo Não Cíclico', target: 15 },
      { code: 'KO', sector: 'Consumo Não Cíclico', target: 15 }
    ],
    reits: [
      { code: 'O', sector: 'Varejo', target: 30 },
      { code: 'AMT', sector: 'Infraestrutura', target: 25 },
      { code: 'PLD', sector: 'Logística', target: 25 },
      { code: 'DLR', sector: 'Data Centers', target: 20 }
    ],
    fixed: [
      { code: 'Tesouro IPCA+ 2035', sector: 'Títulos Públicos', target: 50 },
      { code: 'Tesouro Selic 2029', sector: 'Títulos Públicos', target: 50 }
    ],
    reserva: [{ code: 'TESOURO_SELIC_2029', sector: 'Título Público Federal', target: 100 }]
  }
};

export function calculateCategoryDistances(
  holdings: CategorizedHoldings,
  macro: MacroAllocationConfig,
  totalPortfolioBrl: number
): CategoryDistanceDTO[] {
  const categories: Array<{ key: PortfolioCategoryKey; name: string }> = [
    { key: 'acoes', name: 'Ações Brasil' },
    { key: 'fiis', name: 'Fundos Imobiliários (FIIs)' },
    { key: 'stocks', name: 'Stocks (EUA)' },
    { key: 'reits', name: 'REITs (EUA)' },
    { key: 'fixed', name: 'Renda Fixa & Liquidez' }
  ];

  const totalDec = d(totalPortfolioBrl);
  const variableFrac = d(macro.variable).div(100);
  const brasilFrac = d(macro.brasil).div(100);
  const usaFrac = d(macro.usa).div(100);

  return categories.map((cat) => {
    const list = holdings[cat.key] || [];
    const catValDec = list.reduce((acc, item) => acc.plus(d(item.currentValueBrl)), d(0));
    const currentPctDec = totalDec.greaterThan(0) ? catValDec.div(totalDec).mul(100) : d(0);

    let targetPctDec = d(0);
    if (cat.key === 'acoes') {
      targetPctDec = variableFrac.mul(brasilFrac).mul(d(macro.acoes));
    } else if (cat.key === 'fiis') {
      targetPctDec = variableFrac.mul(brasilFrac).mul(d(macro.fiis));
    } else if (cat.key === 'stocks') {
      targetPctDec = variableFrac.mul(usaFrac).mul(d(macro.stocks));
    } else if (cat.key === 'reits') {
      targetPctDec = variableFrac.mul(usaFrac).mul(d(macro.reits));
    } else if (cat.key === 'fixed') {
      targetPctDec = d(macro.fixed);
    }

    const distDec = targetPctDec.minus(currentPctDec);

    return {
      category: cat.key,
      name: cat.name,
      currentValueBrl: roundCurrency(catValDec),
      currentPercent: roundPercent(currentPctDec, 2),
      targetPercent: roundPercent(targetPctDec, 2),
      distance: roundPercent(distDec, 4)
    };
  });
}

export function calculateAssetDistancesByCategory(
  holdings: CategorizedHoldings,
  assetTargets: AssetTargetsConfig,
  categoryDistances: CategoryDistanceDTO[],
  totalPortfolioBrl: number,
  nameResolver?: (code: string, fallback?: string | null) => string
): Record<PortfolioCategoryKey, AssetDistanceBreakdownDTO[]> {
  const totalDec = d(totalPortfolioBrl);
  const result: Record<PortfolioCategoryKey, AssetDistanceBreakdownDTO[]> = {
    acoes: [],
    fiis: [],
    stocks: [],
    reits: [],
    fixed: []
  };

  for (const catDist of categoryDistances) {
    const cat = catDist.category;
    const catHoldings = holdings[cat] || [];
    const targets = assetTargets[cat] || [];
    const seen = new Set<string>();
    const rows: AssetDistanceBreakdownDTO[] = [];

    for (const t of targets) {
      const code = String(t.code || t.ticker || '').trim();
      if (!code) continue;
      const upper = code.toUpperCase();
      seen.add(upper);

      const holding = catHoldings.find((h) => h.code.toUpperCase() === upper);
      const currentValDec = holding ? d(holding.currentValueBrl) : d(0);
      const currentPctDec = totalDec.greaterThan(0)
        ? currentValDec.div(totalDec).mul(100)
        : d(0);
      const classTargetDec = d(t.target || 0);
      const globalTargetDec = d(catDist.targetPercent).mul(classTargetDec).div(100);
      const distDec = globalTargetDec.minus(currentPctDec);

      rows.push({
        ticker: holding?.code || code,
        name: nameResolver ? nameResolver(code, holding?.name) : holding?.name || code,
        category: cat,
        currentPercent: roundPercent(currentPctDec, 2),
        targetPercent: roundPercent(globalTargetDec, 2),
        classTargetPercent: roundPercent(classTargetDec, 2),
        distance: roundPercent(distDec, 2),
        inObjective: true
      });
    }

    // Inclui também ativos em custódia que não estão na meta (meta 0% -> acima da meta)
    for (const h of catHoldings) {
      const upper = h.code.toUpperCase();
      if (seen.has(upper)) continue;
      const currentPctDec = totalDec.greaterThan(0)
        ? d(h.currentValueBrl).div(totalDec).mul(100)
        : d(0);
      rows.push({
        ticker: h.code,
        name: nameResolver ? nameResolver(h.code, h.name) : h.name,
        category: cat,
        currentPercent: roundPercent(currentPctDec, 2),
        targetPercent: 0,
        classTargetPercent: 0,
        distance: roundPercent(d(0).minus(currentPctDec), 2),
        inObjective: false
      });
    }

    if (cat === 'fixed' && rows.length === 0) {
      rows.push({
        ticker: 'Reserva / Renda Fixa Geral',
        name: 'Tesouro Selic & Liquidez',
        category: 'fixed',
        currentPercent: catDist.currentPercent,
        targetPercent: catDist.targetPercent,
        classTargetPercent: 100,
        distance: roundPercent(catDist.distance, 2),
        inObjective: true
      });
    }

    rows.sort((a, b) => b.distance - a.distance);
    result[cat] = rows;
  }

  return result;
}

export function calculateEmergencyReserveStatus(
  holdings: CategorizedHoldings,
  config: EmergencyReserveConfig
): EmergencyReserveSummaryDTO {
  const monthlyExpense = d(config.monthlyExpense > 0 ? config.monthlyExpense : 3000);
  const monthsTarget = d(config.monthsTarget > 0 ? config.monthsTarget : 6);
  const manualBalance = d(config.manualReserveBalance >= 0 ? config.manualReserveBalance : 0);

  const isReserveAsset = (code: string) => {
    const c = code.toUpperCase();
    return (
      c.includes('SELIC') ||
      c.includes('LIQ_DIARIA') ||
      c.includes('DIARIA') ||
      c.includes('RESERVA') ||
      c.includes('CDI') ||
      c.includes('REMUNERADA') ||
      c.includes('SOBERANO')
    );
  };

  const reserveAssets = (holdings.fixed || []).filter((h) => isReserveAsset(h.code));
  const reserveInvested = reserveAssets.reduce((acc, h) => acc.plus(d(h.currentValueBrl)), d(0));

  const totalCurrent = reserveInvested.plus(manualBalance);
  const targetAmount = monthlyExpense.mul(monthsTarget);
  const missing = DecimalMaxZero(targetAmount.minus(totalCurrent));
  const completionPct = targetAmount.greaterThan(0)
    ? DecimalMin100(totalCurrent.div(targetAmount).mul(100))
    : d(100);
  const monthsCovered = monthlyExpense.greaterThan(0) ? totalCurrent.div(monthlyExpense) : d(0);

  let reserveStatus: EmergencyReserveSummaryDTO['reserveStatus'] = 'critico';
  if (completionPct.greaterThanOrEqualTo(100)) reserveStatus = 'blindada';
  else if (completionPct.greaterThanOrEqualTo(70)) reserveStatus = 'quase_blindada';
  else if (completionPct.greaterThanOrEqualTo(30)) reserveStatus = 'em_construcao';

  return {
    monthlyExpense: roundCurrency(monthlyExpense),
    monthsTarget: monthsTarget.toNumber(),
    manualReserveBalance: roundCurrency(manualBalance),
    strategyMode: config.strategyMode || 'hybrid_70_30',
    totalCurrentReserve: roundCurrency(totalCurrent),
    targetReserveAmount: roundCurrency(targetAmount),
    missingReserveAmount: roundCurrency(missing),
    reserveCompletionPercent: roundPercent(completionPct, 2),
    reserveMonthsCovered: roundPercent(monthsCovered, 1),
    reserveStatus,
    reserveAssets
  };
}

function DecimalMaxZero(val: ReturnType<typeof d>) {
  return val.lessThan(0) ? d(0) : val;
}

function DecimalMin100(val: ReturnType<typeof d>) {
  return val.greaterThan(100) ? d(100) : val;
}

export function suggestInvestments(params: {
  availableAmountBrl: number;
  numAssets: number;
  holdings: CategorizedHoldings;
  macroAllocation: MacroAllocationConfig;
  assetTargets: AssetTargetsConfig;
  priceMapBrl: Record<string, number>;
  emergencyReserveSummary?: EmergencyReserveSummaryDTO | null;
  usdRate?: number;
}): InvestmentSuggestionDTO[] {
  const availableDec = d(params.availableAmountBrl);
  const numAssets = Math.max(1, Math.min(10, Math.floor(params.numAssets || 3)));
  const usdRateDec = d(params.usdRate && params.usdRate > 0 ? params.usdRate : 5.65);

  if (availableDec.lessThanOrEqualTo(0)) return [];

  // 1. Regra de Prioridade da Reserva de Emergência
  const reserve = params.emergencyReserveSummary;
  if (reserve && reserve.reserveCompletionPercent < 100 && reserve.missingReserveAmount > 0) {
    const mode = reserve.strategyMode || 'hybrid_70_30';
    const reserveCode =
      params.assetTargets.reserva?.[0]?.code ||
      params.assetTargets.reserva?.[0]?.ticker ||
      reserve.reserveAssets?.[0]?.code ||
      'Tesouro Selic 2029';
    const missingDec = d(reserve.missingReserveAmount);
    const pctLabel = reserve.reserveCompletionPercent.toFixed(1);

    if (mode === 'focus_100') {
      const alloc = availableDec.lessThan(missingDec) ? availableDec : missingDec;
      return [
        {
          ticker: reserveCode,
          categoria: 'fixed',
          cotas: roundCurrency(alloc),
          currentPrice: 1,
          valorTotal: roundCurrency(alloc),
          distance: roundPercent(100 - reserve.reserveCompletionPercent, 2),
          isEmergencyReserve: true,
          reason: `Blindagem Prioritária (100%): Reserva em ${pctLabel}% (faltam R$ ${missingDec.toFixed(2)}).`
        }
      ];
    }

    const ratio = mode === 'hybrid_70_30' ? d('0.70') : d('0.50');
    const desiredReserve = availableDec.mul(ratio);
    const allocReserve = roundCurrency(
      desiredReserve.lessThan(missingDec) ? desiredReserve : missingDec
    );
    const remaining = roundCurrency(availableDec.minus(allocReserve));

    const reserveSuggestion: InvestmentSuggestionDTO = {
      ticker: reserveCode,
      categoria: 'fixed',
      cotas: allocReserve,
      currentPrice: 1,
      valorTotal: allocReserve,
      distance: roundPercent(100 - reserve.reserveCompletionPercent, 2),
      isEmergencyReserve: true,
      reason: `Aporte Híbrido (${ratio.mul(100).toFixed(0)}%): fortalecimento da Reserva (${pctLabel}% concluída).`
    };

    if (remaining <= 0) return [reserveSuggestion];

    const restSuggestions = suggestInvestments({
      ...params,
      availableAmountBrl: remaining,
      numAssets: Math.max(1, numAssets - 1),
      emergencyReserveSummary: null
    });

    return [reserveSuggestion, ...restSuggestions];
  }

  // 2. Distância RDM (Rebalanceamento por Distância da Meta — MANTFRAI)
  const totalPortfolioDec = (Object.keys(params.holdings) as PortfolioCategoryKey[]).reduce(
    (sum, cat) =>
      sum.plus(
        (params.holdings[cat] || []).reduce((acc, h) => acc.plus(d(h.currentValueBrl)), d(0))
      ),
    d(0)
  );

  const catDistances = calculateCategoryDistances(
    params.holdings,
    params.macroAllocation,
    totalPortfolioDec.toNumber()
  );

  const candidates: AssetDistanceDTO[] = [];

  for (const catDist of catDistances) {
    const cat = catDist.category;
    const isUs = cat === 'stocks' || cat === 'reits';
    const catHoldings = params.holdings[cat] || [];
    const targets = params.assetTargets[cat] || [];

    if (cat === 'fixed' && targets.length === 0 && catDist.distance > 0) {
      candidates.push({
        ticker: 'Tesouro Selic 2029',
        category: 'fixed',
        currentPercent: catDist.currentPercent,
        targetPercent: catDist.targetPercent,
        distance: catDist.distance,
        financialDistanceBrl: roundCurrency(
          totalPortfolioDec.mul(d(catDist.distance).div(100))
        ),
        currentPriceBrl: 1,
        nativePrice: 1,
        market: 'BR'
      });
      continue;
    }

    for (const target of targets) {
      const code = String(target.code || target.ticker || '').trim();
      if (!code) continue;
      const holding = catHoldings.find((h) => h.code.toUpperCase() === code.toUpperCase());

      let priceBrl = d(0);
      let nativePrice = d(0);

      const upperCode = code.toUpperCase();
      const mappedPriceBrl =
        params.priceMapBrl[code] ?? params.priceMapBrl[upperCode] ?? 0;

      if (holding && holding.currentPrice > 0) {
        nativePrice = d(holding.currentPrice);
        priceBrl = isUs ? nativePrice.mul(usdRateDec) : nativePrice;
      } else if (mappedPriceBrl > 0) {
        priceBrl = d(mappedPriceBrl);
        nativePrice = isUs ? priceBrl.div(usdRateDec) : priceBrl;
      } else if (cat === 'fixed') {
        priceBrl = d(1);
        nativePrice = d(1);
      }

      if (priceBrl.lessThanOrEqualTo(0)) continue;

      const currentValBrl = holding ? d(holding.currentValueBrl) : d(0);
      const currentPct = totalPortfolioDec.greaterThan(0)
        ? currentValBrl.div(totalPortfolioDec).mul(100)
        : d(0);
      const globalTargetPct = d(catDist.targetPercent).mul(d(target.target || 0)).div(100);
      const dist = globalTargetPct.minus(currentPct);
      const finDist = totalPortfolioDec.greaterThan(0)
        ? totalPortfolioDec.mul(globalTargetPct.div(100)).minus(currentValBrl)
        : availableDec.mul(globalTargetPct.div(100));

      if (dist.greaterThan(0)) {
        candidates.push({
          ticker: code,
          category: cat,
          currentPercent: roundPercent(currentPct, 2),
          targetPercent: roundPercent(globalTargetPct, 2),
          distance: dist.toNumber(),
          financialDistanceBrl: roundCurrency(finDist),
          currentPriceBrl: roundCurrency(priceBrl),
          nativePrice: roundCurrency(nativePrice),
          market: isUs ? 'US' : 'BR'
        });
      }
    }
  }

  candidates.sort((a, b) => b.distance - a.distance);
  if (candidates.length === 0) return [];

  const output: InvestmentSuggestionDTO[] = [];
  let remainingBudgetDec = availableDec;

  for (let i = 0; i < candidates.length && output.length < numAssets; i++) {
    const item = candidates[i]!;
    if (remainingBudgetDec.lessThan(1)) break;

    const slotsLeft = numAssets - output.length;
    // Soma as distâncias deste item e dos próximos candidatos necessários para preencher os slots restantes
    const windowSlice = candidates.slice(i, i + slotsLeft);
    const windowDistDec = windowSlice.reduce((acc, c) => acc.plus(d(c.distance)), d(0));
    const weight = windowDistDec.greaterThan(0)
      ? d(item.distance).div(windowDistDec)
      : d(1).div(slotsLeft);

    let allocatedBrl = remainingBudgetDec.mul(weight);
    if (allocatedBrl.greaterThan(remainingBudgetDec)) {
      allocatedBrl = remainingBudgetDec;
    }

    const unitBrl = d(item.currentPriceBrl > 0 ? item.currentPriceBrl : 1);

    // 1. Renda Fixa: aplicação monetária direta em R$
    if (item.category === 'fixed') {
      const valFixed = roundCurrency(allocatedBrl);
      if (valFixed >= 1) {
        output.push({
          ticker: item.ticker,
          categoria: 'fixed',
          cotas: Math.max(1, Math.floor(valFixed)),
          currentPrice: 1,
          valorTotal: valFixed,
          distance: roundPercent(item.distance, 2),
          reason: `Rebalanceamento MANTFRAI: Renda Fixa ${roundPercent(item.distance, 2)}% abaixo da meta.`
        });
        remainingBudgetDec = DecimalMaxZero(remainingBudgetDec.minus(valFixed));
      }
      continue;
    }

    // 2. Stocks e REITs (EUA): corretoras internacionais operam frações de ações (até 4 casas decimais)
    if (item.category === 'stocks' || item.category === 'reits') {
      const valUsBrl = roundCurrency(allocatedBrl);
      if (valUsBrl >= 5) {
        const fractionalShares = Number(d(valUsBrl).div(unitBrl).toFixed(4));
        if (fractionalShares > 0) {
          output.push({
            ticker: item.ticker,
            categoria: item.category,
            cotas: fractionalShares,
            currentPrice: roundCurrency(unitBrl),
            valorTotal: valUsBrl,
            distance: roundPercent(item.distance, 2),
            reason: `Equilíbrio Global MANTFRAI: ${item.currentPercent.toFixed(1)}% atual vs ${item.targetPercent.toFixed(1)}% meta.`
          });
          remainingBudgetDec = DecimalMaxZero(remainingBudgetDec.minus(valUsBrl));
        }
      }
      continue;
    }

    // 3. Ações BR e FIIs BR (B3): cotas inteiras com realocação inteligente de orçamento
    let shares = allocatedBrl.div(unitBrl).floor().toNumber();
    if (shares === 0 && remainingBudgetDec.greaterThanOrEqualTo(unitBrl)) {
      shares = 1;
    }

    if (shares > 0) {
      const totalOrderBrl = roundCurrency(d(shares).mul(unitBrl));
      if (d(totalOrderBrl).lessThanOrEqualTo(remainingBudgetDec)) {
        output.push({
          ticker: item.ticker,
          categoria: item.category,
          cotas: shares,
          currentPrice: roundCurrency(unitBrl),
          valorTotal: totalOrderBrl,
          distance: roundPercent(item.distance, 2),
          reason: `Desconto de Alocação MANTFRAI: ${item.currentPercent.toFixed(1)}% atual vs ${item.targetPercent.toFixed(1)}% meta.`
        });
        remainingBudgetDec = DecimalMaxZero(remainingBudgetDec.minus(totalOrderBrl));
      }
    }
  }

  return output;
}

/**
 * Calcula a tabela de Magic Number (Efeito Bola de Neve) para FIIs, Ações, Stocks e REITs.
 */
export function calculateMagicNumbers(holdings: CategorizedHoldings): MagicNumberRowDTO[] {
  const eligible: HoldingPosition[] = [
    ...(holdings.fiis || []),
    ...(holdings.acoes || []),
    ...(holdings.reits || []),
    ...(holdings.stocks || [])
  ];

  const rows: MagicNumberRowDTO[] = [];

  for (const h of eligible) {
    if (h.currentValueBrl <= 0 || h.quantity <= 0) continue;
    const unitPriceBrl = d(h.currentValueBrl).div(d(h.quantity));

    // Usa dividendos reais 12m por cota ou DY anual fundamentalista como estimativa
    let monthlyDivPerShare = d(0);
    let dataSource: MagicNumberRowDTO['dataSource'] = 'real_12m';
    if (h.dividends12mBrl > 0) {
      monthlyDivPerShare = d(h.dividends12mBrl).div(12).div(d(h.quantity));
    } else if (h.dividendYieldAnnual > 0) {
      monthlyDivPerShare = unitPriceBrl.mul(d(h.dividendYieldAnnual).div(100)).div(12);
      dataSource = 'dy_fundamentalista';
    }

    if (monthlyDivPerShare.lessThanOrEqualTo(0)) continue;

    const magicShares = unitPriceBrl.div(monthlyDivPerShare).ceil().toNumber();
    if (!Number.isFinite(magicShares) || magicShares <= 0) continue;

    const missingShares = Math.max(0, magicShares - h.quantity);
    const investmentNeeded = roundCurrency(d(missingShares).mul(unitPriceBrl));
    const progress = Math.min(100, roundPercent(d(h.quantity).div(magicShares).mul(100), 1));
    const monthlyIncome = monthlyDivPerShare.mul(d(h.quantity));

    rows.push({
      code: h.code,
      name: h.name,
      category: h.category,
      currentShares: h.quantity,
      currentPriceBrl: roundCurrency(unitPriceBrl),
      estimatedMonthlyDividendPerShareBrl: roundCurrency(monthlyDivPerShare),
      magicNumberShares: magicShares,
      missingShares,
      investmentNeededBrl: investmentNeeded,
      progressPercent: progress,
      monthlyIncomeBrl: roundCurrency(monthlyIncome),
      sharesGeneratedPerMonth: roundPercent(monthlyIncome.div(unitPriceBrl), 2),
      isMagicReached: h.quantity >= magicShares,
      dataSource
    });
  }

  return rows.sort((a, b) => b.progressPercent - a.progressPercent);
}
