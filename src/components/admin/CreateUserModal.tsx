'use client';

import React, { useState } from 'react';
import { X, UserPlus, ShieldAlert } from 'lucide-react';
import { calculateExpiryDate } from './EditUserModal';

interface CreateUserModalProps {
  isCurrentUserAdmin: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export function CreateUserModal({
  isCurrentUserAdmin,
  onClose,
  onSuccess
}: CreateUserModalProps) {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState<'admin' | 'collaborator' | 'user'>('user');
  const [status, setStatus] = useState('active');
  const [planPeriod, setPlanPeriod] = useState('1_year');
  const [planExpiresAt, setPlanExpiresAt] = useState(calculateExpiryDate('1_year'));
  const [submitting, setSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

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
      if (password.trim().length < 6) {
        setErrorMsg('A senha inicial deve ter no mínimo 6 dígitos.');
        setSubmitting(false);
        return;
      }

      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: name.trim(),
          email: email.trim(),
          password: password.trim(),
          role,
          status,
          planPeriod,
          planExpiresAt: planPeriod === 'lifetime' ? null : (planExpiresAt || null)
        })
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || 'Falha ao cadastrar cliente.');
      }

      onSuccess();
    } catch (err: unknown) {
      setErrorMsg(err instanceof Error ? err.message : 'Erro ao cadastrar novo usuário.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl border border-slate-700/60 bg-[#0d1527] p-6 shadow-2xl">
        <div className="flex items-center justify-between border-b border-slate-800 pb-4">
          <div className="flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-emerald-400" />
            <h2 className="text-lg font-bold text-white">Cadastrar Novo Usuário</h2>
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

        {errorMsg && (
          <div className="mt-4 flex items-center gap-2 rounded-xl border border-rose-500/30 bg-rose-500/10 p-3 text-xs font-semibold text-rose-300">
            <ShieldAlert className="h-4 w-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-5 space-y-4">
          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Nome Completo
            </label>
            <input
              type="text"
              required
              placeholder="Ex: Carlos Silva"
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
              placeholder="Ex: carlos@mantfrai.com.br ou carlos123"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full rounded-xl border border-slate-700/60 bg-[#111c34] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
              Senha de Acesso
            </label>
            <input
              type="password"
              required
              minLength={6}
              placeholder="Mínimo 6 dígitos..."
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-xl border border-slate-700/60 bg-[#111c34] px-3.5 py-2.5 text-sm text-white placeholder-slate-500 focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Papel
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as 'admin' | 'collaborator' | 'user')}
                className="w-full rounded-xl border border-slate-700/60 bg-[#111c34] px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                <option value="user">Investidor Padrão</option>
                <option value="collaborator">Colaborador (TI / Suporte)</option>
                {isCurrentUserAdmin && <option value="admin">Administrador Superusuário</option>}
              </select>
            </div>

            <div>
              <label className="mb-1.5 block text-xs font-bold uppercase tracking-wider text-slate-400">
                Status Inicial
              </label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="w-full rounded-xl border border-slate-700/60 bg-[#111c34] px-3.5 py-2.5 text-sm text-white focus:border-emerald-500 focus:outline-none focus:ring-1 focus:ring-emerald-500 transition-colors"
              >
                <option value="active">Ativo (Acesso Total)</option>
                <option value="suspended">Suspenso (Inadimplente)</option>
                <option value="inactive">Inativo</option>
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
              {submitting ? 'Cadastrando...' : 'Cadastrar Usuário'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
