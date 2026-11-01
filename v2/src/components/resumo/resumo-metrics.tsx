import React from 'react';
import { Coins, DollarSign, Percent, ShieldCheck, TrendingDown, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { PortfolioSnapshotDTO } from '@/server/engines/portfolio.service';
import type { PerformanceSummaryDTO } from '@/server/engines/performance.engine';

interface MetricCardProps {
  label: string;
  value: string;
  suffix?: string;
  footer: string;
  icon: React.ReactNode;
  valueClass: string;
  footerClass?: string;
  highlight?: boolean;
}

function MetricCard({ label, value, suffix, footer, icon, valueClass, footerClass, highlight }: MetricCardProps) {
  return (
    <Card className={cn('space-y-2', highlight && 'border-emerald-500/50 bg-emerald-950/20')}>
      <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-slate-300">
        <span>{label}</span>
        {icon}
      </div>
      <p className={cn('money-value text-2xl font-extrabold sm:text-3xl', valueClass)}>
        {value}
        {suffix ? <span className="ml-1.5 text-base font-semibold text-slate-300">{suffix}</span> : null}
      </p>
      <p className={cn('text-sm text-slate-300', footerClass)}>{footer}</p>
    </Card>
  );
}

interface ResumoMetricsProps {
  snapshot: PortfolioSnapshotDTO;
  /** Resumo desde o 1º aporte; `undefined` enquanto a rentabilidade é calculada. */
  totalSummary: PerformanceSummaryDTO | undefined;
}

export function ResumoMetrics({ snapshot, totalSummary }: ResumoMetricsProps) {
  const profit = snapshot.totalProfitBrl;
  const positive = profit >= 0;
  const pctOfCdi = totalSummary?.percentOfCdi ?? null;
  const alpha = totalSummary?.alphaVsCdiPp ?? null;

  let cdiValue = '—';
  let cdiFooter = 'Calculando com dados do mercado…';
  if (totalSummary) {
    if (pctOfCdi !== null) {
      cdiValue = `${pctOfCdi.toLocaleString('pt-BR')}%`;
      cdiFooter =
        alpha !== null && alpha >= 0
          ? `Superando o CDI em +${formatPercent(alpha, 2)}%`
          : `Abaixo do CDI em ${formatPercent(Math.abs(alpha ?? 0), 2)}%`;
    } else {
      cdiFooter = 'Disponível após o registro dos primeiros aportes';
    }
  }

  return (
    <section aria-label="Resumo executivo da carteira" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-5">
      <MetricCard
        highlight
        label="Patrimônio Total"
        value={formatBRL(snapshot.totalEquityBrl)}
        footer="Posição consolidada a mercado"
        icon={<DollarSign className="h-5 w-5 text-emerald-400" aria-hidden="true" />}
        valueClass="text-emerald-400"
      />
      <MetricCard
        label="Capital Aplicado"
        value={formatBRL(snapshot.totalInvestedBrl)}
        footer="Total aportado de compras"
        icon={<Coins className="h-5 w-5 text-sky-400" aria-hidden="true" />}
        valueClass="text-white"
      />
      <MetricCard
        label="Lucro / Prejuízo"
        value={`${positive ? '+' : '−'}${formatBRL(Math.abs(profit))}`}
        footer={`${snapshot.totalProfitPercent >= 0 ? '+' : ''}${formatPercent(snapshot.totalProfitPercent)} de retorno total`}
        footerClass={cn('font-semibold', positive ? 'text-emerald-400' : 'text-rose-400')}
        icon={
          positive ? (
            <TrendingUp className="h-5 w-5 text-emerald-400" aria-hidden="true" />
          ) : (
            <TrendingDown className="h-5 w-5 text-rose-400" aria-hidden="true" />
          )
        }
        valueClass={positive ? 'text-emerald-400' : 'text-rose-400'}
      />
      <MetricCard
        label="Desempenho vs. CDI"
        value={cdiValue}
        suffix={pctOfCdi !== null ? 'do CDI' : undefined}
        footer={cdiFooter}
        icon={<Percent className="h-5 w-5 text-gold-400" aria-hidden="true" />}
        valueClass="text-gold-400"
      />
      <MetricCard
        label="Proventos Recebidos"
        value={formatBRL(snapshot.passiveIncome.allTimeBrl)}
        footer="Dividendos, JCP e FIIs creditados"
        icon={<ShieldCheck className="h-5 w-5 text-purple-400" aria-hidden="true" />}
        valueClass="text-purple-300"
      />
    </section>
  );
}
