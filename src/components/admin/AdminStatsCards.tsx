'use client';

import React from 'react';
import { Users, ShieldCheck, ArrowRightLeft, DollarSign } from 'lucide-react';
import { AdminUserData } from './EditUserModal';

interface AdminStatsCardsProps {
  users: AdminUserData[];
}

export function AdminStatsCards({ users }: AdminStatsCardsProps) {
  const totalUsers = users.length;
  const activeUsers = users.filter((u) => u.status === 'active').length;
  const suspendedUsers = users.filter((u) => u.status === 'suspended').length;
  const inactiveUsers = users.filter((u) => u.status === 'inactive').length;

  const totalTransactions = users.reduce((sum, u) => sum + (u.transactionsCount || 0), 0);
  const totalVolume = users.reduce((sum, u) => sum + (u.totalInvested || 0), 0);

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {/* Total de Usuários */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1527] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Total de Usuários</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
            <Users className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-extrabold text-white">{totalUsers}</div>
        <p className="mt-1 text-xs text-slate-400">{activeUsers} ativos no sistema</p>
      </div>

      {/* Status da Base */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1527] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Status da Base</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <ShieldCheck className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 flex items-baseline gap-2">
          <span className="text-2xl font-extrabold text-emerald-400">{activeUsers}</span>
          <span className="text-xs font-semibold text-amber-400">
            ({suspendedUsers} suspensos)
          </span>
        </div>
        <p className="mt-1 text-xs text-slate-400">{inactiveUsers} desfiliações / inativos</p>
      </div>

      {/* Total de Transações */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1527] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Total de Transações</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
            <ArrowRightLeft className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-extrabold text-purple-400">{totalTransactions}</div>
        <p className="mt-1 text-xs text-slate-400">Compras e vendas registradas</p>
      </div>

      {/* Volume Total Movimentado */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1527] p-5 shadow-sm">
        <div className="flex items-center justify-between">
          <span className="text-xs font-semibold text-slate-400">Volume Total Movimentado</span>
          <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-gold-500/10 text-gold-400">
            <DollarSign className="h-4 w-4" />
          </div>
        </div>
        <div className="mt-2 text-2xl font-extrabold text-gold-300">
          R${' '}
          {Number(totalVolume).toLocaleString('pt-BR', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
          })}
        </div>
        <p className="mt-1 text-xs text-slate-400">Total somado em carteiras</p>
      </div>
    </div>
  );
}
