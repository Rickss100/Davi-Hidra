'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, ShieldAlert, ShieldCheck } from 'lucide-react';
import { formatBRL, formatPercent } from '@/lib/money';
import type { EmergencyReserveSummaryDTO } from '@/server/engines/davi-hydra.engine';
import { cn } from '@/lib/utils';

export type ReserveAporteStrategy = 'focus_100' | 'hybrid_70_30' | 'free';

interface EmergencyStrategyBannerProps {
  reserve: EmergencyReserveSummaryDTO;
  selectedStrategy: ReserveAporteStrategy;
  onChangeStrategy: (strategy: ReserveAporteStrategy) => void;
}

const STRATEGY_OPTIONS: Array<{ id: ReserveAporteStrategy; label: string }> = [
  { id: 'focus_100', label: '100% Reserva' },
  { id: 'hybrid_70_30', label: '70% Reserva / 30% Carteira' },
  { id: 'free', label: '100% Carteira' }
];

export function EmergencyStrategyBanner({
  reserve,
  selectedStrategy,
  onChangeStrategy
}: EmergencyStrategyBannerProps) {
  const isShielded = reserve.reserveStatus === 'blindada';

  return (
    <div
      className={cn(
        'rounded-2xl border-2 p-5 transition-colors',
        isShielded
          ? 'border-emerald-500/45 bg-[#091914]'
          : 'border-amber-400/50 bg-[#171308]'
      )}
    >
      <div className="flex items-start gap-3.5">
        <div
          className={cn(
            'mt-0.5 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border',
            isShielded
              ? 'border-emerald-400/45 bg-emerald-500/20 text-emerald-300'
              : 'border-amber-400/50 bg-amber-500/20 text-amber-300'
          )}
        >
          {isShielded ? (
            <ShieldCheck className="h-6 w-6" />
          ) : (
            <ShieldAlert className="h-6 w-6" />
          )}
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-base font-extrabold text-white sm:text-lg">
              {isShielded
                ? '🛡️ Reserva de Emergência Blindada (100%)'
                : `⚠️ Reserva de Emergência em Construção (${formatPercent(reserve.reserveCompletionPercent)})`}
            </h3>
            <Link
              href="/reserva-emergencia"
              className="inline-flex items-center gap-1 text-sm font-bold text-gold-300 underline-offset-4 transition hover:text-gold-200 hover:underline"
            >
              Ver detalhes
              <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <p className="mt-1.5 text-sm leading-relaxed text-slate-100 sm:text-[15px]">
            {isShielded ? (
              <>
                Parabéns! Sua reserva possui{' '}
                <strong className="money-value text-emerald-300">
                  {formatBRL(reserve.totalCurrentReserve)}
                </strong>{' '}
                ({reserve.reserveMonthsCovered.toFixed(1)} meses cobertos). Novos aportes estão
                100% liberados para a carteira.
              </>
            ) : (
              <>
                Saldo atual:{' '}
                <strong className="money-value text-white">
                  {formatBRL(reserve.totalCurrentReserve)}
                </strong>{' '}
                de{' '}
                <strong className="money-value text-white">
                  {formatBRL(reserve.targetReserveAmount)}
                </strong>{' '}
                (Faltam{' '}
                <strong className="money-value text-amber-300">
                  {formatBRL(reserve.missingReserveAmount)}
                </strong>{' '}
                · {reserve.reserveMonthsCovered.toFixed(1)} meses cobertos).
              </>
            )}
          </p>
        </div>
      </div>

      {!isShielded && (
        <div className="mt-4 border-t border-amber-400/25 pt-4">
          <span className="mb-2.5 block text-xs font-extrabold uppercase tracking-wider text-slate-200 sm:text-sm">
            Prioridade deste aporte:
          </span>
          <div className="grid gap-2.5 sm:grid-cols-3">
            {STRATEGY_OPTIONS.map((opt) => {
              const active = selectedStrategy === opt.id;
              return (
                <button
                  key={opt.id}
                  type="button"
                  onClick={() => onChangeStrategy(opt.id)}
                  className={cn(
                    'rounded-xl border-2 px-3.5 py-2.5 text-sm font-extrabold transition',
                    active
                      ? 'border-emerald-400 bg-emerald-500/25 text-white shadow-sm'
                      : 'border-slate-700 bg-obsidian-950 text-slate-200 hover:border-gold-400/60 hover:text-white'
                  )}
                >
                  {opt.label}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
