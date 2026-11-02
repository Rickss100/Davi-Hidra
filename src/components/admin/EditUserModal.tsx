'use client';

import React, { useState } from 'react';
import { X, KeyRound, ShieldAlert, Check } from 'lucide-react';
import { Button } from '@/components/ui/primitives';

export interface AdminUserData {
  id: number;
  uuid: string;
  name: string;
  email: string;
  role: 'admin' | 'collaborator' | 'user';
  status: string;
  planPeriod: string;
  planExpiresAt: string | null;
  totpEnabled: boolean;
  lastLoginAt: string | null;
  transactionsCount: number;
  totalInvested?: number;
}

interface EditUserModalProps {
  user: AdminUserData;
  isCurrentUserAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function calculateExpiryDate(period: string): string {
  if (!period || period === 'lifetime') return '';
  const d = new Date();
  if (period === '1_month') d.setMonth(d.getMonth() + 1);
  else if (period === '3_months') d.setMonth(d.getMonth() + 3);
  else if (period === '6_months') d.setMonth(d.getMonth() + 6);
  else if (period === '1_year') d.setFullYear(d.getFullYear() + 1);
  return d.toISOString().split('T')[0] ?? '';
}

export function EditUserModal({
  user,
  isCurrentUserAdmin,
  onClose,
  onSuccess
}: EditUserModalProps) {
  const [name, setName] = useState(user.name);
  const [email, setEmail] = useState(user.email);
  const [password, setPassword] = useState('');
  const [role, setRole] = useState(user.role);
  const [status, setStatus] = useState(user.status);
  const [planPeriod, setPlanPeriod] = useState(user.planPeriod || 'lifetime');
  const [planExpiresAt, setPlanExpiresAt] = useState(
    user.planExpiresAt ? user.planExpiresAt.slice(0, 10) : ''
  );
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [feedback2FA, setFeedback2FA] = useState('');

  const isMasterUser = user.id === 1;

  const handlePeriodChange = (nextPeriod: string) => {
    setPlanPeriod(nextPeriod);
    if (nextPeriod === 'lifetime') {
      setPlanExpiresAt('');
    } else {
      setPlanExpiresAt(calculateExpiryDate(nextPeriod));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');

    try {
      const payload: Record<string, unknown> = {
        id: user.id,
        name: name.trim(),
        email: email.trim(),
        role,
        status,
        planPeriod,
        planExpiresAt: planPeriod === 'lifetime' ? null : (planExpiresAt || null)
      };

      if (password.trim().length > 0) {
        if (password.trim().length < 6) {
          setErrorMsg('A nova senha deve ter no mínimo 6 dígitos.');
          setSubmitting(false);
          return;
        }
        payload.password = password.trim();
      }

      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Falha ao salvar alterações do usuário.');
      }

      onSuccess();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao atualizar dados do usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  const handleReset2FA = async () => {
    if (!window.confirm(`Tem certeza que deseja resetar o 2FA (TOTP) de ${user.name}?`)) {
      return;
    }

    try {
      const res = await fetch('/api/admin/users', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id: user.id, reset2FA: true })
      });
      if (res.ok) {
        setFeedback2FA('✓ 2FA resetado com registro em Trilha de Auditoria.');
      } else {
        const d = await res.json();
        setErrorMsg(d.message || 'Erro ao resetar 2FA.');
      }
    } catch {
      setErrorMsg('Erro de conexão ao resetar 2FA.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/60 bg-[#0d1527] p-6 shadow-2xl">
        {/* Header do Modal */}
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <h2 className="text-lg font-bold text-white">
            Editar Usuário: {user.name}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
            aria-label="Fechar"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        {feedback2FA && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
            <Check className="h-4 w-4 shrink-0" />
            <span>{feedback2FA}</span>
          </div>
        )}

        {/* Formulário */}
        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Nome do Usuário
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-700/60 bg-[#111c34] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Login / E-mail
            </label>
            <input
              type="text"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700/60 bg-[#111c34] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div>
            <div className="mb-1.5 flex items-center justify-between">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400">
                Nova Senha
              </label>
              <button
                type="button"
                onClick={() => setPassword(email.trim().toLowerCase())}
                className="text-[11px] font-semibold text-emerald-400 hover:text-emerald-300 hover:underline flex items-center gap-1 transition-colors"
                title="Preenche a senha provisória com o e-mail do usuário"
              >
                ⚡ Usar E-mail como Senha Provisória
              </button>
            </div>
            <input
              type="text"
              placeholder="Digite a nova senha ou use o atalho acima..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700/60 bg-[#111c34] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors font-mono"
            />
            <p className="mt-1 text-[11px] text-slate-400">
              Deixe em branco para não alterar. Se preenchida, esta passará a ser a senha de acesso do usuário.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Papel
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'collaborator' | 'user')}
                disabled={isMasterUser}
                className="w-full rounded-xl border border-slate-700/60 bg-[#111c34] px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
              >
                <option value="user">Investidor Padrão</option>
                <option value="collaborator">Colaborador (TI / Suporte)</option>
                {isCurrentUserAdmin && <option value="admin">Administrador Superusuário</option>}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Status
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                disabled={isMasterUser}
                className="w-full rounded-xl border border-slate-700/60 bg-[#111c34] px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 disabled:opacity-50 transition-colors"
              >
                <option value="active">Ativo (Acesso Total)</option>
                <option value="suspended">Suspenso (Inadimplente - Bloqueio de Aportes)</option>
                <option value="inactive">Inativo (Desfiliado - Bloqueio de Login)</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className={planPeriod === 'lifetime' ? 'sm:col-span-2' : ''}>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Período do Plano
              </label>
              <select
                value={planPeriod}
                onChange={(e) => handlePeriodChange(e.target.value)}
                className="w-full rounded-xl border border-slate-700/60 bg-[#111c34] px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                <option value="lifetime">Vitalício (Sem Expiração)</option>
                <option value="1_month">1 Mês</option>
                <option value="3_months">3 Meses</option>
                <option value="6_months">6 Meses</option>
                <option value="1_year">1 Ano</option>
              </select>
            </div>

            {planPeriod !== 'lifetime' && (
              <div>
                <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                  Data de Expiração
                </label>
                <input
                  type="date"
                  value={planExpiresAt}
                  onChange={(e) => setPlanExpiresAt(e.target.value)}
                  className="w-full rounded-xl border border-slate-700/60 bg-[#111c34] px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
                />
              </div>
            )}
          </div>

          {user.totpEnabled && (
            <div className="pt-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleReset2FA}
                className="w-full justify-center gap-2 border-sky-500/40 text-sky-400 hover:bg-sky-500/10"
              >
                <KeyRound className="h-4 w-4" />
                Resetar Autenticação 2FA (TOTP)
              </Button>
            </div>
          )}

          {/* Rodapé com botões de ação */}
          <div className="flex items-center justify-end gap-3 border-t border-slate-800 pt-5">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-xl border border-slate-700 bg-[#243048] px-5 py-2.5 text-sm font-semibold text-slate-200 hover:bg-[#334155] transition-colors"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="rounded-xl bg-[#10b981] px-5 py-2.5 text-sm font-bold text-white hover:bg-[#059669] shadow-lg shadow-emerald-500/20 transition-all disabled:opacity-50"
            >
              {submitting ? 'Salvando...' : 'Salvar Alterações'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
