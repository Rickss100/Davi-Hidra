'use client';

import React, { useState } from 'react';
import { FileSpreadsheet, Pencil, Plus, Trash2 } from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Button, Card, Badge, Skeleton } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import { NewTransactionModal } from '@/components/portfolio/new-transaction-modal';
import { B3ImportModal } from '@/components/portfolio/b3-import-modal';
import {
  ManageHoldingModal,
  type ManageHoldingTab
} from '@/components/portfolio/manage-holding-modal';
import type {
  HoldingPosition,
  PortfolioCategoryKey
} from '@/server/engines/davi-hydra.engine';

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
  const [b3ModalOpen, setB3ModalOpen] = useState(false);
  const [managedHolding, setManagedHolding] = useState<HoldingPosition | null>(null);
  const [managedTab, setManagedTab] = useState<ManageHoldingTab>('transactions');

  if (isLoading || !data) {
    return <Skeleton className="h-96" />;
  }

  const { snapshot } = data;
  const rows =
    selectedTab === 'all' ? snapshot.flatHoldings : snapshot.holdings[selectedTab] || [];

  const openManage = (holding: HoldingPosition, tab: ManageHoldingTab) => {
    setManagedTab(tab);
    setManagedHolding(holding);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Minha Carteira Consolidada</h1>
          <p className="text-xs text-slate-400">
            Preço Médio Ponderado calculado com aritmética decimal exata (padrão Receita Federal)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setB3ModalOpen(true)}
            className="gap-2 text-xs font-semibold"
          >
            <FileSpreadsheet className="h-4 w-4 text-emerald-400" />
            Importar B3 (.xlsx)
          </Button>
          <Button
            variant="gold"
            size="sm"
            onClick={() => setModalOpen(true)}
            className="gap-2 text-xs font-semibold"
          >
            <Plus className="h-4 w-4" />
            Nova Operação
          </Button>
        </div>
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
                  <th className="pb-3 text-right font-semibold">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {rows.map((h) => {
                  const hasDistinctName = h.name.toUpperCase() !== h.code.toUpperCase();
                  return (
                    <tr key={h.code} className="hover:bg-obsidian-800/40">
                      <td className="py-3">
                        <div className="flex items-center gap-1.5">
                          <span className="font-bold text-white">{h.code}</span>
                          <span className="text-[10px] uppercase text-slate-500">{h.market}</span>
                        </div>
                        {hasDistinctName && (
                          <span className="block max-w-[180px] truncate text-[11px] text-slate-400">
                            {h.name}
                          </span>
                        )}
                      </td>
                      <td className="py-3 text-slate-400">{h.sector || '—'}</td>
                      <td className="money-value py-3 text-right text-slate-200">{h.quantity}</td>
                      <td className="money-value py-3 text-right text-slate-300">
                        {h.market === 'US'
                          ? `US$ ${h.averagePrice.toFixed(2)}`
                          : formatBRL(h.averagePrice)}
                      </td>
                      <td className="money-value py-3 text-right text-slate-200">
                        {h.market === 'US'
                          ? `US$ ${h.currentPrice.toFixed(2)}`
                          : formatBRL(h.currentPrice)}
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
                      <td className="py-3 text-right">
                        <div className="inline-flex items-center justify-end gap-1.5">
                          <button
                            type="button"
                            title={`Editar aportes ou posição de ${h.code}`}
                            aria-label={`Editar posição de ${h.code}`}
                            onClick={() => openManage(h, 'transactions')}
                            className="rounded-lg border border-slate-700/80 bg-obsidian-950 p-1.5 text-slate-300 transition hover:border-gold-500/50 hover:text-gold-300"
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </button>
                          <button
                            type="button"
                            title={`Apagar ${h.code} da carteira`}
                            aria-label={`Apagar ativo ${h.code} da carteira`}
                            onClick={() => openManage(h, 'delete')}
                            className="rounded-lg border border-slate-700/80 bg-obsidian-950 p-1.5 text-slate-400 transition hover:border-rose-500/50 hover:text-rose-400"
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
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

      <B3ImportModal
        open={b3ModalOpen}
        onClose={() => setB3ModalOpen(false)}
        onSuccess={() => refetch()}
      />

      <ManageHoldingModal
        holding={managedHolding}
        initialTab={managedTab}
        onClose={() => setManagedHolding(null)}
        onSuccess={() => refetch()}
      />
    </div>
  );
}
