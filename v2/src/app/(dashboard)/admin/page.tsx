'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import {
  Shield,
  UserPlus,
  RefreshCw,
  Search,
  KeyRound,
  Eye
} from 'lucide-react';
import { Skeleton, Card } from '@/components/ui/primitives';
import { AdminUserData, EditUserModal } from '@/components/admin/EditUserModal';
import { CreateUserModal } from '@/components/admin/CreateUserModal';
import { InspectPortfolioModal } from '@/components/admin/InspectPortfolioModal';
import { UsersTable } from '@/components/admin/UsersTable';
import { AdminStatsCards } from '@/components/admin/AdminStatsCards';

interface AuditLogRow {
  id: number;
  action: string;
  actorLabel: string;
  targetLabel: string | null;
  ipAddress: string | null;
  createdAt: string;
}

interface AdminUsersResponse {
  currentUser: AdminUserData;
  users: AdminUserData[];
}

export default function AdminCompliancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'users' | 'audit'>('users');
  const [search, setSearch] = useState('');
  const [feedback, setFeedback] = useState('');

  // Modais
  const [editingUser, setEditingUser] = useState<AdminUserData | null>(null);
  const [inspectingUser, setInspectingUser] = useState<AdminUserData | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  const usersQuery = useQuery<AdminUsersResponse>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Acesso restrito a administradores');
      return res.json();
    }
  });

  const logsQuery = useQuery<{ logs: AuditLogRow[] }>({
    queryKey: ['admin-audit-logs'],
    enabled: tab === 'audit',
    queryFn: async () => {
      const res = await fetch('/api/admin/audit-logs');
      return res.json();
    }
  });

  const currentUser = usersQuery.data?.currentUser;
  const isCurrentUserAdmin = currentUser?.role === 'admin';
  const allUsers = usersQuery.data?.users || [];

  const filteredUsers = allUsers.filter(
    (u) =>
      u.name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase()) ||
      u.role.toLowerCase().includes(search.toLowerCase()) ||
      String(u.id).includes(search)
  );

  const handleImpersonate = async (targetUser: AdminUserData) => {
    try {
      const res = await fetch('/api/admin/impersonate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUserId: targetUser.id })
      });
      if (res.ok) {
        await queryClient.invalidateQueries({ queryKey: ['portfolio-snapshot'] });
        router.push('/carteira');
      } else {
        const d = await res.json();
        setFeedback(`Erro ao entrar na conta: ${d.message || 'Operação não autorizada.'}`);
      }
    } catch {
      setFeedback('Erro de conexão ao alternar de usuário.');
    }
  };

  const handleToggleStatus = async (user: AdminUserData) => {
    let nextStatus = 'active';
    if (user.status === 'active') nextStatus = 'suspended';
    else if (user.status === 'suspended') nextStatus = 'inactive';
    else nextStatus = 'active';

    const statusLabels: Record<string, string> = {
      active: 'Ativo',
      suspended: 'Suspenso',
      inactive: 'Inativo'
    };

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, status: nextStatus })
      });
      if (res.ok) {
        setFeedback(`✓ Status de ${user.name} alterado para ${statusLabels[nextStatus]}.`);
        await usersQuery.refetch();
      } else {
        const d = await res.json();
        setFeedback(`Erro: ${d.message || 'Falha ao alterar status.'}`);
      }
    } catch {
      setFeedback('Erro de conexão ao alterar status.');
    }
  };

  const handleDeleteUser = async (user: AdminUserData) => {
    if (user.id === 1) {
      alert('Não é permitido excluir o Administrador Master.');
      return;
    }

    if (!window.confirm(`Tem certeza que deseja excluir permanentemente o usuário "${user.name}" (${user.email})?`)) {
      return;
    }

    try {
      const res = await fetch(`/api/admin/users?id=${user.id}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setFeedback(`✓ Usuário ${user.name} removido com sucesso.`);
        await usersQuery.refetch();
      } else {
        const d = await res.json();
        setFeedback(`Erro ao excluir: ${d.message || 'Falha na exclusão.'}`);
      }
    } catch {
      setFeedback('Erro de conexão ao excluir usuário.');
    }
  };

  if (usersQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-16 w-full rounded-2xl" />
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-4">
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
          <Skeleton className="h-28 rounded-2xl" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Topo do Painel */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-700/60 bg-[#111c34] text-emerald-400">
            <Shield className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-2xl font-extrabold text-white">
              {currentUser?.role === 'collaborator'
                ? 'Painel de Suporte & Gestão (TI)'
                : 'Painel do Superusuário'}
            </h1>
            <p className="text-xs text-slate-400">
              {currentUser?.role === 'collaborator'
                ? 'Atendimento a investidores: alteração de senhas, inclusão de usuários e auditoria de carteiras.'
                : 'Gerencie investidores, colaboradores, planos de renovação e audite o banco de dados.'}
            </p>
          </div>
        </div>

        {/* Ações do Topo */}
        <div className="flex items-center gap-2.5">
          <button
            type="button"
            onClick={() => usersQuery.refetch()}
            title="Atualizar Lista"
            className="flex h-10 w-10 items-center justify-center rounded-xl border border-slate-800 bg-[#0d1527] text-slate-300 hover:text-white transition-colors"
            aria-label="Atualizar Lista"
          >
            <RefreshCw
              className={`h-4 w-4 ${usersQuery.isRefetching ? 'animate-spin text-emerald-400' : ''}`}
            />
          </button>

          <button
            type="button"
            onClick={() => setIsCreateOpen(true)}
            className="flex items-center gap-2 rounded-xl bg-[#10b981] px-4 py-2.5 text-xs font-bold text-white hover:bg-[#059669] shadow-lg shadow-emerald-500/20 transition-all"
          >
            <UserPlus className="h-4 w-4" />
            <span>Novo Usuário</span>
          </button>

          <div className="flex rounded-xl border border-slate-800 bg-[#0d1527] p-1 text-xs">
            <button
              type="button"
              onClick={() => setTab('users')}
              className={`rounded-lg px-3.5 py-1.5 font-semibold transition-colors ${
                tab === 'users' ? 'bg-[#10b981] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Clientes ({allUsers.length})
            </button>
            <button
              type="button"
              onClick={() => setTab('audit')}
              className={`rounded-lg px-3.5 py-1.5 font-semibold transition-colors ${
                tab === 'audit' ? 'bg-[#10b981] text-white shadow-sm' : 'text-slate-400 hover:text-white'
              }`}
            >
              Trilha de Auditoria
            </button>
          </div>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
          {feedback}
        </div>
      )}

      {tab === 'users' ? (
        <>
          {/* Métricas Principais */}
          <AdminStatsCards users={allUsers} />

          {/* Barra de Pesquisa */}
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-800 bg-[#0d1527] px-4 py-3">
            <div className="relative flex-1 min-w-[240px]">
              <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Pesquisar por nome, login/e-mail ou ID..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-slate-700/60 bg-[#111c34] pl-10 pr-4 py-2 text-xs text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              />
            </div>
            <div className="text-xs font-medium text-slate-400">
              {filteredUsers.length} de {allUsers.length} usuários
            </div>
          </div>

          {/* Tabela de Usuários */}
          <UsersTable
            users={filteredUsers}
            currentUserId={currentUser?.id ?? 0}
            isCurrentUserAdmin={isCurrentUserAdmin}
            onInspect={(u) => setInspectingUser(u)}
            onImpersonate={(u) => handleImpersonate(u)}
            onEdit={(u) => setEditingUser(u)}
            onDelete={(u) => handleDeleteUser(u)}
            onToggleStatus={(u) => handleToggleStatus(u)}
          />
        </>
      ) : (
        /* Trilha Imutável de Auditoria */
        <Card>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-base font-bold text-white">
                Trilha Imutável de Auditoria & Conformidade LGPD
              </h2>
              <p className="text-xs text-slate-400">
                Registro criptográfico e inviolável de todas as ações administrativas, acessos e alterações.
              </p>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-slate-800 text-slate-400">
                <tr>
                  <th className="pb-2.5 font-semibold">Data/Hora</th>
                  <th className="pb-2.5 font-semibold">Evento</th>
                  <th className="pb-2.5 font-semibold">Operador</th>
                  <th className="pb-2.5 font-semibold">Carteira Alvo</th>
                  <th className="pb-2.5 font-semibold">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60">
                {(logsQuery.data?.logs || []).map((log) => (
                  <tr key={log.id} className="hover:bg-slate-800/20">
                    <td className="py-2.5 font-mono text-slate-400">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 font-mono text-[11px] font-semibold text-emerald-400">
                      {log.action}
                    </td>
                    <td className="py-2.5 text-slate-200">{log.actorLabel}</td>
                    <td className="py-2.5 text-slate-300">{log.targetLabel || '—'}</td>
                    <td className="font-mono py-2.5 text-slate-500">{log.ipAddress || '—'}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {/* Modal de Edição de Usuário */}
      {editingUser && (
        <EditUserModal
          user={editingUser}
          isCurrentUserAdmin={isCurrentUserAdmin}
          onClose={() => setEditingUser(null)}
          onSuccess={async () => {
            setFeedback(`✓ Usuário ${editingUser.name} atualizado com sucesso!`);
            setEditingUser(null);
            await usersQuery.refetch();
          }}
        />
      )}

      {/* Modal de Cadastro de Novo Usuário */}
      {isCreateOpen && (
        <CreateUserModal
          isCurrentUserAdmin={isCurrentUserAdmin}
          onClose={() => setIsCreateOpen(false)}
          onSuccess={async () => {
            setFeedback('✓ Novo usuário cadastrado com sucesso!');
            setIsCreateOpen(false);
            await usersQuery.refetch();
          }}
        />
      )}

      {/* Modal de Inspeção / Auditoria de Carteira */}
      {inspectingUser && (
        <InspectPortfolioModal
          user={inspectingUser}
          onClose={() => setInspectingUser(null)}
          onImpersonate={(u) => {
            setInspectingUser(null);
            handleImpersonate(u);
          }}
        />
      )}
    </div>
  );
}
