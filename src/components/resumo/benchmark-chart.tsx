'use client';

import React, { useState } from 'react';
import { CartesianGrid, Line, LineChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts';
import { Info, TrendingUp } from 'lucide-react';
import { Card, Skeleton } from '@/components/ui/primitives';
import { useResumoPerformance } from '@/hooks/use-resumo-performance';
import { formatPercent } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { BenchmarkPeriod, BenchmarkPointDTO } from '@/server/engines/performance.engine';

type SeriesKey = 'carteira' | 'sp500' | 'ibov' | 'cdi' | 'ipca' | 'ifix';

const SERIES: Array<{ key: SeriesKey; label: string; chartName: string; color: string; dash?: string; width: number }> = [
  { key: 'carteira', label: 'Sua Carteira', chartName: 'Sua Carteira', color: '#04d361', width: 3 },
  { key: 'sp500', label: 'S&P 500 (EUA)', chartName: 'S&P 500 (EUA)', color: '#38bdf8', width: 2 },
  { key: 'ibov', label: 'Ibovespa / B3', chartName: 'Ibovespa', color: '#a855f7', width: 2 },
  { key: 'cdi', label: 'Selic / CDI', chartName: 'Selic / CDI', color: '#fbbf24', dash: '4 4', width: 2 },
  { key: 'ipca', label: 'IPCA / Inflação', chartName: 'IPCA (Inflação)', color: '#f97316', dash: '2 2', width: 1.5 },
  { key: 'ifix', label: 'IFIX (FIIs)', chartName: 'IFIX (FIIs)', color: '#ec4899', width: 1.5 }
];

const PERIODS: Array<{ id: BenchmarkPeriod; label: string }> = [
  { id: '6m', label: '6M' },
  { id: 'ytd', label: 'YTD' },
  { id: '12m', label: '12M' },
  { id: '24m', label: '24M' },
  { id: 'total', label: 'Total' }
];

const fmtSigned = (v: number | null | undefined, digits = 2) =>
  v === null || v === undefined ? '—' : `${v > 0 ? '+' : ''}${formatPercent(v, digits)}`;

interface TooltipPayloadItem {
  name?: string;
  value?: number | null;
  color?: string;
}

function BenchmarkTooltip({
  active,
  payload,
  label
}: {
  active?: boolean;
  payload?: TooltipPayloadItem[];
  label?: string;
}) {
  if (!active || !payload?.length) return null;
  return (
    <div className="min-w-[210px] rounded-lg border border-slate-700 bg-obsidian-900 p-3 shadow-xl">
      <p className="mb-1.5 text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      {payload.map((item) => (
        <div key={item.name} className="flex justify-between gap-4 text-sm py-0.5">
          <span style={{ color: item.color }} className="font-semibold">
            {item.name}:
          </span>
          <span className="font-bold text-white">{fmtSigned(item.value)}</span>
        </div>
      ))}
    </div>
  );
}

function ComparisonBox({
  label,
  value,
  caption
}: {
  label: string;
  value: number | null;
  caption: string;
}) {
  const color = value === null ? 'text-slate-400' : value >= 0 ? 'text-emerald-400' : 'text-rose-400';
  return (
    <div className="rounded-xl border border-slate-700/80 bg-obsidian-950/60 p-4 text-center">
      <p className="text-sm font-medium text-slate-300">{label}</p>
      <p className={cn('text-2xl font-extrabold my-1', color)}>{fmtSigned(value)}</p>
      <p className="text-xs text-slate-400">{caption}</p>
    </div>
  );
}

export function BenchmarkChart() {
  const [period, setPeriod] = useState<BenchmarkPeriod>('12m');
  const [visible, setVisible] = useState<Record<SeriesKey, boolean>>({
    carteira: true,
    sp500: true,
    ibov: true,
    cdi: true,
    ipca: true,
    ifix: true
  });

  const { data, isLoading, isFetching, isError } = useResumoPerformance(period);

  const points: BenchmarkPointDTO[] = data?.points ?? [];
  const last = points[points.length - 1];
  const summary = data?.summary;

  return (
    <Card className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 className="flex items-center gap-2.5 text-lg font-extrabold text-white sm:text-xl">
            <TrendingUp className="h-6 w-6 text-emerald-400" aria-hidden="true" />
            Rentabilidade Relativa vs. Benchmarks
          </h2>
          <p className="mt-1 text-sm text-slate-200 sm:text-base">
            Compare o retorno acumulado da sua carteira contra os principais índices do mercado (EUA, Brasil e Renda Fixa).
          </p>
        </div>

        <div role="group" aria-label="Período do gráfico" className="flex rounded-lg border border-slate-700 bg-obsidian-950/70 p-1">
          {PERIODS.map((p) => (
            <button
              key={p.id}
              type="button"
              aria-pressed={period === p.id}
              onClick={() => setPeriod(p.id)}
              className={cn(
                'rounded-md px-3.5 py-1.5 text-sm font-bold transition',
                period === p.id ? 'bg-emerald-500 text-obsidian-950' : 'text-slate-200 hover:text-white'
              )}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {isError && (
        <p role="alert" className="rounded-xl border border-rose-500/40 bg-rose-500/10 p-4 text-sm text-rose-100 sm:text-base">
          Não foi possível calcular a rentabilidade agora. Tente novamente em instantes.
        </p>
      )}

      {data && !data.hasInvestments && (
        <p className="flex items-start gap-2.5 rounded-xl border border-sky-500/40 bg-sky-500/10 p-4 text-sm text-sky-100 sm:text-base">
          <Info className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
          <span>
            <strong>Carteira sem aportes cadastrados (0,00%).</strong> Os índices de mercado abaixo estão exibidos como referência comparativa para quando você registrar seus primeiros investimentos.
          </span>
        </p>
      )}

      <div role="group" aria-label="Curvas visíveis" className="flex flex-wrap gap-2 rounded-xl border border-slate-800 bg-obsidian-950/60 p-3">
        {SERIES.map((s) => {
          const value = last ? last[s.key] : null;
          const on = visible[s.key];
          return (
            <button
              key={s.key}
              type="button"
              aria-pressed={on}
              onClick={() => setVisible((prev) => ({ ...prev, [s.key]: !prev[s.key] }))}
              style={on ? { borderColor: s.color } : undefined}
              className={cn(
                'flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs sm:text-sm font-semibold transition',
                on ? 'bg-obsidian-900 text-white' : 'border-slate-700 text-slate-400 hover:text-white'
              )}
            >
              <span className="h-2.5 w-2.5 rounded-full" style={{ background: s.color }} aria-hidden="true" />
              {s.label} ({fmtSigned(value)})
            </button>
          );
        })}
      </div>

      {isLoading || !data ? (
        <Skeleton className="h-[360px]" />
      ) : (
        <div
          className={cn('h-[360px] w-full', isFetching && 'opacity-70')}
          role="img"
          aria-label="Gráfico de rentabilidade acumulada da carteira contra os índices de mercado"
        >
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={points} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#29292e" vertical={false} />
              <XAxis dataKey="label" stroke="#94a3b8" tick={{ fill: '#cbd5e1', fontSize: 12 }} />
              <YAxis
                stroke="#94a3b8"
                tick={{ fill: '#cbd5e1', fontSize: 12 }}
                tickFormatter={(v: number) => `${v}%`}
                width={56}
              />
              <Tooltip content={<BenchmarkTooltip />} />
              {SERIES.filter((s) => visible[s.key]).map((s) => (
                <Line
                  key={s.key}
                  type="monotone"
                  dataKey={s.key}
                  name={s.chartName}
                  stroke={s.color}
                  strokeWidth={s.width}
                  strokeDasharray={s.dash}
                  dot={s.key === 'carteira' ? { r: 3, fill: s.color } : false}
                  activeDot={{ r: 6 }}
                  connectNulls={false}
                />
              ))}
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <ComparisonBox
          label="Sua Carteira"
          value={summary?.portfolioReturnPercent ?? null}
          caption={data?.hasInvestments ? 'Retorno total consolidado' : 'Aguardando primeiros aportes'}
        />
        <ComparisonBox
          label="Alfa vs. CDI"
          value={summary?.alphaVsCdiPp ?? null}
          caption="Retorno excedente ao risco zero"
        />
        <ComparisonBox
          label="Alfa vs. Ibovespa"
          value={summary?.alphaVsIbovPp ?? null}
          caption="Superação do mercado BR"
        />
        <ComparisonBox
          label="Ganho Real (Acima do IPCA)"
          value={summary?.realGainVsIpcaPercent ?? null}
          caption="Aumento do poder de compra"
        />
      </div>

      <div className="space-y-2 text-xs leading-relaxed text-slate-400 sm:text-sm">
        <p>
          <strong>Metodologia:</strong> rentabilidade consolidada da carteira incluindo proventos recebidos e valorização a mercado.
          Renda fixa e Reserva são capitalizadas pelo CDI. Índices de mercado baseados nas referências oficiais do mercado financeiro brasileiro e global (Banco Central, B3 e S&amp;P 500). Rentabilidade passada não garante resultados futuros.
        </p>
      </div>
    </Card>
  );
}
