import React from 'react';
import Link from 'next/link';
import { PartyPopper, Snowflake } from 'lucide-react';
import { Badge, Card } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import { cn } from '@/lib/utils';
import type { MagicNumberRowDTO } from '@/server/engines/davi-hydra.engine';

export function MagicNumberGrid({ rows }: { rows: MagicNumberRowDTO[] }) {
  return (
    <Card className="space-y-5">
      <div>
        <h2 className="flex items-center gap-2.5 text-xl font-extrabold text-white sm:text-2xl">
          <Snowflake className="h-6 w-6 text-sky-300" aria-hidden="true" />
          Número Mágico (Efeito Bola de Neve autônomo)
        </h2>
        <p className="mt-1 text-sm leading-relaxed text-slate-200 sm:text-base">
          O <strong>Número Mágico</strong> é a quantidade exata de cotas de um fundo ou ação para que os proventos
          mensais comprem <strong>1 nova cota sozinhos</strong>, sem tirar nenhum centavo do seu bolso.
        </p>
      </div>

      {rows.length === 0 ? (
        <div className="rounded-xl border border-slate-700/80 bg-obsidian-950/60 p-8 text-center">
          <p className="text-base font-bold text-white">Nenhum ativo pagador encontrado na sua custódia.</p>
          <p className="mx-auto mt-2 max-w-xl text-sm text-slate-300 sm:text-base">
            Registre ações, FIIs ou REITs na{' '}
            <Link href="/carteira" className="font-bold text-gold-300 hover:underline">Carteira</Link> para o sistema
            calcular quantas cotas fazem seus proventos comprarem novas cotas sozinhos.
          </p>
        </div>
      ) : (
        <ul className="grid gap-4 md:grid-cols-2">
          {rows.map((row) => (
            <li
              key={row.code}
              className={cn(
                'space-y-4 rounded-xl border bg-obsidian-950/60 p-5',
                row.isMagicReached ? 'border-emerald-500/60' : 'border-slate-700/80'
              )}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <p className="text-xl font-extrabold text-white">{row.code}</p>
                  <p className="truncate text-sm text-slate-300">{row.name}</p>
                </div>
                {row.isMagicReached ? (
                  <Badge tone="emerald">
                    <PartyPopper className="h-3.5 w-3.5" aria-hidden="true" /> Bola de Neve ativada!
                  </Badge>
                ) : (
                  <Badge tone="sky">{formatPercent(row.progressPercent, 1)} atingido</Badge>
                )}
              </div>

              <div className="space-y-1.5">
                <div className="flex justify-between text-sm text-slate-200 sm:text-base">
                  <span>Suas cotas: <strong className="text-white">{row.currentShares}</strong></span>
                  <span>Meta: <strong className="text-white">{row.magicNumberShares} cotas</strong></span>
                </div>
                <div
                  role="progressbar"
                  aria-valuenow={row.progressPercent}
                  aria-valuemin={0}
                  aria-valuemax={100}
                  aria-label={`Progresso do Número Mágico de ${row.code}`}
                  className="h-2.5 overflow-hidden rounded-full bg-obsidian-800"
                >
                  <div
                    className={cn('h-full rounded-full', row.isMagicReached ? 'bg-emerald-400' : 'bg-sky-400')}
                    style={{ width: `${Math.min(100, row.progressPercent)}%` }}
                  />
                </div>
              </div>

              <dl className="grid grid-cols-2 gap-3 border-t border-slate-800 pt-3 text-sm sm:text-base">
                <div>
                  <dt className="text-slate-300">Provento / mês</dt>
                  <dd className="money-value font-bold text-white">{formatBRL(row.monthlyIncomeBrl)}</dd>
                </div>
                <div>
                  <dt className="text-slate-300">Gera sozinho</dt>
                  <dd className={cn('font-bold', row.isMagicReached ? 'text-emerald-400' : 'text-sky-400')}>
                    {row.sharesGeneratedPerMonth.toFixed(2)} cota(s)/mês
                  </dd>
                </div>
                <div>
                  <dt className="text-slate-300">Faltam</dt>
                  <dd className="font-bold text-white">{row.missingShares} cotas</dd>
                </div>
                <div>
                  <dt className="text-slate-300">Investimento restante</dt>
                  <dd className="money-value font-bold text-gold-300">{formatBRL(row.investmentNeededBrl)}</dd>
                </div>
              </dl>

              {row.dataSource === 'dy_fundamentalista' && (
                <p className="text-xs text-gold-300">
                  Estimativa pelo DY do ativo: ainda não há proventos registrados para ele.
                </p>
              )}
            </li>
          ))}
        </ul>
      )}
    </Card>
  );
}
