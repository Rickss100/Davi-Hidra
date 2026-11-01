'use client';

import React, { useState } from 'react';
import { ChevronLeft, ChevronRight, DollarSign } from 'lucide-react';
import { Button, Card, Select } from '@/components/ui/primitives';
import { CalendarDayModal } from '@/components/renda-passiva/calendar-day-modal';
import { useDividendCalendar } from '@/hooks/use-passive-income';
import { formatBRL } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { PortfolioCategoryKey } from '@/server/engines/davi-hydra.engine';

const MONTH_NAMES = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro'
];
const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];

const CATEGORY_STYLE: Record<PortfolioCategoryKey, { chip: string; dot: string; label: string }> = {
  fiis: { chip: 'border-purple-500/50 bg-purple-500/15 text-purple-200', dot: 'bg-purple-400', label: 'FIIs (mensal)' },
  acoes: { chip: 'border-emerald-500/50 bg-emerald-500/15 text-emerald-200', dot: 'bg-emerald-400', label: 'Ações B3' },
  reits: { chip: 'border-sky-500/50 bg-sky-500/15 text-sky-200', dot: 'bg-sky-400', label: 'REITs (EUA)' },
  stocks: { chip: 'border-amber-500/50 bg-amber-500/15 text-amber-200', dot: 'bg-amber-400', label: 'Stocks (EUA)' },
  fixed: { chip: 'border-slate-500/50 bg-slate-500/15 text-slate-200', dot: 'bg-slate-400', label: 'Renda Fixa' }
};
const LEGEND_KEYS: PortfolioCategoryKey[] = ['fiis', 'acoes', 'reits', 'stocks'];

export function DividendsCalendar() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [selectedDay, setSelectedDay] = useState<number | null>(null);

  const { data, isLoading } = useDividendCalendar(year, month);
  const calendar = data?.calendar;

  const goPrev = () => {
    if (month === 1) {
      setMonth(12);
      setYear((y) => y - 1);
    } else setMonth((m) => m - 1);
  };
  const goNext = () => {
    if (month === 12) {
      setMonth(1);
      setYear((y) => y + 1);
    } else setMonth((m) => m + 1);
  };

  const daysInMonth = new Date(year, month, 0).getDate();
  const firstWeekday = new Date(year, month - 1, 1).getDay();
  const isToday = (day: number) =>
    now.getFullYear() === year && now.getMonth() + 1 === month && now.getDate() === day;
  const years = Array.from({ length: 7 }, (_, i) => now.getFullYear() - 3 + i);

  return (
    <Card className="space-y-4">
      {selectedDay !== null && (
        <CalendarDayModal
          day={calendar?.days[selectedDay] ?? null}
          dayNumber={selectedDay}
          month={month}
          year={year}
          onClose={() => setSelectedDay(null)}
        />
      )}

      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" aria-label="Mês anterior" onClick={goPrev}>
            <ChevronLeft className="h-5 w-5" aria-hidden="true" />
          </Button>
          <label htmlFor="cal-month" className="sr-only">Mês</label>
          <Select id="cal-month" className="w-40 text-base font-bold" value={month} onChange={(e) => setMonth(Number(e.target.value))}>
            {MONTH_NAMES.map((name, idx) => (
              <option key={name} value={idx + 1}>{name}</option>
            ))}
          </Select>
          <label htmlFor="cal-year" className="sr-only">Ano</label>
          <Select id="cal-year" className="w-28 text-base font-bold" value={year} onChange={(e) => setYear(Number(e.target.value))}>
            {years.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </Select>
          <Button variant="outline" size="icon" aria-label="Próximo mês" onClick={goNext}>
            <ChevronRight className="h-5 w-5" aria-hidden="true" />
          </Button>
        </div>

        <div className="flex items-center gap-2 rounded-full border border-emerald-500/50 bg-emerald-500/10 px-4 py-2 text-base font-bold text-emerald-300">
          <DollarSign className="h-5 w-5" aria-hidden="true" />
          Total no mês: {formatBRL(calendar?.totalBrl ?? 0)}
        </div>
      </div>

      {calendar && calendar.paymentCount > 0 && (
        <p className="text-sm text-slate-200 sm:text-base">
          <strong className="text-emerald-300">{formatBRL(calendar.receivedBrl)}</strong> já recebidos ·{' '}
          <strong className="text-sky-300">{formatBRL(calendar.scheduledBrl)}</strong> agendados ·{' '}
          <strong className="text-gold-300">{formatBRL(calendar.estimatedBrl)}</strong> estimados pelo histórico
        </p>
      )}

      <ul className="flex flex-wrap gap-x-5 gap-y-1.5 text-sm text-slate-200" aria-label="Legenda de categorias">
        {LEGEND_KEYS.map((key) => (
          <li key={key} className="flex items-center gap-2">
            <span className={cn('h-3 w-3 rounded-full', CATEGORY_STYLE[key].dot)} aria-hidden="true" />
            {CATEGORY_STYLE[key].label}
          </li>
        ))}
        <li className="flex items-center gap-2 text-gold-300">
          <span className="h-3 w-3 rounded-sm border border-dashed border-gold-400" aria-hidden="true" />
          Tracejado = estimado pelo histórico
        </li>
      </ul>

      <div className={cn('grid grid-cols-7 gap-1.5 sm:gap-2', isLoading && 'opacity-60')}>
        {WEEK_DAYS.map((name) => (
          <div key={name} className="rounded-md bg-obsidian-800/80 py-1.5 text-center text-xs font-bold uppercase text-slate-300 sm:text-sm">
            {name}
          </div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, idx) => (
          <div key={`empty-${idx}`} aria-hidden="true" />
        ))}
        {Array.from({ length: daysInMonth }, (_, i) => i + 1).map((day) => {
          const info = calendar?.days[day];
          const has = Boolean(info && info.payments.length > 0);
          return (
            <button
              key={day}
              type="button"
              onClick={() => setSelectedDay(day)}
              aria-label={`Dia ${day}${has ? `, ${info!.payments.length} provento(s), total ${formatBRL(info!.totalBrl)}` : ', sem proventos'}`}
              className={cn(
                'flex min-h-[84px] flex-col justify-between rounded-lg border bg-obsidian-950/70 p-1.5 text-left transition hover:border-gold-500/60 sm:min-h-[104px] sm:p-2',
                has ? 'border-emerald-500/50' : 'border-slate-800',
                isToday(day) && 'ring-2 ring-sky-400'
              )}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-bold text-slate-100">{day}</span>
                {isToday(day) && <span className="rounded bg-sky-500 px-1.5 text-[11px] font-bold text-obsidian-950">Hoje</span>}
              </div>
              {has && info && (
                <div className="space-y-0.5">
                  {info.payments.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      className={cn(
                        'flex items-center justify-between gap-1 rounded border px-1 text-[11px] font-bold sm:text-xs',
                        CATEGORY_STYLE[p.category].chip,
                        p.status === 'estimado' && 'border-dashed'
                      )}
                    >
                      <span className="truncate">{p.assetCode}</span>
                      <span>{Math.round(p.totalBrl)}</span>
                    </div>
                  ))}
                  {info.payments.length > 2 && (
                    <div className="text-center text-[11px] text-slate-300">+{info.payments.length - 2} mais</div>
                  )}
                  <div className="text-right text-xs font-extrabold text-emerald-400 sm:text-sm">
                    +{formatBRL(info.totalBrl)}
                  </div>
                </div>
              )}
            </button>
          );
        })}
      </div>
    </Card>
  );
}
