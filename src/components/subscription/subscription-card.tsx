'use client';

import React from 'react';
import { Sparkles, Clock, Crown, ArrowUpRight } from 'lucide-react';
import { SafeUserDTO } from '@/server/dal/auth-dal';

interface SubscriptionCardProps {
  user?: SafeUserDTO | null;
  onOpenPlans: () => void;
}

export function SubscriptionCard({ user, onOpenPlans }: SubscriptionCardProps) {
  if (!user) return null;

  const isLifetime = user.planPeriod === 'lifetime';
  const isTrial = user.planPeriod === '1_month';

  // Cálculo de dias restantes
  let remainingDays = 0;
  let formattedExpiry = '';

  if (user.planExpiresAt) {
    const expiryDate = new Date(user.planExpiresAt);
    const diffTime = expiryDate.getTime() - Date.now();
    remainingDays = Math.max(0, Math.ceil(diffTime / (1000 * 60 * 60 * 24)));
    formattedExpiry = expiryDate.toLocaleDateString('pt-BR');
  }

  if (isLifetime) {
    return (
      <div className="rounded-xl border border-gold-500/30 bg-gradient-to-br from-gold-500/10 via-[#111c34] to-obsidian-950 p-3 shadow-md">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-gold-500/20 text-gold-400">
              <Crown className="h-4 w-4" />
            </div>
            <div>
              <p className="text-[11px] font-black uppercase tracking-wider text-gold-300">
                Plano Vitalício
              </p>
              <p className="text-[10px] text-slate-400">Acesso Permanente Private</p>
            </div>
          </div>
          <span className="rounded-md border border-gold-500/30 bg-gold-500/15 px-1.5 py-0.5 text-[10px] font-bold text-gold-300">
            Ativo
          </span>
        </div>
      </div>
    );
  }

  // Quase expirando (<= 7 dias)
  const isExpiringSoon = remainingDays <= 7;

  return (
    <div
      className={`rounded-xl border p-3 shadow-md transition-all ${
        isExpiringSoon
          ? 'border-amber-500/40 bg-gradient-to-br from-amber-500/15 via-[#161d2d] to-obsidian-950'
          : 'border-slate-800 bg-[#0c1424]'
      }`}
    >
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-1.5">
          <div
            className={`flex h-6 w-6 items-center justify-center rounded-lg text-xs ${
              isTrial ? 'bg-emerald-500/20 text-emerald-400' : 'bg-gold-500/20 text-gold-400'
            }`}
          >
            {isTrial ? <Sparkles className="h-3.5 w-3.5" /> : <Clock className="h-3.5 w-3.5" />}
          </div>
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-200">
            {isTrial ? 'Degustação (Trial)' : 'Plano Assinante'}
          </span>
        </div>

        <span
          className={`rounded-md border px-1.5 py-0.5 text-[10px] font-bold ${
            isExpiringSoon
              ? 'border-amber-500/40 bg-amber-500/20 text-amber-300'
              : 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400'
          }`}
        >
          {remainingDays > 0 ? `${remainingDays}d restantes` : 'Expirado'}
        </span>
      </div>

      <div className="text-[11px] text-slate-400 mb-2.5 flex items-center justify-between">
        <span>Válido até:</span>
        <strong className="text-slate-200 font-medium">
          {formattedExpiry || '30 dias'}
        </strong>
      </div>

      <button
        type="button"
        onClick={onOpenPlans}
        className={`w-full flex items-center justify-center gap-1.5 rounded-lg py-2 px-2.5 text-xs font-bold transition-all shadow-sm ${
          isTrial
            ? 'bg-gradient-to-r from-gold-500 to-amber-400 text-obsidian-950 hover:brightness-110 shadow-gold-500/10'
            : 'border border-gold-500/40 bg-gold-500/10 text-gold-300 hover:bg-gold-500/20'
        }`}
      >
        <span>{isTrial ? 'Garantir Anual por R$ 16,40/mês' : 'Renovar / Fazer Upgrade'}</span>
        <ArrowUpRight className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
