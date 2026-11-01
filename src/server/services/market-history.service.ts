import { z } from 'zod';
import type { MonthlySeries } from '@/server/engines/performance.engine';

// ============================================================================
// Dados históricos de mercado (somente servidor).
//  - Taxas oficiais: Banco Central do Brasil (SGS) — CDI (4391) e IPCA (433)
//  - Índices e cotações mensais: Yahoo Finance (^BVSP, ^GSPC, IFIX, BRL=X e tickers)
// Cache em memória de 6h, timeout de 8s e símbolos validados (anti-SSRF).
// Falha de rede NUNCA derruba a página: devolve série vazia e a UI sinaliza.
// ============================================================================

const SUCCESS_TTL_MS = 6 * 60 * 60 * 1000;
const FAILURE_TTL_MS = 10 * 60 * 1000;
const REQUEST_TIMEOUT_MS = 8000;

type CacheEntry = { expires: number; promise: Promise<unknown> };
const globalCache = globalThis as unknown as { __norteMarketCache?: Map<string, CacheEntry> };
const cache = (globalCache.__norteMarketCache ??= new Map<string, CacheEntry>());

async function cached<T>(key: string, loader: () => Promise<{ value: T; ok: boolean }>): Promise<T> {
  const hit = cache.get(key);
  if (hit && hit.expires > Date.now()) return (await hit.promise) as T;

  const promise = loader();
  cache.set(key, {
    expires: Date.now() + FAILURE_TTL_MS,
    promise: promise.then((r) => r.value)
  });
  const result = await promise;
  cache.set(key, {
    expires: Date.now() + (result.ok ? SUCCESS_TTL_MS : FAILURE_TTL_MS),
    promise: Promise.resolve(result.value)
  });
  return result.value;
}

async function fetchJson(url: string): Promise<unknown> {
  const res = await fetch(url, {
    headers: { 'User-Agent': 'Mozilla/5.0 NorteInvest', Accept: 'application/json' },
    signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    cache: 'no-store'
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

// ----------------------------------------------------------------------------
// Banco Central (SGS)
// ----------------------------------------------------------------------------
const bcbSchema = z.array(z.object({ data: z.string(), valor: z.string() }));
const BCB_SERIES = { CDI: 4391, IPCA: 433 } as const;

export async function getBcbMonthlyRates(
  series: keyof typeof BCB_SERIES,
  fromYm: string
): Promise<MonthlySeries> {
  const id = BCB_SERIES[series];
  const [year, month] = fromYm.split('-');
  const startDate = `01/${month}/${year}`;

  return cached<MonthlySeries>(`bcb:${id}:${fromYm}`, async () => {
    try {
      const parsed = bcbSchema.parse(
        await fetchJson(
          `https://api.bcb.gov.br/dados/serie/bcdata.sgs.${id}/dados?formato=json&dataInicial=${startDate}`
        )
      );
      const out: MonthlySeries = {};
      for (const row of parsed) {
        const [, mm, yyyy] = row.data.split('/');
        const value = Number(row.valor);
        if (mm && yyyy && Number.isFinite(value)) out[`${yyyy}-${mm}`] = value;
      }
      return { value: out, ok: Object.keys(out).length > 0 };
    } catch {
      return { value: {}, ok: false };
    }
  });
}

// ----------------------------------------------------------------------------
// Yahoo Finance (fechamento mensal)
// ----------------------------------------------------------------------------
const yahooSchema = z.object({
  chart: z.object({
    result: z
      .array(
        z.object({
          timestamp: z.array(z.number()).optional(),
          indicators: z.object({
            quote: z.array(z.object({ close: z.array(z.number().nullable()) }))
          })
        })
      )
      .nullable()
  })
});

/** Aceita tickers B3/EUA (ex.: ITUB4, HGLG11, BRK.B) e os símbolos fixos de índices/câmbio. */
const SYMBOL_PATTERN = /^(\^?[A-Z0-9]{1,10}(\.[A-Z]{1,2})?|BRL=X)$/;

export type HistoryRange = '2y' | '5y' | '10y';

export async function getMonthlyCloses(symbol: string, range: HistoryRange): Promise<MonthlySeries> {
  const upper = symbol.trim().toUpperCase();
  if (!SYMBOL_PATTERN.test(upper)) return {};

  return cached<MonthlySeries>(`yahoo:${upper}:${range}`, async () => {
    try {
      const parsed = yahooSchema.parse(
        await fetchJson(
          `https://query1.finance.yahoo.com/v8/finance/chart/${encodeURIComponent(upper)}?range=${range}&interval=1mo`
        )
      );
      const result = parsed.chart.result?.[0];
      const closes = result?.indicators.quote[0]?.close ?? [];
      const out: MonthlySeries = {};
      (result?.timestamp ?? []).forEach((ts, i) => {
        const close = closes[i];
        if (close !== null && close !== undefined && close > 0) {
          out[new Date(ts * 1000).toISOString().slice(0, 7)] = close;
        }
      });
      return { value: out, ok: Object.keys(out).length > 0 };
    } catch {
      return { value: {}, ok: false };
    }
  });
}

/** Busca vários símbolos com concorrência limitada para não sobrecarregar a origem. */
export async function getManyMonthlyCloses(
  symbols: string[],
  range: HistoryRange,
  concurrency = 6
): Promise<Record<string, MonthlySeries>> {
  const unique = Array.from(new Set(symbols.map((s) => s.toUpperCase())));
  const out: Record<string, MonthlySeries> = {};
  for (let i = 0; i < unique.length; i += concurrency) {
    const chunk = unique.slice(i, i + concurrency);
    const results = await Promise.all(chunk.map((s) => getMonthlyCloses(s, range)));
    chunk.forEach((s, idx) => {
      out[s] = results[idx] ?? {};
    });
  }
  return out;
}
