'use client';

import React from 'react';
import { FileText } from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { useResumoPerformance } from '@/hooks/use-resumo-performance';
import { Skeleton } from '@/components/ui/primitives';
import { ResumoGuide } from '@/components/resumo/resumo-guide';
import { ResumoMetrics } from '@/components/resumo/resumo-metrics';
import { CapitalEvolutionChart } from '@/components/resumo/capital-evolution-chart';
import { BenchmarkChart } from '@/components/resumo/benchmark-chart';
import { AllocationBreakdown } from '@/components/resumo/allocation-breakdown';
import { AllocationDiagnostic } from '@/components/resumo/allocation-diagnostic';

export default function ResumoPage() {
  const { data, isLoading } = usePortfolioData();
  // Período do cartão/evolução independe do seletor do gráfico (cache compartilhado em '12m')
  const performance = useResumoPerformance('12m');

  if (isLoading || !data) {
    return <Skeleton className="h-[560px]" />;
  }

  const { snapshot } = data;
  const hasHoldings = snapshot.flatHoldings.length > 0;

  return (
    <div className="space-y-6">
      <header>
        <h1 className="flex items-center gap-2.5 text-2xl font-extrabold text-white sm:text-3xl">
          <FileText className="h-8 w-8 text-emerald-400" aria-hidden="true" />
          Resumo Geral da Carteira
        </h1>
        <p className="mt-1 text-sm text-slate-200 sm:text-base">
          Visão executiva: acompanhe o crescimento patrimonial e compare sua performance com os índices de mercado.
        </p>
      </header>

      <ResumoGuide hasHoldings={hasHoldings} />
      <ResumoMetrics snapshot={snapshot} totalSummary={performance.data?.totalSummary} />

      {performance.data ? (
        <CapitalEvolutionChart evolution={performance.data.evolution} />
      ) : (
        <Skeleton className="h-[420px]" />
      )}

      <BenchmarkChart />
      <AllocationBreakdown allocation={snapshot.allocation} />
      <AllocationDiagnostic distances={snapshot.categoryDistances} />
    </div>
  );
}
