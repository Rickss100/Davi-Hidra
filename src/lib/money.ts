import Decimal from 'decimal.js';

// Precisão bancária de 28 dígitos significativos com arredondamento comercial padrão (HALF_UP)
Decimal.set({
  precision: 28,
  rounding: Decimal.ROUND_HALF_UP
});

export type NumericInput = Decimal | number | string | null | undefined;

/**
 * Converte qualquer entrada numérica ou string para instância Decimal segura (sem NaN).
 */
export function d(value: NumericInput): Decimal {
  if (value instanceof Decimal) return value;
  if (value === null || value === undefined || value === '') return new Decimal(0);
  if (typeof value === 'number') {
    if (!Number.isFinite(value)) return new Decimal(0);
    return new Decimal(value);
  }
  const cleaned = String(value).trim();
  if (!cleaned) return new Decimal(0);
  try {
    return new Decimal(cleaned);
  } catch {
    return new Decimal(0);
  }
}

export function roundCurrency(value: NumericInput): number {
  return d(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toNumber();
}

export function roundCurrencyStr(value: NumericInput): string {
  return d(value).toDecimalPlaces(2, Decimal.ROUND_HALF_UP).toFixed(2);
}

export function roundPriceStr(value: NumericInput): string {
  return d(value).toDecimalPlaces(6, Decimal.ROUND_HALF_UP).toFixed(6);
}

export function roundQuantityStr(value: NumericInput): string {
  return d(value).toDecimalPlaces(8, Decimal.ROUND_HALF_UP).toFixed(8);
}

export function roundPercent(value: NumericInput, places = 2): number {
  return d(value).toDecimalPlaces(places, Decimal.ROUND_HALF_UP).toNumber();
}

export function convertToBRL(
  amount: NumericInput,
  market: 'BR' | 'US' | string,
  usdRate: NumericInput
): Decimal {
  const base = d(amount);
  if (String(market).toUpperCase() === 'US') {
    const rate = d(usdRate).greaterThan(0) ? d(usdRate) : d('5.65');
    return base.mul(rate);
  }
  return base;
}

export interface LedgerOperation {
  type: 'buy' | 'sell' | 'event' | string;
  quantity: NumericInput;
  price: NumericInput;
  totalValue?: NumericInput;
  date?: string;
}

export interface PositionCalculationResult {
  quantity: Decimal;
  averagePrice: Decimal;
  investedCost: Decimal;
  realizedDividends: Decimal;
}

/**
 * Calcula posição consolidada e Preço Médio Ponderado real de custódia (Padrão Receita Federal / B3):
 * - Compras ('buy') aumentam quantidade e custo total, recalibrando o Preço Médio.
 * - Vendas ('sell') reduzem quantidade proporcionalmente sem alterar o Preço Médio das cotas restantes.
 * - Eventos ('event' — Dividendos, JCP, Rendimentos) acumulam renda passiva sem alterar quantidade de cotas.
 */
export function calculateCustodyPosition(operations: LedgerOperation[]): PositionCalculationResult {
  const sorted = [...operations].sort((a, b) =>
    String(a.date || '').localeCompare(String(b.date || ''))
  );

  let qty = new Decimal(0);
  let avgPrice = new Decimal(0);
  let dividends = new Decimal(0);

  for (const op of sorted) {
    const opType = String(op.type).toLowerCase();
    const opQty = d(op.quantity);
    const opPrice = d(op.price);
    const opTotal = op.totalValue !== undefined && op.totalValue !== null
      ? d(op.totalValue)
      : opQty.mul(opPrice);

    if (opType === 'event') {
      if (opTotal.greaterThan(0)) {
        dividends = dividends.plus(opTotal);
      }
      continue;
    }

    if (opType === 'buy' && opQty.greaterThan(0)) {
      const effectiveCost = opPrice.greaterThan(0) ? opQty.mul(opPrice) : opTotal;
      const previousCost = qty.mul(avgPrice);
      const nextQty = qty.plus(opQty);
      avgPrice = nextQty.greaterThan(0) ? previousCost.plus(effectiveCost).div(nextQty) : new Decimal(0);
      qty = nextQty;
    } else if (opType === 'sell' && opQty.greaterThan(0)) {
      const nextQty = qty.minus(opQty);
      if (nextQty.lessThanOrEqualTo(0)) {
        qty = new Decimal(0);
        avgPrice = new Decimal(0);
      } else {
        qty = nextQty;
      }
    }
  }

  return {
    quantity: qty,
    averagePrice: avgPrice,
    investedCost: qty.mul(avgPrice),
    realizedDividends: dividends
  };
}

const brlFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'BRL',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

const usdFormatter = new Intl.NumberFormat('pt-BR', {
  style: 'currency',
  currency: 'USD',
  minimumFractionDigits: 2,
  maximumFractionDigits: 2
});

export function formatBRL(value: NumericInput): string {
  return brlFormatter.format(roundCurrency(value));
}

export function formatUSD(value: NumericInput): string {
  return usdFormatter.format(roundCurrency(value));
}

export function formatPercent(value: NumericInput, fractionDigits = 2): string {
  const num = roundPercent(value, fractionDigits);
  return `${num.toLocaleString('pt-BR', {
    minimumFractionDigits: fractionDigits,
    maximumFractionDigits: fractionDigits
  })}%`;
}
