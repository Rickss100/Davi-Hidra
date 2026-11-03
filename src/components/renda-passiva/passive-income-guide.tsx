import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, CalendarCheck, Snowflake, Target } from 'lucide-react';
import { Card } from '@/components/ui/primitives';

const STEPS = [
  {
    icon: CalendarCheck,
    title: 'Calendário',
    text: 'Veja quanto e quando cada ativo paga. Dados reais vêm da importação B3; datas futuras são estimadas pelo seu histórico.'
  },
  {
    icon: Target,
    title: 'Previsão',
    text: 'Simule aporte mensal + juros compostos e descubra quanto da sua conta de luz, água e mercado os dividendos pagarão.'
  },
  {
    icon: Snowflake,
    title: 'Número Mágico',
    text: 'Quantas cotas de um ativo fazem os proventos comprarem 1 nova cota sozinhos: é a bola de neve rodando.'
  }
] as const;

export function PassiveIncomeGuide({ hasHoldings }: { hasHoldings: boolean }) {
  return (
    <Card className="space-y-4 border-sky-500/30 bg-sky-950/15">
      <div className="flex items-center gap-2.5">
        <BookOpen className="h-6 w-6 text-sky-300" aria-hidden="true" />
        <h2 className="text-lg font-extrabold text-white sm:text-xl">
          {hasHoldings ? 'Como usar esta página' : 'Primeiro passo: comece a construir sua renda passiva'}
        </h2>
      </div>

      <p className="text-sm leading-relaxed text-slate-200 sm:text-base">
        Renda passiva é o dinheiro que seus investimentos pagam <strong>sem você vender nada</strong>: dividendos
        e JCP das ações, rendimentos mensais dos FIIs e proventos de Stocks/REITs. O objetivo da Metodologia MANTFRAI é
        fazer esses pagamentos cobrirem seu custo de vida.
      </p>

      <ol className="grid gap-3 md:grid-cols-3">
        {STEPS.map((step, idx) => (
          <li key={step.title} className="rounded-xl border border-slate-700/80 bg-obsidian-950/70 p-4">
            <div className="mb-1.5 flex items-center gap-2 text-base font-bold text-white">
              <step.icon className="h-5 w-5 text-gold-400" aria-hidden="true" />
              {idx + 1}. {step.title}
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{step.text}</p>
          </li>
        ))}
      </ol>

      {!hasHoldings && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gold-500/40 bg-gold-500/10 p-4 text-sm text-slate-100 sm:text-base">
          <span className="flex-1">
            Você ainda não tem ativos pagadores. Escolha seus ativos pelo Radar MFS e registre seu primeiro
            aporte na Carteira.
          </span>
          <Link href="/radar" className="inline-flex items-center gap-1.5 font-bold text-gold-300 hover:underline">
            Ir para o Radar <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </Card>
  );
}
