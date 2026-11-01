'use client';

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import type { AuthorizedPortfolioContext } from '@/server/dal/auth-dal';
import type { PortfolioSnapshotDTO } from '@/server/engines/portfolio.service';

export interface PortfolioApiResponse {
  context: AuthorizedPortfolioContext;
  snapshot: PortfolioSnapshotDTO;
}

export function usePortfolioData() {
  return useQuery<PortfolioApiResponse>({
    queryKey: ['portfolio-snapshot'],
    queryFn: async () => {
      const res = await fetch('/api/portfolio', { credentials: 'include' });
      if (res.status === 401) {
        window.location.href = '/login';
        throw new Error('Sessão expirada');
      }
      if (!res.ok) {
        throw new Error('Falha ao carregar dados patrimoniais');
      }
      return res.json();
    }
  });
}

export function useSyncLivePrices() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async () => {
      const res = await fetch('/api/cron/prices', {
        method: 'POST',
        credentials: 'include'
      });
      if (!res.ok) throw new Error('Falha ao sincronizar cotações');
      return res.json() as Promise<{ updatedCount: number; activeTickers: number }>;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['portfolio-snapshot'] });
    }
  });
}
