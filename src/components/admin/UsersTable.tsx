'use client';

import React from 'react';
import {
  FolderSearch,
  LogIn,
  Edit3,
  Trash2,
  Crown,
  Wrench,
  User as UserIcon,
  ShieldCheck
} from 'lucide-react';
import { AdminUserData } from './EditUserModal';

interface UsersTableProps {
  users: AdminUserData[];
  currentUserId: number;
  isCurrentUserAdmin: boolean;
  onInspect: (user: AdminUserData) => void;
  onImpersonate: (user: AdminUserData) => void;
  onEdit: (user: AdminUserData) => void;
  onDelete: (user: AdminUserData) => void;
  onToggleStatus: (user: AdminUserData) => void;
}

export function getPlanLabel(period: string): string {
  switch (period) {
    case '1_month':
      return '1 Mês';
    case '3_months':
      return '3 Meses';
    case '6_months':
      return '6 Meses';
    case '1_year':
      return '1 Ano';
    case 'lifetime':
    default:
      return 'Vitalício';
  }
}

export function UsersTable({
  users,
  currentUserId,
  isCurrentUserAdmin,
  onInspect,
  onImpersonate,
  onEdit,
  onDelete,
  onToggleStatus
}: UsersTableProps) {
  const isExpired = (expiresAt: string | null) => {
    if (!expiresAt) return false;
    return new Date(expiresAt).getTime() < Date.now();
  };

  return (
    <div className="overflow-x-auto rounded-xl border border-slate-800 bg-[#0d1527]">
      <table className="w-full text-left text-xs">
        <thead className="border-b border-slate-800 text-[11px] font-bold uppercase tracking-wider text-slate-400">
          <tr>
            <th className="px-4 py-3.5">/ E-mail</th>
            <th className="px-4 py-3.5">Perfil</th>
            <th className="px-4 py-3.5">Plano & Validade</th>
            <th className="px-4 py-3.5">Status</th>
            <th className="px-4 py-3.5">Último Acesso</th>
            <th className="px-4 py-3.5">Transações</th>
            <th className="px-4 py-3.5 text-right">Ações</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-800/60">
          {users.map((u) => {
            const isSelf = u.id === currentUserId;
            const isMaster = u.id === 1;
            const cannotModify = !isCurrentUserAdmin && (u.role === 'admin' || isMaster);
            const expired = isExpired(u.planExpiresAt);

            return (
              <tr key={u.id} className="hover:bg-slate-800/30 transition-colors">
                {/* Nome e E-mail */}
                <td className="px-4 py-3">
                  <div className="flex items-center gap-3">
                    <div
                      className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl font-bold text-sm ${
                        u.role === 'admin'
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                          : u.role === 'collaborator'
                            ? 'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                            : 'bg-sky-500/20 text-sky-300 border border-sky-500/30'
                      }`}
                    >
                      {u.name?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div>
                      <div className="flex items-center gap-1.5 font-bold text-white">
                        <span>{u.name}</span>
                        {isMaster && (
                          <span className="rounded bg-amber-500/20 px-1.5 py-0.5 text-[10px] font-bold text-amber-300 border border-amber-500/30">
                            Master
                          </span>
                        )}
                        {isSelf && (
                          <span className="rounded bg-emerald-500/20 px-1.5 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
                            Você
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-400">{u.email}</div>
                    </div>
                  </div>
                </td>

                {/* Perfil */}
                <td className="px-4 py-3">
                  {u.role === 'admin' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-xs font-semibold text-amber-300">
                      <Crown className="h-3.5 w-3.5" />
                      Admin
                    </span>
                  ) : u.role === 'collaborator' ? (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-purple-500/30 bg-purple-500/10 px-2.5 py-1 text-xs font-semibold text-purple-300">
                      <Wrench className="h-3.5 w-3.5" />
                      Colaborador
                    </span>
                  ) : (
                    <span className="inline-flex items-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 px-2.5 py-1 text-xs font-semibold text-sky-300">
                      <UserIcon className="h-3.5 w-3.5" />
                      Investidor
                    </span>
                  )}
                </td>

                {/* Plano & Validade */}
                <td className="px-4 py-3">
                  <div className="flex flex-col">
                    <span className="font-semibold text-slate-200">
                      {getPlanLabel(u.planPeriod)}
                    </span>
                    {u.planPeriod !== 'lifetime' && u.planExpiresAt && (
                      <span
                        className={`text-[10px] ${
                          expired ? 'font-bold text-rose-400' : 'text-slate-400'
                        }`}
                      >
                        {expired ? '⚠️ Expirou em: ' : 'Expira: '}
                        {new Date(u.planExpiresAt).toLocaleDateString('pt-BR')}
                      </span>
                    )}
                  </div>
                </td>

                {/* Status */}
                <td className="px-4 py-3">
                  <button
                    type="button"
                    onClick={() => !cannotModify && onToggleStatus(u)}
                    disabled={cannotModify}
                    title={
                      cannotModify
                        ? 'Você não pode alterar o status deste usuário'
                        : 'Clique para alternar o status (Ativo / Suspenso / Inativo)'
                    }
                    className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold transition-all ${
                      u.status === 'active'
                        ? 'border border-emerald-500/40 bg-emerald-500/20 text-emerald-300 hover:bg-emerald-500/30'
                        : u.status === 'suspended'
                          ? 'border border-amber-500/40 bg-amber-500/20 text-amber-300 hover:bg-amber-500/30'
                          : 'border border-rose-500/40 bg-rose-500/20 text-rose-300 hover:bg-rose-500/30'
                    } ${cannotModify ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'}`}
                  >
                    <span>
                      {u.status === 'active' ? '●' : u.status === 'suspended' ? '⏸' : '○'}
                    </span>
                    <span>
                      {u.status === 'active'
                        ? 'Ativo'
                        : u.status === 'suspended'
                          ? 'Suspenso'
                          : 'Inativo'}
                    </span>
                  </button>
                </td>

                {/* Último Acesso */}
                <td className="px-4 py-3 text-slate-400 font-mono text-[11px]">
                  {u.lastLoginAt
                    ? new Date(u.lastLoginAt).toLocaleString('pt-BR', {
                        dateStyle: 'short',
                        timeStyle: 'short'
                      })
                    : '-'}
                </td>

                {/* Transações */}
                <td className="px-4 py-3">
                  <span className="inline-flex rounded-lg border border-slate-700/60 bg-slate-800/50 px-2.5 py-1 font-mono text-xs text-slate-300">
                    {u.transactionsCount || 0} ordens
                  </span>
                </td>

                {/* Ações */}
                <td className="px-4 py-3 text-right">
                  <div className="inline-flex items-center justify-end gap-1.5">
                    {/* Auditar Carteira */}
                    <button
                      type="button"
                      onClick={() => onInspect(u)}
                      title="Auditar Carteira e Ordens"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-[#111c34] text-slate-300 hover:border-gold-500/50 hover:text-gold-400 transition-colors"
                      aria-label="Auditar Carteira"
                    >
                      <FolderSearch className="h-4 w-4" />
                    </button>

                    {/* Entrar como usuário / Impersonate */}
                    <button
                      type="button"
                      onClick={() => onImpersonate(u)}
                      title="Entrar na Conta (Ações ficarão registradas na Trilha de Auditoria)"
                      className="flex h-8 w-8 items-center justify-center rounded-lg border border-sky-500/30 bg-sky-500/10 text-sky-400 hover:bg-sky-500/20 transition-colors"
                      aria-label="Entrar na Conta"
                    >
                      <LogIn className="h-4 w-4" />
                    </button>

                    {/* Editar Usuário */}
                    <button
                      type="button"
                      onClick={() => onEdit(u)}
                      disabled={cannotModify}
                      title={
                        cannotModify
                          ? 'Apenas Superusuários podem editar esta conta'
                          : 'Editar Status, Permissões e Tempo de Uso'
                      }
                      className={`flex h-8 w-8 items-center justify-center rounded-lg border border-slate-700/60 bg-[#111c34] text-slate-300 hover:border-emerald-500/50 hover:text-emerald-400 transition-colors ${
                        cannotModify ? 'cursor-not-allowed opacity-40' : ''
                      }`}
                      aria-label="Editar Usuário"
                    >
                      <Edit3 className="h-4 w-4" />
                    </button>

                    {/* Excluir Usuário */}
                    {!cannotModify && !isMaster && !isSelf && (
                      <button
                        type="button"
                        onClick={() => onDelete(u)}
                        title="Excluir Usuário"
                        className="flex h-8 w-8 items-center justify-center rounded-lg border border-rose-500/30 bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition-colors"
                        aria-label="Excluir Usuário"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
