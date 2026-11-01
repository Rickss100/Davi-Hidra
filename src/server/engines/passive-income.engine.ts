import { d, roundCurrency, roundPercent } from '@/lib/money';
import type { HoldingPosition, PortfolioCategoryKey } from '@/server/engines/davi-hydra.engine';

// ============================================================================
// TIPOS
// ============================================================================

/** Provento real registrado (importação B3 ou lançamento manual), já convertido para BRL. */
export interface DividendEventInput {
  id: number;
  assetCode: string;
  assetName: string;
  category: PortfolioCategoryKey;
  date: string; // YYYY-MM-DD
  quantity: number;
  totalBrl: number;
  notes: string | null;
}

export type DividendPaymentStatus = 'pago' | 'agendado' | 'estimado';
export type DividendKind = 'dividendo' | 'jcp' | 'rendimento' | 'outro';

export interface CalendarPaymentDTO {
  id: string;
  assetCode: string;
  assetName: string;
  category: PortfolioCategoryKey;
  date: string;
  day: number;
  kind: DividendKind;
  quantity: number;
  unitAmountBrl: number;
  totalBrl: number;
  status: DividendPaymentStatus;
  basis: string | null;
}

export interface CalendarDayDTO {
  day: number;
  date: string;
  totalBrl: number;
  payments: CalendarPaymentDTO[];
}

export interface DividendCalendarDTO {
  year: number;
  month: number;
  totalBrl: number;
  receivedBrl: number;
  scheduledBrl: number;
  estimatedBrl: number;
  paymentCount: number;
  days: Record<number, CalendarDayDTO>;
}

export interface PassiveIncomeMetricsDTO {
  source: 'real' | 'estimated' | 'none';
  estimatedMonthlyIncomeBrl: number;
  estimatedAnnualIncomeBrl: number;
  dividendYieldPercent: number;
  yieldOnCostPercent: number;
  costCoveragePercent: number;
  monthlyExpenseBrl: number;
  incomeEquityBrl: number;
}

export interface ForecastPointDTO {
  month: number;
  years: number;
  equityBrl: number;
  monthlyIncomeBrl: number;
  annualIncomeBrl: number;
  coveragePercent: number;
}

export interface IncomeForecastDTO {
  months: number;
  startEquityBrl: number;
  finalEquityBrl: number;
  finalMonthlyIncomeBrl: number;
  finalAnnualIncomeBrl: number;
  totalDividendsBrl: number;
  totalContributedBrl: number;
  coveragePercent: number;
  monthlyExpenseBrl: number;
  reinvest: boolean;
  timeline: ForecastPointDTO[];
}

// ============================================================================
// HELPERS DE DATA (strings YYYY-MM-DD, sem fuso horário)
// ============================================================================

const pad2 = (n: number) => String(n).padStart(2, '0');
const monthIndex = (year: number, month: number) => year * 12 + (month - 1);
const daysInMonth = (year: number, month: number) => new Date(Date.UTC(year, month, 0)).getUTCDate();

function parseYmd(date: string): { y: number; m: number; day: number } {
  const [y, m, day] = date.split('-').map((p) => Number(p));
  return { y: y || 0, m: m || 1, day: day || 1 };
}

export function detectDividendKind(notes: string | null, category: PortfolioCategoryKey): DividendKind {
  const n = String(notes || '').toUpperCase();
  if (n.includes('JUROS') || n.includes('JCP')) return 'jcp';
  if (n.includes('RENDIMENTO')) return 'rendimento';
  if (n.includes('DIVIDENDO')) return 'dividendo';
  if (category === 'fiis') return 'rendimento';
  if (category === 'acoes' || category === 'stocks' || category === 'reits') return 'dividendo';
  return 'outro';
}

const unitOf = (e: DividendEventInput) =>
  e.quantity > 0 ? d(e.totalBrl).div(e.quantity) : d(e.totalBrl);

// ============================================================================
// 1. MÉTRICAS DE RENDA PASSIVA
// ============================================================================

/**
 * Calcula renda mensal, DY médio, YoC e cobertura do custo de vida.
 * Prioriza proventos REAIS dos últimos 12 meses; sem histórico, usa o DY fundamentalista
 * de cada ativo (rotulado como estimativa). Nunca inventa um DY padrão.
 */
export function calculatePassiveIncomeMetrics(params: {
  holdings: HoldingPosition[];
  dividends12mBrl: number;
  monthlyExpenseBrl: number;
}): PassiveIncomeMetricsDTO {
  const incomeHoldings = params.holdings.filter((h) => h.category !== 'fixed' && h.currentValueBrl > 0);
  const equity = incomeHoldings.reduce((acc, h) => acc.plus(d(h.currentValueBrl)), d(0));
  const invested = incomeHoldings.reduce((acc, h) => acc.plus(d(h.investedBrl)), d(0));
  const expense = d(Math.max(0, params.monthlyExpenseBrl || 0));

  let annualIncome = d(0);
  let source: PassiveIncomeMetricsDTO['source'] = 'none';

  if (params.dividends12mBrl > 0) {
    annualIncome = d(params.dividends12mBrl);
    source = 'real';
  } else {
    annualIncome = incomeHoldings.reduce(
      (acc, h) => acc.plus(d(h.currentValueBrl).mul(d(h.dividendYieldAnnual || 0)).div(100)),
      d(0)
    );
    if (annualIncome.greaterThan(0)) source = 'estimated';
  }

  const monthly = annualIncome.div(12);

  return {
    source,
    estimatedMonthlyIncomeBrl: roundCurrency(monthly),
    estimatedAnnualIncomeBrl: roundCurrency(annualIncome),
    dividendYieldPercent: equity.greaterThan(0) ? roundPercent(annualIncome.div(equity).mul(100), 2) : 0,
    yieldOnCostPercent: invested.greaterThan(0) ? roundPercent(annualIncome.div(invested).mul(100), 2) : 0,
    costCoveragePercent: expense.greaterThan(0) ? roundPercent(monthly.div(expense).mul(100), 1) : 0,
    monthlyExpenseBrl: roundCurrency(expense),
    incomeEquityBrl: roundCurrency(equity)
  };
}

// ============================================================================
// 2. CALENDÁRIO DE PROVENTOS (REAL + ESTIMATIVA PELO HISTÓRICO)
// ============================================================================

/**
 * Monta o calendário de um mês com:
 *  - Proventos reais registrados (pago = data já passou, agendado = data futura lançada).
 *  - Estimativa pelo histórico para datas futuras (até 12 meses à frente), somente para ativos
 *    ainda em custódia: pagadores mensais (≥3 pagamentos nos últimos 4 meses) usam a média por cota
 *    dos 3 últimos; pagadores sazonais repetem o pagamento do mesmo mês do ano anterior.
 */
export function buildDividendCalendar(params: {
  events: DividendEventInput[];
  holdings: HoldingPosition[];
  year: number;
  month: number;
  today: string; // YYYY-MM-DD
}): DividendCalendarDTO {
  const { year, month, today } = params;
  const prefix = `${year}-${pad2(month)}`;
  const t = parseYmd(today);
  const todayIdx = monthIndex(t.y, t.m);
  const targetIdx = monthIndex(year, month);
  const maxDay = daysInMonth(year, month);

  const payments: CalendarPaymentDTO[] = [];
  const assetsWithRealPayment = new Set<string>();

  // 2.1 Proventos reais do mês
  for (const e of params.events) {
    if (!e.date.startsWith(prefix)) continue;
    const code = e.assetCode.toUpperCase();
    assetsWithRealPayment.add(code);
    payments.push({
      id: `real-${e.id}`,
      assetCode: e.assetCode,
      assetName: e.assetName,
      category: e.category,
      date: e.date,
      day: parseYmd(e.date).day,
      kind: detectDividendKind(e.notes, e.category),
      quantity: e.quantity,
      unitAmountBrl: roundCurrency(unitOf(e)),
      totalBrl: roundCurrency(e.totalBrl),
      status: e.date <= today ? 'pago' : 'agendado',
      basis: null
    });
  }

  // 2.2 Estimativa pelo histórico (apenas mês atual e próximos 12 meses)
  const monthsAhead = targetIdx - todayIdx;
  if (monthsAhead >= 0 && monthsAhead <= 12) {
    const heldQty = new Map(
      params.holdings
        .filter((h) => h.category !== 'fixed' && h.quantity > 0)
        .map((h) => [h.code.toUpperCase(), h] as const)
    );

    const historyByAsset = new Map<string, DividendEventInput[]>();
    for (const e of params.events) {
      if (e.date > today) continue;
      const code = e.assetCode.toUpperCase();
      if (!heldQty.has(code)) continue;
      const list = historyByAsset.get(code) ?? [];
      list.push(e);
      historyByAsset.set(code, list);
    }

    for (const [code, history] of historyByAsset.entries()) {
      if (assetsWithRealPayment.has(code)) continue;
      const holding = heldQty.get(code)!;
      history.sort((a, b) => b.date.localeCompare(a.date));

      const recentMonths = new Set(
        history
          .map((e) => parseYmd(e.date))
          .filter((p) => todayIdx - monthIndex(p.y, p.m) >= 0 && todayIdx - monthIndex(p.y, p.m) <= 3)
          .map((p) => monthIndex(p.y, p.m))
      );

      const candidates: Array<{ day: number; unit: ReturnType<typeof d>; basis: string; ref: DividendEventInput }> = [];

      if (recentMonths.size >= 3) {
        const last3 = history.slice(0, 3);
        const avgUnit = last3.reduce((acc, e) => acc.plus(unitOf(e)), d(0)).div(last3.length);
        const ref = history[0]!;
        candidates.push({
          day: parseYmd(ref.date).day,
          unit: avgUnit,
          basis: 'Média por cota dos 3 últimos pagamentos (pagador mensal)',
          ref
        });
      } else {
        const lastYearIdx = targetIdx - 12;
        for (const e of history) {
          const p = parseYmd(e.date);
          if (monthIndex(p.y, p.m) !== lastYearIdx) continue;
          candidates.push({
            day: p.day,
            unit: unitOf(e),
            basis: `Repete o pagamento de ${pad2(p.m)}/${p.y} (padrão sazonal)`,
            ref: e
          });
        }
      }

      candidates.forEach((c, idx) => {
        const day = Math.min(c.day, maxDay);
        const date = `${prefix}-${pad2(day)}`;
        if (date <= today) return;
        const total = c.unit.mul(holding.quantity);
        if (total.lessThanOrEqualTo(0)) return;
        payments.push({
          id: `est-${code}-${idx}`,
          assetCode: holding.code,
          assetName: holding.name,
          category: holding.category,
          date,
          day,
          kind: detectDividendKind(c.ref.notes, holding.category),
          quantity: holding.quantity,
          unitAmountBrl: roundCurrency(c.unit),
          totalBrl: roundCurrency(total),
          status: 'estimado',
          basis: c.basis
        });
      });
    }
  }

  // 2.3 Agrupamento por dia com Decimal.js
  const days: Record<number, CalendarDayDTO> = {};
  let received = d(0);
  let scheduled = d(0);
  let estimated = d(0);

  payments
    .sort((a, b) => a.date.localeCompare(b.date) || b.totalBrl - a.totalBrl)
    .forEach((p) => {
      const bucket = days[p.day] ?? { day: p.day, date: p.date, totalBrl: 0, payments: [] };
      bucket.totalBrl = roundCurrency(d(bucket.totalBrl).plus(p.totalBrl));
      bucket.payments.push(p);
      days[p.day] = bucket;
      if (p.status === 'pago') received = received.plus(p.totalBrl);
      else if (p.status === 'agendado') scheduled = scheduled.plus(p.totalBrl);
      else estimated = estimated.plus(p.totalBrl);
    });

  return {
    year,
    month,
    totalBrl: roundCurrency(received.plus(scheduled).plus(estimated)),
    receivedBrl: roundCurrency(received),
    scheduledBrl: roundCurrency(scheduled),
    estimatedBrl: roundCurrency(estimated),
    paymentCount: payments.length,
    days
  };
}

// ============================================================================
// 3. PREVISÃO DE RENDA PASSIVA FUTURA (JUROS COMPOSTOS + BOLA DE NEVE)
// ============================================================================

export function projectFutureIncome(params: {
  currentEquityBrl: number;
  monthlyContributionBrl: number;
  months: number;
  dividendYieldAnnualPercent: number;
  appreciationAnnualPercent?: number;
  reinvest: boolean;
  monthlyExpenseBrl: number;
}): IncomeForecastDTO {
  const months = Math.max(1, Math.floor(params.months));
  const monthlyDy = d(params.dividendYieldAnnualPercent).div(100).div(12);
  const monthlyAppreciation = d(params.appreciationAnnualPercent ?? 4).div(100).div(12);
  const contribution = d(Math.max(0, params.monthlyContributionBrl));
  const expense = d(Math.max(0, params.monthlyExpenseBrl));
  const step = months > 60 ? 12 : 6;

  const coverageOf = (monthlyIncome: ReturnType<typeof d>) =>
    expense.greaterThan(0) ? roundPercent(monthlyIncome.div(expense).mul(100), 1) : 0;

  let equity = d(Math.max(0, params.currentEquityBrl));
  let totalDividends = d(0);
  const timeline: ForecastPointDTO[] = [];

  for (let m = 1; m <= months; m++) {
    const income = equity.mul(monthlyDy);
    totalDividends = totalDividends.plus(income);
    equity = equity.mul(d(1).plus(monthlyAppreciation)).plus(contribution);
    if (params.reinvest) equity = equity.plus(income);

    if (m === 1 || m % step === 0 || m === months) {
      const nextIncome = equity.mul(monthlyDy);
      timeline.push({
        month: m,
        years: roundPercent(d(m).div(12), 1),
        equityBrl: roundCurrency(equity),
        monthlyIncomeBrl: roundCurrency(nextIncome),
        annualIncomeBrl: roundCurrency(nextIncome.mul(12)),
        coveragePercent: coverageOf(nextIncome)
      });
    }
  }

  const finalMonthly = equity.mul(monthlyDy);

  return {
    months,
    startEquityBrl: roundCurrency(params.currentEquityBrl),
    finalEquityBrl: roundCurrency(equity),
    finalMonthlyIncomeBrl: roundCurrency(finalMonthly),
    finalAnnualIncomeBrl: roundCurrency(finalMonthly.mul(12)),
    totalDividendsBrl: roundCurrency(totalDividends),
    totalContributedBrl: roundCurrency(contribution.mul(months)),
    coveragePercent: coverageOf(finalMonthly),
    monthlyExpenseBrl: roundCurrency(expense),
    reinvest: params.reinvest,
    timeline
  };
}

// ============================================================================
// 4. MAPA DE CALOR ANUAL DE PROVENTOS (12 MESES — MÉTODO DAVI & HYDRA)
// ============================================================================

export interface AnnualAssetDividendDTO {
  code: string;
  name: string;
  category: PortfolioCategoryKey;
  totalBrl: number;
  isEstimated: boolean;
}

export interface AnnualMonthSummaryDTO {
  month: number;
  monthName: string;
  totalBrl: number;
  isCurrentMonth: boolean;
  isPastOrCurrent: boolean;
  hasRealPayments: boolean;
  assets: AnnualAssetDividendDTO[];
}

export interface AnnualDividendHeatmapDTO {
  year: number;
  totalYearBrl: number;
  monthlyAverageBrl: number;
  bestMonth: { month: number; monthName: string; totalBrl: number } | null;
  months: AnnualMonthSummaryDTO[];
}

const MONTH_LABELS = [
  'Jan', 'Fev', 'Mar', 'Abr', 'Mai', 'Jun',
  'Jul', 'Ago', 'Set', 'Out', 'Nov', 'Dez'
];

export function buildAnnualDividendHeatmap(params: {
  events: DividendEventInput[];
  holdings: HoldingPosition[];
  year: number;
  today?: string;
}): AnnualDividendHeatmapDTO {
  const todayStr = params.today || new Date().toISOString().slice(0, 10);
  const { y: currentYear, m: currentMonth } = parseYmd(todayStr);

  const months: AnnualMonthSummaryDTO[] = [];
  let totalYearDec = d(0);

  // Filtra holdings com potencial de proventos
  const incomeHoldings = params.holdings.filter(
    (h) => h.category !== 'fixed' && h.currentValueBrl > 0 && (h.dividendYieldAnnual > 0 || h.dividends12mBrl > 0)
  );

  for (let m = 1; m <= 12; m++) {
    const monthPrefix = `${params.year}-${pad2(m)}`;
    const isCurrent = params.year === currentYear && m === currentMonth;
    const isPastOrCurrent = params.year < currentYear || (params.year === currentYear && m <= currentMonth);

    // 1. Proventos reais registrados para este mês específico
    const monthEvents = params.events.filter((e) => e.date.startsWith(monthPrefix));
    const assetMap = new Map<string, AnnualAssetDividendDTO>();

    if (monthEvents.length > 0) {
      for (const ev of monthEvents) {
        const code = ev.assetCode.toUpperCase();
        const existing = assetMap.get(code);
        if (existing) {
          existing.totalBrl = roundCurrency(d(existing.totalBrl).plus(d(ev.totalBrl)));
        } else {
          assetMap.set(code, {
            code,
            name: ev.assetName || code,
            category: ev.category,
            totalBrl: roundCurrency(ev.totalBrl),
            isEstimated: false
          });
        }
      }
    } else if (!isPastOrCurrent || params.events.length === 0) {
      // 2. Projeção inteligente baseada na custódia atual para meses futuros ou carteira sem lançamentos
      for (const h of incomeHoldings) {
        let monthlyEst = d(0);
        if (h.dividends12mBrl > 0) {
          monthlyEst = d(h.dividends12mBrl).div(12);
        } else if (h.dividendYieldAnnual > 0) {
          monthlyEst = d(h.currentValueBrl).mul(d(h.dividendYieldAnnual).div(100)).div(12);
        }

        if (monthlyEst.greaterThan(0)) {
          // FIIs pagam todos os meses religiosamente (Aula 5.1)
          // Ações / Stocks distribuem proporcionalmente
          const code = h.code.toUpperCase();
          assetMap.set(code, {
            code,
            name: h.name || code,
            category: h.category,
            totalBrl: roundCurrency(monthlyEst),
            isEstimated: true
          });
        }
      }
    }

    const assets = Array.from(assetMap.values()).sort((a, b) => b.totalBrl - a.totalBrl);
    const monthTotalDec = assets.reduce((sum, a) => sum.plus(d(a.totalBrl)), d(0));
    const monthTotal = roundCurrency(monthTotalDec);
    totalYearDec = totalYearDec.plus(monthTotalDec);

    months.push({
      month: m,
      monthName: MONTH_LABELS[m - 1] || `Mês ${m}`,
      totalBrl: monthTotal,
      isCurrentMonth: isCurrent,
      isPastOrCurrent,
      hasRealPayments: monthEvents.length > 0,
      assets
    });
  }

  const totalYearBrl = roundCurrency(totalYearDec);
  const monthlyAverageBrl = roundCurrency(totalYearDec.div(12));

  // Identifica o melhor mês (mês recorde de dividendos)
  let bestMonth: AnnualDividendHeatmapDTO['bestMonth'] = null;
  const sortedByTotal = [...months].filter((m) => m.totalBrl > 0).sort((a, b) => b.totalBrl - a.totalBrl);
  if (sortedByTotal.length > 0 && sortedByTotal[0]) {
    bestMonth = {
      month: sortedByTotal[0].month,
      monthName: sortedByTotal[0].monthName,
      totalBrl: sortedByTotal[0].totalBrl
    };
  }

  return {
    year: params.year,
    totalYearBrl,
    monthlyAverageBrl,
    bestMonth,
    months
  };
}
