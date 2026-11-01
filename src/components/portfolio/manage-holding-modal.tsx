'use client';

import React, { useEffect, useState } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { AlertTriangle, Pencil, Trash2, X } from 'lucide-react';
import { Badge, Button, Card, Input, Skeleton } from '@/components/ui/primitives';
import { formatBRL, formatUSD } from '@/lib/money';
import type { HoldingPosition } from '@/server/engines/davi-hydra.engine';
import {
  EditTransactionModal,
  type EditableTransactionItem
} from '@/components/portfolio/edit-transaction-modal';

export type ManageHoldingTab = 'transactions' | 'adjust' | 'delete';

interface ManageHoldingModalProps {
  holding: HoldingPosition | null;
  initialTab?: ManageHoldingTab;
  onClose: () => void;
  onSuccess: () => void;
}

export function ManageHoldingModal({
  holding,
  initialTab = 'transactions',
  onClose,
  onSuccess
}: ManageHoldingModalProps) {
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState<ManageHoldingTab>(initialTab);
  const [editingTx, setEditingTx] = useState<EditableTransactionItem | null>(null);
  const [confirmDeleteTxId, setConfirmDeleteTxId] = useState<number | null>(null);
  const [adjQuantity, setAdjQuantity] = useState('');
  const [adjAvgPrice, setAdjAvgPrice] = useState('');
  const [keepDividends, setKeepDividends] = useState(true);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (!holding) return;
    setActiveTab(initialTab);
    setAdjQuantity(String(holding.quantity));
    setAdjAvgPrice(String(holding.averagePrice));
    setKeepDividends(true);
    setConfirmDeleteTxId(null);
    setError('');
  }, [holding, initialTab]);

  const {
    data: txList = [],
    isLoading,
    refetch: refetchTx
  } = useQuery<EditableTransactionItem[]>({
    queryKey: ['asset-transactions', holding?.code],
    enabled: Boolean(holding?.code),
    queryFn: async () => {
      if (!holding) return [];
      const res = await fetch(
        `/api/portfolio/transactions?assetCode=${encodeURIComponent(holding.code)}`
      );
      if (!res.ok) return [];
      const json = await res.json();
      return (json.items || []) as EditableTransactionItem[];
    }
  });

  if (!holding) return null;

  const formatNative = (val: number) =>
    holding.market === 'US' ? formatUSD(val) : formatBRL(val);

  const syncAll = async () => {
    await queryClient.invalidateQueries({ queryKey: ['portfolio-snapshot'] });
    await refetchTx();
    onSuccess();
  };

  const handleDeleteSingleTx = async (txId: number) => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(`/api/portfolio/transactions?id=${txId}`, {
        method: 'DELETE'
      });
      if (!res.ok) {
        setError('Falha ao excluir o lançamento.');
        return;
      }
      setConfirmDeleteTxId(null);
      // Se era o último lançamento de compra/custódia, fecha o modal após atualizar
      const remainingCustody = txList.filter((t) => t.id !== txId && t.type !== 'event');
      await syncAll();
      if (remainingCustody.length === 0) {
        onClose();
      }
    } finally {
      setBusy(false);
    }
  };

  const handleSaveConsolidated = async (e: React.FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const res = await fetch('/api/portfolio/transactions', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          assetCode: holding.code,
          categoryHint: holding.category,
          marketHint: holding.market,
          quantity: Number(adjQuantity),
          averagePrice: Number(adjAvgPrice),
          keepDividends
        })
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        setError(json.message || 'Não foi possível ajustar a posição.');
        return;
      }
      await syncAll();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  const handlePurgeEntireAsset = async () => {
    setBusy(true);
    setError('');
    try {
      const res = await fetch(
        `/api/portfolio/transactions?assetCode=${encodeURIComponent(holding.code)}`,
        { method: 'DELETE' }
      );
      if (!res.ok) {
        setError('Não foi possível apagar o ativo.');
        return;
      }
      await queryClient.invalidateQueries({ queryKey: ['portfolio-snapshot'] });
      onSuccess();
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="manage-holding-title"
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
      >
        <Card className="relative w-full max-w-2xl p-6">
          <button
            type="button"
            aria-label="Fechar gerenciamento do ativo"
            onClick={onClose}
            className="absolute right-4 top-4 text-slate-400 hover:text-white"
          >
            <X className="h-5 w-5" />
          </button>

          <div className="mb-4">
            <div className="flex flex-wrap items-center gap-2">
              <h2 id="manage-holding-title" className="text-lg font-extrabold text-white">
                {holding.code}
              </h2>
              {holding.name.toUpperCase() !== holding.code.toUpperCase() && (
                <span className="text-sm font-medium text-slate-300">— {holding.name}</span>
              )}
              <Badge tone="gold">{holding.quantity} cotas</Badge>
              <Badge tone="slate">PM {formatNative(holding.averagePrice)}</Badge>
            </div>
            <p className="mt-1 text-xs text-slate-400">
              Corrija aportes lançados com erro ou apague o registro sem gerar venda fiscal fictícia na carteira.
            </p>
          </div>

          {/* Abas de Gerenciamento */}
          <div className="mb-4 flex flex-wrap gap-2 border-b border-slate-800 pb-3">
            <button
              type="button"
              onClick={() => setActiveTab('transactions')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'transactions'
                  ? 'bg-gold-500 text-obsidian-950'
                  : 'bg-obsidian-950 text-slate-300 hover:text-white'
              }`}
            >
              Lançamentos ({txList.length})
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('adjust')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'adjust'
                  ? 'bg-gold-500 text-obsidian-950'
                  : 'bg-obsidian-950 text-slate-300 hover:text-white'
              }`}
            >
              Ajustar Cotas & Preço Médio
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('delete')}
              className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
                activeTab === 'delete'
                  ? 'bg-rose-500 text-white'
                  : 'border border-rose-500/30 bg-rose-500/10 text-rose-300 hover:bg-rose-500/20'
              }`}
            >
              Apagar Ativo da Carteira
            </button>
          </div>

          {activeTab === 'transactions' && (
            <div className="max-h-72 overflow-y-auto pr-1">
              {isLoading ? (
                <Skeleton className="h-32" />
              ) : txList.length === 0 ? (
                <p className="py-8 text-center text-xs text-slate-400">
                  Nenhum lançamento encontrado para {holding.code}.
                </p>
              ) : (
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-slate-800 text-slate-400">
                    <tr>
                      <th className="pb-2 font-semibold">Data</th>
                      <th className="pb-2 font-semibold">Tipo</th>
                      <th className="pb-2 text-right font-semibold">Qtd</th>
                      <th className="pb-2 text-right font-semibold">Preço Unit.</th>
                      <th className="pb-2 text-right font-semibold">Total</th>
                      <th className="pb-2 text-right font-semibold">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-800/60">
                    {txList.map((tx) => (
                      <tr key={tx.id} className="hover:bg-obsidian-800/40">
                        <td className="money-value py-2.5 text-slate-300">{tx.executedDate}</td>
                        <td className="py-2.5">
                          {tx.type === 'event' ? (
                            <Badge tone="purple">Provento</Badge>
                          ) : tx.type === 'sell' ? (
                            <Badge tone="rose">Venda</Badge>
                          ) : (
                            <Badge tone="emerald">Compra</Badge>
                          )}
                        </td>
                        <td className="money-value py-2.5 text-right text-slate-200">
                          {tx.quantity}
                        </td>
                        <td className="money-value py-2.5 text-right text-slate-300">
                          {formatNative(tx.price)}
                        </td>
                        <td className="money-value py-2.5 text-right font-semibold text-white">
                          {formatNative(tx.totalValue)}
                        </td>
                        <td className="py-2.5 text-right">
                          {confirmDeleteTxId === tx.id ? (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                disabled={busy}
                                onClick={() => handleDeleteSingleTx(tx.id)}
                                className="rounded bg-rose-500 px-2 py-0.5 text-[11px] font-bold text-white hover:bg-rose-400"
                              >
                                Excluir
                              </button>
                              <button
                                type="button"
                                onClick={() => setConfirmDeleteTxId(null)}
                                className="rounded border border-slate-700 px-2 py-0.5 text-[11px] text-slate-300 hover:text-white"
                              >
                                Não
                              </button>
                            </div>
                          ) : (
                            <div className="inline-flex items-center gap-1.5">
                              <button
                                type="button"
                                aria-label={`Editar lançamento ${tx.id}`}
                                onClick={() => setEditingTx(tx)}
                                className="rounded-md border border-slate-700/80 bg-obsidian-950 p-1.5 text-slate-300 hover:border-gold-500/50 hover:text-gold-300"
                              >
                                <Pencil className="h-3.5 w-3.5" />
                              </button>
                              <button
                                type="button"
                                aria-label={`Apagar lançamento ${tx.id}`}
                                onClick={() => setConfirmDeleteTxId(tx.id)}
                                className="rounded-md border border-slate-700/80 bg-obsidian-950 p-1.5 text-slate-400 hover:border-rose-500/50 hover:text-rose-400"
                              >
                                <Trash2 className="h-3.5 w-3.5" />
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          )}

          {activeTab === 'adjust' && (
            <form onSubmit={handleSaveConsolidated} className="space-y-4">
              <p className="text-xs text-slate-300">
                Substitui os lançamentos de compra/venda de <strong>{holding.code}</strong> pela quantidade total e preço médio exatos abaixo, sem registrar venda na carteira:
              </p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label htmlFor="adj-qty" className="mb-1 block text-xs text-slate-300">
                    Quantidade Total de Cotas
                  </label>
                  <Input
                    id="adj-qty"
                    type="number"
                    step="any"
                    min="0.0001"
                    required
                    value={adjQuantity}
                    onChange={(e) => setAdjQuantity(e.target.value)}
                  />
                </div>
                <div>
                  <label htmlFor="adj-pm" className="mb-1 block text-xs text-slate-300">
                    Preço Médio Unitário ({holding.market === 'US' ? 'US$' : 'R$'})
                  </label>
                  <Input
                    id="adj-pm"
                    type="number"
                    step="any"
                    min="0"
                    required
                    value={adjAvgPrice}
                    onChange={(e) => setAdjAvgPrice(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center gap-2">
                <input
                  id="adj-keep-div"
                  type="checkbox"
                  checked={keepDividends}
                  onChange={(e) => setKeepDividends(e.target.checked)}
                  className="h-4 w-4 rounded border-slate-700 bg-obsidian-950 accent-gold-500"
                />
                <label htmlFor="adj-keep-div" className="text-xs text-slate-300">
                  Preservar proventos/dividendos já recebidos deste ativo
                </label>
              </div>

              <div className="flex justify-end gap-2 pt-1">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancelar
                </Button>
                <Button type="submit" variant="gold" size="sm" disabled={busy}>
                  {busy ? 'Salvando...' : 'Salvar Posição Consolidada'}
                </Button>
              </div>
            </form>
          )}

          {activeTab === 'delete' && (
            <div className="space-y-4 rounded-xl border border-rose-500/35 bg-rose-500/10 p-4">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-rose-400" />
                <div className="space-y-1 text-xs">
                  <p className="font-bold text-white">
                    Confirmar exclusão definitiva de {holding.code}?
                  </p>
                  <p className="text-slate-300">
                    Todos os <strong>{txList.length || 1} lançamento(s)</strong> deste ativo serão apagados permanentemente do banco de dados. O ativo simplesmente deixará de existir na carteira e no histórico, sem gerar venda ou lucro/prejuízo artificial.
                  </p>
                </div>
              </div>

              <div className="flex justify-end gap-2">
                <Button type="button" variant="outline" size="sm" onClick={onClose}>
                  Cancelar
                </Button>
                <Button
                  type="button"
                  variant="danger"
                  size="sm"
                  disabled={busy}
                  onClick={handlePurgeEntireAsset}
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  {busy ? 'Apagando...' : `Sim, Apagar ${holding.code}`}
                </Button>
              </div>
            </div>
          )}

          {error && <p className="mt-3 text-xs text-rose-400">{error}</p>}
        </Card>
      </div>

      <EditTransactionModal
        transaction={editingTx}
        onClose={() => setEditingTx(null)}
        onSuccess={() => {
          syncAll();
        }}
      />
    </>
  );
}
