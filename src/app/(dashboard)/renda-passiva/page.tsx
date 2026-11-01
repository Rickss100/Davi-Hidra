'use client';

import React, { useState } from 'react';
import { Briefcase, Calendar, Flame, Snowflake, TrendingUp } from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Skeleton } from '@/components/ui/primitives';
import { PassiveIncomeMetrics } from '@/components/renda-passiva/passive-income-metrics';
import { PassiveIncomeGuide } from '@/components/renda-passiva/passive-income-guide';
import { DividendsCalendar } from '@/components/renda-passiva/dividends-calendar';
import { AnnualDividendHeatmap } from '@/components/renda-passiva/annual-dividend-heatmap';
import { FutureIncomeForecast } from '@/components/renda-passiva/future-income-forecast';
import { MagicNumberGrid } from '@/components/renda-passiva/magic-number-grid';
import { cn } from '@/lib/utils';

const TABS = [
  { id: 'calendar', label: 'Calendário Mensal', Icon: Calendar },
  { id: 'heatmap', label: 'Mapa Anual (12 Meses)', Icon: Flame },
  { id: 'forecast', label: 'Previsão de Orçamento no Futuro', Icon: TrendingUp },
  { id: 'magic', label: 'Número Mágico (Bola de Neve)', Icon: Snowflake }
] as const;

type TabId = (typeof TABS)[number]['id'];

export default function RendaPassivaPage() {
  const { data, isLoading } = usePortfolioData();
  const [activeTab, setActiveTab] = useState<TabId>('calendar');

  if (isLoading || !data) {
    return <Skeleton className="h-[560px]" />;
  }

  const { snapshot } = data;
  const metrics = snapshot.passiveIncome.metrics;
  const hasHoldings = snapshot.flatHoldings.some((h) => h.category !== 'fixed');

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-white sm:text-3xl">
          <Briefcase className="h-8 w-8 text-emerald-400" aria-hidden="true" />
          Renda Passiva &amp; Dividendos
        </h1>
        <p className="mt-1 text-sm text-slate-200 sm:text-base">
          Monitore seus proventos, acompanhe o calendário de pagamentos e projete seu orçamento rumo à liberdade
          financeira.
        </p>
      </header>

      <PassiveIncomeGuide hasHoldings={hasHoldings} />
      <PassiveIncomeMetrics metrics={metrics} />

      <div role="tablist" aria-label="Seções de renda passiva" className="flex flex-wrap gap-1 border-b border-slate-800">
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            id={`tab-${id}`}
            type="button"
            role="tab"
            aria-selected={activeTab === id}
            aria-controls={`panel-${id}`}
            onClick={() => setActiveTab(id)}
            className={cn(
              '-mb-px flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-bold transition sm:text-base',
              activeTab === id
                ? 'border-emerald-400 text-emerald-300'
                : 'border-transparent text-slate-300 hover:text-white'
            )}
          >
            <Icon className="h-5 w-5" aria-hidden="true" />
            {label}
          </button>
        ))}
      </div>

      <div role="tabpanel" id={`panel-${activeTab}`} aria-labelledby={`tab-${activeTab}`}>
        {activeTab === 'calendar' && <DividendsCalendar />}
        {activeTab === 'heatmap' && <AnnualDividendHeatmap />}
        {activeTab === 'forecast' && (
          <FutureIncomeForecast
            currentEquityBrl={snapshot.totalEquityBrl}
            suggestedYieldPercent={metrics.dividendYieldPercent}
          />
        )}
        {activeTab === 'magic' && <MagicNumberGrid rows={snapshot.magicNumbers} />}
      </div>
    </div>
  );
}
