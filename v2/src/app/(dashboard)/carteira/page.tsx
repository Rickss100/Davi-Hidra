'use client';

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Button, Card, Badge, Skeleton } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import { NewTransactionModal } from '@/components/portfolio/new-transaction-modal';
import type { PortfolioCategoryKey } from '@/server/engines/davi-hydra.engine';

const CATEGORY_TABS: Array<{ key: 'all' | PortfolioCategoryKey; label: string }> = [
  { key: 'all', label: 'Toda a Custódia' },
  { key: 'acoes', label: 'Ações BR' },
  { key: 'fiis', label: 'FIIs BR' },
  { key: 'fixed', label: 'Renda Fixa' },
  { key: 'stocks', label: 'Stocks EUA' },
  { key: 'reits', label: 'REITs EUA' }
];

export default function CarteiraPage() {
  const { data, isLoading, refetch } = usePortfolioData();
  const [selectedTab, setSelectedTab] = useState<'all' | PortfolioCategoryKey>('all');
  const [modalOpen, setModalOpen] = useState(false);

  if (isLoading || !data) {
    return <Skeleton className="h-96" />;
  }

  const { snapshot } = data;
  const rows =
    selectedTab === 'all' ? snapshot.flatHoldings : snapshot.holdings[selectedTab] || [];

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Minha Carteira Consolidada</h1>
          <p className="text-xs text-slate-400">
            Preço Médio Ponderado calculado com aritmética decimal exata (padrão Receita Federal)
          </p>
        </div>
        <Button variant="gold" size="sm" onClick={() => setModalOpen(true)}>
          <Plus className="h-4 w-4" />
          Nova Operação
        </Button>
      </div>

      <div className="flex flex-wrap gap-2">
        {CATEGORY_TABS.map((tab) => (
          <button
            key={tab.key}
            type="button"
            onClick={() => setSelectedTab(tab.key)}
            className={`rounded-xl border px-3.5 py-2 text-xs font-semibold transition ${
              selectedTab === tab.key
                ? 'border-gold-500/40 bg-gold-500/15 text-gold-300'
                : 'border-slate-800 bg-obsidian-900 text-slate-400 hover:text-white'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      <Card>
        {rows.length === 0 ? (
          <p className="py-12 text-center text-sm text-slate-400">
            Nenhum ativo nesta classe no momento.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-3 font-semibold">Ativo</th>
                  <th className="pb-3 font-semibold">Setor</th>
                  <th className="pb-3 text-right font-semibold">Cotas</th>
                  <th className="pb-3 text-right font-semibold">Preço Médio</th>
                  <th className="pb-3 text-right font-semibold">Cotação</th>
                  <th className="pb-3 text-right font-semibold">Investido (R$)</th>
                  <th className="pb-3 text-right font-semibold">Saldo Atual (R$)</th>
                  <th className="pb-3 text-right font-semibold">Rentabilidade</th>
                  <th className="pb-3 text-right font-semibold">YoC 12M</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map((h) => (
                  <tr key={h.code} className="hover:bg-obsidian-800/40">
                    <td className="py-3">
                      <span className="font-bold text-white">{h.code}</span>
                      <span className="ml-2 text-[10px] uppercase text-slate-500">{h.market}</span>
                    </td>
                    <td className="py-3 text-slate-400">{h.sector || '—'}</td>
                    <td className="money-value py-3 text-right text-slate-200">{h.quantity}</td>
                    <td className="money-value py-3 text-right text-slate-300">
                      {h.market === 'US' ? `US$ ${h.averagePrice.toFixed(2)}` : formatBRL(h.averagePrice)}
                    </td>
                    <td className="money-value py-3 text-right text-slate-200">
                      {h.market === 'US' ? `US$ ${h.currentPrice.toFixed(2)}` : formatBRL(h.currentPrice)}
                    </td>
                    <td className="money-value py-3 text-right text-slate-300">
                      {formatBRL(h.investedBrl)}
                    </td>
                    <td className="money-value py-3 text-right font-bold text-white">
                      {formatBRL(h.currentValueBrl)}
                    </td>
                    <td className="money-value py-3 text-right">
                      <Badge tone={h.profitBrl >= 0 ? 'emerald' : 'rose'}>
                        {h.profitBrl >= 0 ? '+' : ''}
                        {formatPercent(h.profitPercent)}
                      </Badge>
                    </td>
                    <td className="money-value py-3 text-right font-semibold text-gold-300">
                      {formatPercent(h.yieldOnCostPercent)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Card>

      <NewTransactionModal
        open={modalOpen}
        onClose={() => setModalOpen(false)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
