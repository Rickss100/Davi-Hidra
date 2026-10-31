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

export interface InvestmentSuggestionDTO {
  ticker: string;
  categoria: PortfolioCategoryKey;
  cotas: number;
  currentPrice: number;
  valorTotal: number;
  distance: number;
  isEmergencyReserve?: boolean;
  reason: string;
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
}

// ============================================================================
// PRESETS PADRÃO OURO OFICIAIS (100% SERVER-SIDE)
// ============================================================================
export const GOLD_PRESET_BRASIL: {
  macroAllocation: MacroAllocationConfig;
  assetTargets: AssetTargetsConfig;
} = {
  macroAllocation: {
    fixed: 15,
    variable: 85,
    brasil: 100,
    usa: 0,
    acoes: 60,
    fiis: 40,
    stocks: 0,
    reits: 0
  },
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

  // 2. Distância AM2O (Always Move To Objective — Método DAVI & Hydra)
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

      if (holding && holding.currentPrice > 0) {
        nativePrice = d(holding.currentPrice);
        priceBrl = isUs ? nativePrice.mul(usdRateDec) : nativePrice;
      } else if (params.priceMapBrl[code] && params.priceMapBrl[code]! > 0) {
        priceBrl = d(params.priceMapBrl[code]);
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
  const selected = candidates.slice(0, numAssets);
  if (selected.length === 0) return [];

  const totalDistDec = selected.reduce((acc, item) => acc.plus(d(item.distance)), d(0));
  if (totalDistDec.lessThanOrEqualTo(0)) return [];

  const output: InvestmentSuggestionDTO[] = [];

  for (const item of selected) {
    const weight = d(item.distance).div(totalDistDec);
    const allocatedBrl = availableDec.mul(weight);
    const unitBrl = d(item.currentPriceBrl > 0 ? item.currentPriceBrl : 1);

    if (item.category === 'fixed') {
      const valFixed = roundCurrency(allocatedBrl);
      if (valFixed > 0) {
        output.push({
          ticker: item.ticker,
          categoria: 'fixed',
          cotas: Math.max(1, Math.floor(valFixed)),
          currentPrice: 1,
          valorTotal: valFixed,
          distance: roundPercent(item.distance, 2),
          reason: `Rebalanceamento DAVI: classe Renda Fixa ${roundPercent(item.distance, 2)}% abaixo da meta.`
        });
      }
      continue;
    }

    let shares = allocatedBrl.div(unitBrl).floor().toNumber();
    if (shares === 0 && availableDec.greaterThanOrEqualTo(unitBrl) && output.length === 0) {
      shares = 1;
    }

    if (shares > 0) {
      const totalOrderBrl = roundCurrency(d(shares).mul(unitBrl));
      output.push({
        ticker: item.ticker,
        categoria: item.category,
        cotas: shares,
        currentPrice: roundCurrency(unitBrl),
        valorTotal: totalOrderBrl,
        distance: roundPercent(item.distance, 2),
        reason: `Desconto de Alocação Hydra: ${item.currentPercent.toFixed(1)}% atual vs ${item.targetPercent.toFixed(1)}% alvo.`
      });
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
    if (h.dividends12mBrl > 0) {
      monthlyDivPerShare = d(h.dividends12mBrl).div(12).div(d(h.quantity));
    } else if (h.dividendYieldAnnual > 0) {
      monthlyDivPerShare = unitPriceBrl.mul(d(h.dividendYieldAnnual).div(100)).div(12);
    }

    if (monthlyDivPerShare.lessThanOrEqualTo(0)) continue;

    const magicShares = unitPriceBrl.div(monthlyDivPerShare).ceil().toNumber();
    if (!Number.isFinite(magicShares) || magicShares <= 0) continue;

    const missingShares = Math.max(0, magicShares - h.quantity);
    const investmentNeeded = roundCurrency(d(missingShares).mul(unitPriceBrl));
    const progress = Math.min(100, roundPercent(d(h.quantity).div(magicShares).mul(100), 1));

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
      progressPercent: progress
    });
  }

  return rows.sort((a, b) => b.progressPercent - a.progressPercent);
}
