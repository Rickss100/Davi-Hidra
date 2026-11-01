import React from 'react';
import { DollarSign, Percent, ShieldCheck, TrendingUp } from 'lucide-react';
import { Card } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { PassiveIncomeMetricsDTO } from '@/server/engines/passive-income.engine';

interface MetricCardProps {
  label: string;
  value: string;
  suffix?: string;
  footer: string;
  icon: React.ReactNode;
  valueClass: string;
  highlight?: boolean;
}

function MetricCard({ label, value, suffix, footer, icon, valueClass, highlight }: MetricCardProps) {
  return (
    <Card className={cn('space-y-2', highlight && 'border-emerald-500/50 bg-emerald-950/20')}>
      <div className="flex items-center justify-between text-sm font-semibold uppercase tracking-wide text-slate-300">
        <span>{label}</span>
        {icon}
      </div>
      <p className={cn('money-value text-3xl font-extrabold', valueClass)}>
        {value}
        {suffix ? <span className="ml-1.5 text-base font-semibold text-slate-300">{suffix}</span> : null}
      </p>
      <p className="text-sm text-slate-300">{footer}</p>
    </Card>
  );
}

export function PassiveIncomeMetrics({ metrics }: { metrics: PassiveIncomeMetricsDTO }) {
  const hasData = metrics.source !== 'none';
  const sourceNote =
    metrics.source === 'real'
      ? 'Base: proventos reais dos últimos 12 meses'
      : metrics.source === 'estimated'
        ? 'Estimativa pelo DY dos ativos (ainda sem proventos registrados)'
        : 'Cadastre ativos pagadores de proventos';

  return (
    <section aria-label="Resumo da renda passiva" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
      <MetricCard
        highlight
        label="Renda Mensal Estimada"
        value={formatBRL(metrics.estimatedMonthlyIncomeBrl)}
        footer={
          hasData ? `~${formatBRL(metrics.estimatedAnnualIncomeBrl)} por ano · ${sourceNote}` : sourceNote
        }
        icon={<DollarSign className="h-5 w-5 text-emerald-400" aria-hidden="true" />}
        valueClass="text-emerald-400"
      />
      <MetricCard
        label="Dividend Yield Médio"
        value={formatPercent(metrics.dividendYieldPercent, 1)}
        suffix="a.a."
        footer={hasData ? 'Proventos ÷ valor atual dos ativos pagadores' : 'Sem ativos pagadores'}
        icon={<Percent className="h-5 w-5 text-sky-400" aria-hidden="true" />}
        valueClass="text-sky-400"
      />
      <MetricCard
        label="Yield on Cost (YoC)"
        value={formatPercent(metrics.yieldOnCostPercent, 1)}
        suffix="a.a."
        footer={hasData ? 'Proventos ÷ preço médio que você pagou' : 'Sem ativos pagadores'}
        icon={<TrendingUp className="h-5 w-5 text-purple-400" aria-hidden="true" />}
        valueClass="text-purple-300"
      />
      <MetricCard
        label="Cobertura de Custos"
        value={formatPercent(metrics.costCoveragePercent, 1)}
        footer={
          metrics.monthlyExpenseBrl > 0
            ? `Do seu custo de vida de ${formatBRL(metrics.monthlyExpenseBrl)}/mês`
            : 'Defina seu custo de vida na Reserva de Emergência'
        }
        icon={<ShieldCheck className="h-5 w-5 text-gold-400" aria-hidden="true" />}
        valueClass="text-gold-400"
      />
    </section>
  );
}
