import { d, roundCurrency, roundPercent } from '@/lib/money';
import type { CategorizedHoldings, HoldingPosition } from '@/server/engines/davi-hydra.engine';

export type AllocationClassKey = 'acoes' | 'fiis' | 'stocks' | 'reits' | 'fixed' | 'reserva';

export interface AllocationClassDTO {
  key: AllocationClassKey;
  name: string;
  color: string;
  investedBrl: number;
  currentBrl: number;
  profitBrl: number;
  returnPercent: number;
  sharePercent: number;
}

export interface AllocationBreakdownDTO {
  totalCurrentBrl: number;
  classes: AllocationClassDTO[];
  geography: {
    brasilPercent: number;
    exteriorPercent: number;
    brlTotal: number;
    usdTotal: number;
  };
}

const CLASS_META: Record<AllocationClassKey, { name: string; color: string }> = {
  acoes: { name: 'Ações B3', color: '#10b981' },
  fiis: { name: 'Fundos Imobiliários', color: '#a855f7' },
  stocks: { name: 'Stocks (EUA)', color: '#f59e0b' },
  reits: { name: 'REITs (EUA)', color: '#38bdf8' },
  fixed: { name: 'Renda Fixa (Investimentos)', color: '#d4af37' },
  reserva: { name: 'Reserva de Emergência', color: '#3b82f6' }
};

const CLASS_ORDER: AllocationClassKey[] = ['acoes', 'fiis', 'stocks', 'reits', 'fixed', 'reserva'];

/**
 * Consolida a carteira por classe de ativo. Títulos que compõem a Reserva de Emergência
 * (informados em `reserveCodes`) saem de "Renda Fixa" e formam a classe própria "Reserva".
 */
export function buildAllocationBreakdown(
  holdings: CategorizedHoldings,
  reserveCodes: string[]
): AllocationBreakdownDTO {
  const reserveSet = new Set(reserveCodes.map((c) => c.toUpperCase()));
  const acc = new Map<AllocationClassKey, { invested: ReturnType<typeof d>; current: ReturnType<typeof d> }>();
  let brlTotal = d(0);
  let usdTotal = d(0);

  const all: HoldingPosition[] = [
    ...holdings.acoes,
    ...holdings.fiis,
    ...holdings.stocks,
    ...holdings.reits,
    ...holdings.fixed
  ];

  for (const h of all) {
    const key: AllocationClassKey =
      h.category === 'fixed' && reserveSet.has(h.code.toUpperCase()) ? 'reserva' : h.category;
    const slot = acc.get(key) ?? { invested: d(0), current: d(0) };
    slot.invested = slot.invested.plus(h.investedBrl);
    slot.current = slot.current.plus(h.currentValueBrl);
    acc.set(key, slot);

    if (h.market === 'US') usdTotal = usdTotal.plus(h.currentValueBrl);
    else brlTotal = brlTotal.plus(h.currentValueBrl);
  }

  const total = brlTotal.plus(usdTotal);

  const classes: AllocationClassDTO[] = CLASS_ORDER.flatMap((key) => {
    const slot = acc.get(key);
    if (!slot || (slot.current.lessThanOrEqualTo(0) && slot.invested.lessThanOrEqualTo(0))) return [];
    const profit = slot.current.minus(slot.invested);
    return [
      {
        key,
        name: CLASS_META[key].name,
        color: CLASS_META[key].color,
        investedBrl: roundCurrency(slot.invested),
        currentBrl: roundCurrency(slot.current),
        profitBrl: roundCurrency(profit),
        returnPercent: slot.invested.greaterThan(0) ? roundPercent(profit.div(slot.invested).mul(100), 2) : 0,
        sharePercent: total.greaterThan(0) ? roundPercent(slot.current.div(total).mul(100), 1) : 0
      }
    ];
  });

  return {
    totalCurrentBrl: roundCurrency(total),
    classes,
    geography: {
      brasilPercent: total.greaterThan(0) ? roundPercent(brlTotal.div(total).mul(100), 1) : 0,
      exteriorPercent: total.greaterThan(0) ? roundPercent(usdTotal.div(total).mul(100), 1) : 0,
      brlTotal: roundCurrency(brlTotal),
      usdTotal: roundCurrency(usdTotal)
    }
  };
}
