'use client';

import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { X, FolderSearch, LogIn, Loader2, AlertCircle } from 'lucide-react';
import { AdminUserData } from './EditUserModal';

interface TransactionRow {
  id: number;
  assetCode: string;
  type: string;
  quantity: number;
  price: number;
  totalValue: number;
  executedDate: string;
  notes: string | null;
}

interface InspectPortfolioResponse {
  user: AdminUserData;
  totalTransactions: number;
  totalInvested: number;
  transactions: TransactionRow[];
}

interface InspectPortfolioModalProps {
  user: AdminUserData;
  onClose: () => void;
  onImpersonate: (user: AdminUserData) => void;
}

export function InspectPortfolioModal({
  user,
  onClose,
  onImpersonate
}: InspectPortfolioModalProps) {
  const { data, isLoading, error } = useQuery<InspectPortfolioResponse>({
    queryKey: ['admin-inspect-portfolio', user.id],
    queryFn: async () => {
      const res = await fetch(`/api/admin/users/${user.id}/portfolio`);
      if (!res.ok) throw new Error('Falha ao carregar carteira do usuário.');
      return res.json();
    }
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-3xl rounded-2xl border border-slate-700/60 bg-[#0d1527] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400">
              <FolderSearch className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white">Carteira de {user.name}</h2>
              <p className="text-xs text-slate-400">
                Login: {user.email} • ID #{user.id} • UUID: {user.uuid.slice(0, 13)}…
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Métricas rápidas */}
        <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-2">
          <div className="rounded-xl border border-slate-800 bg-[#111c34] p-3">
            <span className="text-xs text-slate-400">Total de Ordens Registradas</span>
            <div className="mt-0.5 text-lg font-extrabold text-white">
              {data?.totalTransactions ?? user.transactionsCount} ordens
            </div>
          </div>
          <div className="rounded-xl border border-slate-800 bg-[#111c34] p-3">
            <span className="text-xs text-slate-400">Total Aportado em Compras</span>
            <div className="mt-0.5 text-lg font-extrabold text-emerald-400">
              R${' '}
              {Number(data?.totalInvested ?? user.totalInvested ?? 0).toLocaleString('pt-BR', {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2
              })}
            </div>
          </div>
        </div>

        {/* Corpo: Tabela de Transações */}
        <div className="mt-4">
          <h3 className="mb-2 text-xs font-bold uppercase tracking-wider text-slate-400">
            Lançamentos e Ordens Cadastradas
          </h3>

          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-12 text-slate-400">
              <Loader2 className="h-6 w-6 animate-spin text-emerald-400 mb-2" />
              <p className="text-xs">Consultando ordens no banco de dados...</p>
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-4 text-xs font-semibold text-rose-300">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>Falha ao consultar movimentações financeiras deste investidor.</span>
            </div>
          ) : !data?.transactions || data.transactions.length === 0 ? (
            <div className="rounded-xl border border-dashed border-slate-800 py-10 text-center text-xs text-slate-400">
              Este usuário ainda não possui ordens ou ativos cadastrados na carteira.
            </div>
          ) : (
            <div className="max-h-72 overflow-y-auto rounded-xl border border-slate-800 bg-[#111c34]/50">
              <table className="w-full text-left text-xs">
                <thead className="sticky top-0 border-b border-slate-800 bg-[#0d1527] text-slate-400">
                  <tr>
                    <th className="px-3.5 py-2.5 font-semibold">Ativo</th>
                    <th className="px-3.5 py-2.5 font-semibold">Tipo</th>
                    <th className="px-3.5 py-2.5 text-right font-semibold">Qtd</th>
                    <th className="px-3.5 py-2.5 text-right font-semibold">Preço</th>
                    <th className="px-3.5 py-2.5 text-right font-semibold">Total</th>
                    <th className="px-3.5 py-2.5 text-right font-semibold">Data</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60 text-slate-300">
                  {data.transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-slate-800/40">
                      <td className="px-3.5 py-2 font-bold text-white">{tx.assetCode}</td>
                      <td className="px-3.5 py-2">
                        <span
                          className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-bold ${
                            tx.type === 'buy' || tx.type === 'aporte'
                              ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                              : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                          }`}
                        >
                          {tx.type === 'buy' ? 'Compra' : tx.type === 'sell' ? 'Venda' : tx.type}
                        </span>
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono">{tx.quantity}</td>
                      <td className="px-3.5 py-2 text-right font-mono">
                        R$ {tx.price.toFixed(2)}
                      </td>
                      <td className="px-3.5 py-2 text-right font-mono font-semibold text-white">
                        R$ {tx.totalValue.toFixed(2)}
                      </td>
                      <td className="px-3.5 py-2 text-right text-slate-400 font-mono">
                        {tx.executedDate}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Rodapé com botões de ação */}
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 border-t border-slate-800 pt-4">
          <button
            type="button"
            onClick={() => onImpersonate(user)}
            className="inline-flex items-center gap-2 rounded-xl border border-sky-500/30 bg-sky-500/10 px-4 py-2 text-xs font-bold text-sky-300 hover:bg-sky-500/20 transition-colors"
          >
            <LogIn className="h-4 w-4" />
            Entrar na Conta em Modo Auditoria (Zero-Trust)
          </button>

          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-slate-700 bg-[#243048] px-5 py-2 text-xs font-semibold text-slate-200 hover:bg-[#334155] transition-colors"
          >
            Fechar Auditoria
          </button>
        </div>
      </div>
    </div>
  );
}
