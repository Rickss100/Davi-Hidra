'use client';

import { keepPreviousData, useQuery } from '@tanstack/react-query';
import type {
  DividendCalendarDTO,
  IncomeForecastDTO,
  AnnualDividendHeatmapDTO
} from '@/server/engines/passive-income.engine';

async function fetchJson<T>(url: string): Promise<T> {
  const res = await fetch(url, { credentials: 'include' });
  if (res.status === 401) {
    window.location.href = '/login';
    throw new Error('Sessão expirada');
  }
  if (!res.ok) throw new Error('Falha ao carregar dados de renda passiva');
  return res.json() as Promise<T>;
}

export function useDividendCalendar(year: number, month: number) {
  return useQuery({
    queryKey: ['passive-income-calendar', year, month],
    queryFn: () =>
      fetchJson<{ calendar: DividendCalendarDTO; totalEventsRegistered: number }>(
        `/api/portfolio/passive-income/calendar?year=${year}&month=${month}`
      ),
    placeholderData: keepPreviousData
  });
}

export interface ForecastParams {
  months: number;
  monthlyContributionBrl: number;
  dividendYieldPercent: number;
  reinvest: boolean;
}

export function useIncomeForecast(params: ForecastParams) {
  const qs = new URLSearchParams({
    months: String(params.months),
    monthlyContributionBrl: String(params.monthlyContributionBrl),
    dividendYieldPercent: String(params.dividendYieldPercent),
    reinvest: String(params.reinvest)
  });
  return useQuery({
    queryKey: ['passive-income-forecast', params],
    queryFn: () =>
      fetchJson<{ forecast: IncomeForecastDTO }>(`/api/portfolio/passive-income/forecast?${qs}`),
    placeholderData: keepPreviousData
  });
}

export function useAnnualDividends(year: number) {
  return useQuery({
    queryKey: ['passive-income-annual', year],
    queryFn: () =>
      fetchJson<{ heatmap: AnnualDividendHeatmapDTO; totalEventsRegistered: number }>(
        `/api/portfolio/passive-income/annual?year=${year}`
      ),
    placeholderData: keepPreviousData
  });
}
