'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type { BenchmarkPeriod } from '@/server/engines/performance.engine';
import type { ResumoPerformanceDTO } from '@/server/engines/resumo.service';

export function useResumoPerformance(period: BenchmarkPeriod) {
  return useQuery({
    queryKey: ['resumo-performance', period],
    queryFn: async () => {
      const res = await fetch(`/api/portfolio/resumo/performance?period=${period}`, {
        credentials: 'include'
      });
      if (res.status === 401) {
        window.location.href = '/login';
        throw new Error('Sessão expirada');
      }
      if (!res.ok) throw new Error('Falha ao carregar a rentabilidade da carteira');
      return ((await res.json()) as { performance: ResumoPerformanceDTO }).performance;
    },
    placeholderData: keepPreviousData,
    staleTime: 5 * 60 * 1000
  });
}
