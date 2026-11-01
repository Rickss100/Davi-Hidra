'use client';

import React, { useEffect } from 'react';
import { CheckCircle2, Clock, Hourglass, X } from 'lucide-react';
import { Badge, Card } from '@/components/ui/primitives';
import { formatBRL } from '@/lib/money';
import type { CalendarDayDTO, CalendarPaymentDTO } from '@/server/engines/passive-income.engine';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];

const KIND_LABEL: Record<CalendarPaymentDTO['kind'], string> = {
  dividendo: 'Dividendo',
  jcp: 'JCP',
  rendimento: 'Rendimento',
  outro: 'Provento'
};

const STATUS_VIEW = {
  pago: { label: 'Pago / Liquidado', tone: 'emerald' as const, Icon: CheckCircle2 },
  agendado: { label: 'Agendado', tone: 'sky' as const, Icon: Clock },
  estimado: { label: 'Estimado pelo histórico', tone: 'gold' as const, Icon: Hourglass }
};

interface CalendarDayModalProps {
  day: CalendarDayDTO | null;
  dayNumber: number;
  month: number;
  year: number;
  onClose: () => void;
}

export function CalendarDayModal({ day, dayNumber, month, year, onClose }: CalendarDayModalProps) {
  useEffect(() => {
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKey);
    return () => window.removeEventListener('keydown', handleKey);
  }, [onClose]);

  const payments = day?.payments ?? [];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="day-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 p-4 backdrop-blur-sm"
    >
      <Card className="max-h-[90vh] w-full max-w-xl space-y-4 overflow-y-auto border-gold-500/40 bg-[#0B0F1A] p-6">
        <div className="flex items-start justify-between gap-3 border-b border-slate-800 pb-3">
          <div>
            <h2 id="day-modal-title" className="text-lg font-extrabold text-white sm:text-xl">
              Proventos em {dayNumber} de {MONTH_NAMES[month - 1]} de {year}
            </h2>
            <p className="text-sm text-slate-300">
              {payments.length > 0
                ? `${payments.length} pagamento(s) neste dia`
                : 'Nenhum pagamento previsto para esta data'}
            </p>
          </div>
          <button
            type="button"
            aria-label="Fechar janela"
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-300 transition hover:bg-obsidian-800 hover:text-white"
          >
            <X className="h-5 w-5" aria-hidden="true" />
          </button>
        </div>

        {payments.length === 0 ? (
          <div className="py-8 text-center text-sm text-slate-300 sm:text-base">
            <Clock className="mx-auto mb-3 h-10 w-10 opacity-50" aria-hidden="true" />
            Não há proventos creditados ou previstos nesta data para a sua carteira.
          </div>
        ) : (
          <ul className="space-y-3">
            {payments.map((p) => {
              const view = STATUS_VIEW[p.status];
              return (
                <li
                  key={p.id}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-700/80 bg-obsidian-950/70 p-4"
                >
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-base font-extrabold text-white">{p.assetCode}</span>
                      <Badge tone="slate">{KIND_LABEL[p.kind]}</Badge>
                    </div>
                    <p className="text-sm text-slate-300">{p.assetName}</p>
                    <p className="text-sm text-slate-300">
                      {p.quantity} cotas × {formatBRL(p.unitAmountBrl)}
                    </p>
                    {p.basis && <p className="text-xs text-gold-300">{p.basis}</p>}
                  </div>
                  <div className="space-y-1.5 text-right">
                    <p className="money-value text-lg font-extrabold text-emerald-400">
                      + {formatBRL(p.totalBrl)}
                    </p>
                    <Badge tone={view.tone}>
                      <view.Icon className="h-3.5 w-3.5" aria-hidden="true" />
                      {view.label}
                    </Badge>
                  </div>
                </li>
              );
            })}
          </ul>
        )}

        {payments.length > 0 && day && (
          <div className="flex items-center justify-between border-t border-slate-800 pt-3 text-base font-bold text-white">
            <span>Total do dia:</span>
            <span className="money-value text-emerald-400">{formatBRL(day.totalBrl)}</span>
          </div>
        )}
      </Card>
    </div>
  );
}
