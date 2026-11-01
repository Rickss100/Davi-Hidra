'use client';

import React from 'react';
import Link from 'next/link';
import { ArrowRight, BookOpen, GitCompareArrows, LineChart, PieChart } from 'lucide-react';
import { Card } from '@/components/ui/primitives';

const ITEMS = [
  {
    icon: LineChart,
    title: 'Patrimônio × Capital aplicado',
    text: 'O capital aplicado é o que saiu do seu bolso. A distância até o patrimônio é o lucro (ou prejuízo) do mercado.'
  },
  {
    icon: GitCompareArrows,
    title: 'Rentabilidade vs. Benchmarks',
    text: 'Compara sua carteira com Ibovespa, S&P 500, CDI, IPCA e IFIX. Aportes não contam como lucro: o cálculo é ponderado pelo tempo.'
  },
  {
    icon: PieChart,
    title: 'Composição por classe',
    text: 'Mostra onde seu dinheiro está de fato e quanto cada classe rendeu, além da exposição ao exterior.'
  }
] as const;

export function ResumoGuide({ hasHoldings }: { hasHoldings: boolean }) {
  return (
    <Card className="space-y-4 border-sky-500/30 bg-sky-950/15">
      <div className="flex items-center gap-2.5">
        <BookOpen className="h-6 w-6 text-sky-300" aria-hidden="true" />
        <h2 className="text-lg font-extrabold text-white sm:text-xl">
          {hasHoldings ? 'Como ler seu resumo' : 'Seu resumo ganhará vida com o primeiro aporte'}
        </h2>
      </div>

      <ul className="grid gap-3 md:grid-cols-3">
        {ITEMS.map((item) => (
          <li key={item.title} className="rounded-xl border border-slate-700/80 bg-obsidian-950/70 p-4">
            <div className="mb-1.5 flex items-center gap-2 text-base font-bold text-white">
              <item.icon className="h-5 w-5 text-gold-400" aria-hidden="true" />
              {item.title}
            </div>
            <p className="text-sm leading-relaxed text-slate-300">{item.text}</p>
          </li>
        ))}
      </ul>

      {!hasHoldings && (
        <div className="flex flex-wrap items-center gap-3 rounded-xl border border-gold-500/40 bg-gold-500/10 p-4 text-sm text-slate-100 sm:text-base">
          <span className="flex-1">
            Ainda não há ativos na carteira. Registre seu primeiro aporte para ver evolução, rentabilidade e
            composição. Os índices de mercado abaixo já servem de referência.
          </span>
          <Link href="/carteira" className="inline-flex items-center gap-1.5 font-bold text-gold-300 hover:underline">
            Ir para a Carteira <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>
      )}
    </Card>
  );
}
