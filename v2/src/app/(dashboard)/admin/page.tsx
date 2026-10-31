'use client';

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { Eye, KeyRound, UserPlus, ShieldAlert } from 'lucide-react';
import { Button, Card, Input, Select, Badge, Skeleton } from '@/components/ui/primitives';

interface AdminUserRow {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: string;
  status: string;
  planPeriod: string;
  totpEnabled: boolean;
  transactionsCount: number;
}

interface AuditLogRow {
  id: number;
  action: string;
  actorLabel: string;
  targetLabel: string | null;
  ipAddress: string | null;
  createdAt: string;
}

export default function AdminCompliancePage() {
  const router = useRouter();
  const queryClient = useQueryClient();
  const [tab, setTab] = useState<'users' | 'audit'>('users');
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [planPeriod, setPlanPeriod] = useState('1_year');
  const [role, setRole] = useState('user');
  const [feedback, setFeedback] = useState('');

  const usersQuery = useQuery<{ users: AdminUserRow[] }>({
    queryKey: ['admin-users'],
    queryFn: async () => {
      const res = await fetch('/api/admin/users');
      if (!res.ok) throw new Error('Acesso restrito');
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

  const handleCreateUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback('');
    const res = await fetch('/api/admin/users', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, email, password, role, planPeriod })
    });
    const data = await res.json();
    if (!res.ok) {
      setFeedback(`Erro: ${data.message || 'Falha ao cadastrar cliente.'}`);
      return;
    }
    setName('');
    setEmail('');
    setPassword('');
    setFeedback('✓ Cliente Private cadastrado com sucesso!');
    await usersQuery.refetch();
  };

  const handleAuditClient = async (targetUserId: number) => {
    const res = await fetch('/api/admin/impersonate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ targetUserId })
    });
    if (res.ok) {
      await queryClient.invalidateQueries({ queryKey: ['portfolio-snapshot'] });
      router.push('/');
    }
  };

  const handleReset2FA = async (targetId: number, targetName: string) => {
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: targetId, reset2FA: true })
    });
    if (res.ok) {
      setFeedback(`✓ 2FA de ${targetName} resetado com registro em Compliance.`);
      await usersQuery.refetch();
    }
  };

  const handleToggleStatus = async (u: AdminUserRow) => {
    const nextStatus = u.status === 'active' ? 'suspended' : 'active';
    const res = await fetch('/api/admin/users', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: u.id, status: nextStatus })
    });
    if (res.ok) {
      await usersQuery.refetch();
    }
  };

  if (usersQuery.isLoading) {
    return <Skeleton className="h-96" />;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white">Gestão Private & Compliance</h1>
          <p className="text-xs text-slate-400">
            Administração de clientes, Modo Auditoria Seguro (HttpOnly) e Trilha Imutável LGPD.
          </p>
        </div>

        <div className="flex rounded-xl border border-slate-800 bg-obsidian-900 p-1 text-xs">
          <button
            type="button"
            onClick={() => setTab('users')}
            className={`rounded-lg px-3.5 py-1.5 font-semibold ${
              tab === 'users' ? 'bg-gold-500 text-obsidian-950' : 'text-slate-400'
            }`}
          >
            Clientes ({usersQuery.data?.users.length ?? 0})
          </button>
          <button
            type="button"
            onClick={() => setTab('audit')}
            className={`rounded-lg px-3.5 py-1.5 font-semibold ${
              tab === 'audit' ? 'bg-gold-500 text-obsidian-950' : 'text-slate-400'
            }`}
          >
            Trilha de Auditoria
          </button>
        </div>
      </div>

      {feedback && (
        <div className="rounded-xl border border-gold-500/30 bg-gold-500/10 p-3 text-xs font-semibold text-gold-300">
          {feedback}
        </div>
      )}

      {tab === 'users' ? (
        <>
          {/* Cadastro Rápido de Cliente */}
          <Card>
            <h2 className="mb-3 flex items-center gap-2 text-sm font-bold text-white">
              <UserPlus className="h-4 w-4 text-gold-400" />
              Cadastrar Novo Investidor / Consultor
            </h2>
            <form onSubmit={handleCreateUser} className="grid items-end gap-3 sm:grid-cols-6">
              <div>
                <label htmlFor="adm-name" className="mb-1 block text-[11px] text-slate-400">
                  Nome
                </label>
                <Input
                  id="adm-name"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Nome do cliente"
                />
              </div>
              <div>
                <label htmlFor="adm-email" className="mb-1 block text-[11px] text-slate-400">
                  E-mail / Login
                </label>
                <Input
                  id="adm-email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@email.com"
                />
              </div>
              <div>
                <label htmlFor="adm-pwd" className="mb-1 block text-[11px] text-slate-400">
                  Senha Inicial
                </label>
                <Input
                  id="adm-pwd"
                  type="password"
                  minLength={6}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Mín. 6 dígitos"
                />
              </div>
              <div>
                <label htmlFor="adm-plan" className="mb-1 block text-[11px] text-slate-400">
                  Assinatura
                </label>
                <Select
                  id="adm-plan"
                  value={planPeriod}
                  onChange={(e) => setPlanPeriod(e.target.value)}
                >
                  <option value="1_month">Mensal</option>
                  <option value="3_months">Trimestral</option>
                  <option value="6_months">Semestral</option>
                  <option value="1_year">Anual</option>
                  <option value="lifetime">Vitalício Private</option>
                </Select>
              </div>
              <div>
                <label htmlFor="adm-role" className="mb-1 block text-[11px] text-slate-400">
                  Perfil
                </label>
                <Select id="adm-role" value={role} onChange={(e) => setRole(e.target.value)}>
                  <option value="user">Investidor</option>
                  <option value="collaborator">Consultor / Colab.</option>
                  <option value="admin">Administrador</option>
                </Select>
              </div>
              <Button type="submit" variant="gold">
                Criar Conta
              </Button>
            </form>
          </Card>

          {/* Lista de Clientes */}
          <Card>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="border-b border-slate-800 text-slate-400">
                  <tr>
                    <th className="pb-3 font-semibold">Cliente / UUID</th>
                    <th className="pb-3 font-semibold">Perfil</th>
                    <th className="pb-3 font-semibold">Plano</th>
                    <th className="pb-3 font-semibold">2FA</th>
                    <th className="pb-3 text-right font-semibold">Registros</th>
                    <th className="pb-3 text-right font-semibold">Ações de Gestão</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800/60">
                  {(usersQuery.data?.users || []).map((u) => (
                    <tr key={u.id} className="hover:bg-obsidian-800/40">
                      <td className="py-3">
                        <div className="font-bold text-white">{u.name}</div>
                        <div className="text-[11px] text-slate-400">{u.email}</div>
                        <code className="text-[10px] text-slate-500">{u.uuid.slice(0, 13)}…</code>
                      </td>
                      <td className="py-3">
                        <Badge tone={u.role === 'admin' ? 'gold' : u.role === 'collaborator' ? 'sky' : 'slate'}>
                          {u.role}
                        </Badge>
                      </td>
                      <td className="py-3 text-slate-300">{u.planPeriod}</td>
                      <td className="py-3">
                        <Badge tone={u.totpEnabled ? 'emerald' : 'slate'}>
                          {u.totpEnabled ? '2FA Ativo' : 'Padrão'}
                        </Badge>
                      </td>
                      <td className="money-value py-3 text-right text-slate-300">
                        {u.transactionsCount}
                      </td>
                      <td className="py-3 text-right">
                        <div className="inline-flex flex-wrap justify-end gap-1.5">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => handleAuditClient(u.id)}
                          >
                            <Eye className="h-3.5 w-3.5 text-gold-400" />
                            Auditar Carteira
                          </Button>

                          {u.totpEnabled && (
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => handleReset2FA(u.id, u.name)}
                            >
                              <KeyRound className="h-3.5 w-3.5 text-sky-400" />
                              Reset 2FA
                            </Button>
                          )}

                          <Button
                            size="sm"
                            variant={u.status === 'active' ? 'danger' : 'emerald'}
                            onClick={() => handleToggleStatus(u)}
                          >
                            <ShieldAlert className="h-3.5 w-3.5" />
                            {u.status === 'active' ? 'Suspender' : 'Reativar'}
                          </Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      ) : (
        <Card>
          <h2 className="mb-3 text-base font-bold text-white">
            Trilha Imutável de Auditoria & Segurança
          </h2>
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
                  <tr key={log.id}>
                    <td className="money-value py-2.5 text-slate-400">
                      {new Date(log.createdAt).toLocaleString('pt-BR')}
                    </td>
                    <td className="py-2.5 font-mono text-[11px] font-semibold text-gold-300">
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
    </div>
  );
}
