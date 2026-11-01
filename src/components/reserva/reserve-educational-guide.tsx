'use client';

import React from 'react';
import Link from 'next/link';
import {
  ArrowRight,
  CheckCircle2,
  Compass,
  MapPin,
  XCircle
} from 'lucide-react';
import { Badge, Card } from '@/components/ui/primitives';
import { cn } from '@/lib/utils';

interface ReserveRoadmapCardProps {
  hasGoalConfigured: boolean;
  hasAnyBalance: boolean;
  isFullyShielded: boolean;
  onOpenNewAporte: () => void;
}

export function ReserveRoadmapCard({
  hasGoalConfigured,
  hasAnyBalance,
  isFullyShielded,
  onOpenNewAporte
}: ReserveRoadmapCardProps) {
  const steps = [
    {
      num: '1',
      title: 'Calcule sua Meta Pessoal',
      done: hasGoalConfigured,
      description:
        'Informe abaixo o seu custo de vida mensal essencial e escolha seu perfil profissional (Concursado, CLT ou Autônomo/PJ).'
    },
    {
      num: '2',
      title: 'Defina a Regra de Blindagem',
      done: hasGoalConfigured,
      description:
        'Escolha como o sistema deve priorizar seus novos aportes enquanto a reserva não chega a 100% (ex: 70% Reserva / 30% Carteira).'
    },
    {
      num: '3',
      title: 'Guarde em Liquidez Diária (D+0/D+1)',
      done: hasAnyBalance,
      description:
        'Invista no seu banco ou corretora em Tesouro Selic, CDB 100% CDI com Liquidez Diária ou Conta Remunerada e registre aqui.',
      actionLabel: '+ Registrar Aporte',
      onAction: onOpenNewAporte
    },
    {
      num: '4',
      title: 'Avance para o Método DAVI & Onde Aportar',
      done: isFullyShielded,
      description:
        'Com sua proteção encaminhada, filtre empresas/fundos no Radar DAVI, defina seus Objetivos e simule seus aportes mensais.',
      href: '/radar',
      linkLabel: 'Ir ao Radar DAVI'
    }
  ];

  return (
    <Card className="space-y-4 border-gold-500/35 bg-gradient-to-br from-obsidian-900 via-obsidian-900 to-[#0a1814] p-5 sm:p-6">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl border border-gold-500/40 bg-gold-500/15 text-gold-300">
            <MapPin className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-base font-extrabold text-white sm:text-lg">
              Primeiro Passo do Investidor — Seu Caminho na Norte Invest
            </h2>
            <p className="text-xs text-slate-200 sm:text-sm">
              Novo por aqui? Siga esta ordem simples para proteger sua família antes de buscar multiplicação na Bolsa:
            </p>
          </div>
        </div>
        <Badge tone="gold" className="px-3 py-1 text-xs font-extrabold">
          Etapa 1 do Método Hydra
        </Badge>
      </div>

      <div className="grid gap-3.5 sm:grid-cols-2 lg:grid-cols-4">
        {steps.map((step) => (
          <div
            key={step.num}
            className={cn(
              'flex flex-col justify-between rounded-xl border p-4 transition',
              step.done
                ? 'border-emerald-500/40 bg-[#081a14]'
                : 'border-slate-700/80 bg-obsidian-950/95'
            )}
          >
            <div>
              <div className="mb-2 flex items-center justify-between gap-2">
                <span
                  className={cn(
                    'inline-flex h-7 w-7 items-center justify-center rounded-full text-xs font-extrabold',
                    step.done
                      ? 'bg-emerald-500 text-obsidian-950'
                      : 'border border-gold-500/50 bg-gold-500/15 text-gold-300'
                  )}
                >
                  {step.done ? '✓' : step.num}
                </span>
                <span
                  className={cn(
                    'text-xs font-bold',
                    step.done ? 'text-emerald-300' : 'text-gold-300'
                  )}
                >
                  {step.done ? 'Configurado' : `Passo ${step.num}`}
                </span>
              </div>

              <h3 className="text-sm font-extrabold text-white sm:text-base">{step.title}</h3>
              <p className="mt-1.5 text-xs leading-relaxed text-slate-200 sm:text-sm">
                {step.description}
              </p>
            </div>

            {step.onAction && (
              <button
                type="button"
                onClick={step.onAction}
                className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-emerald-300 underline-offset-4 hover:underline sm:text-sm"
              >
                {step.actionLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </button>
            )}

            {step.href && (
              <Link
                href={step.href}
                className="mt-3 inline-flex items-center gap-1 text-xs font-extrabold text-gold-300 underline-offset-4 hover:underline sm:text-sm"
              >
                <Compass className="h-3.5 w-3.5" />
                {step.linkLabel}
                <ArrowRight className="h-3.5 w-3.5" />
              </Link>
            )}
          </div>
        ))}
      </div>
    </Card>
  );
}

export function ReserveWhereToKeepCards() {
  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {/* Onde Guardar (Adequado) */}
      <div className="rounded-2xl border-2 border-emerald-500/50 bg-[#081913] p-5 shadow-lg sm:p-6">
        <div className="mb-4 flex items-center gap-2.5 border-b border-emerald-500/25 pb-3">
          <CheckCircle2 className="h-6 w-6 shrink-0 text-emerald-400" />
          <h3 className="text-base font-extrabold text-emerald-300 sm:text-lg">
            Onde Guardar sua Reserva (Adequado)
          </h3>
        </div>

        <ul className="space-y-3.5 text-sm leading-relaxed text-slate-100 sm:text-[15px]">
          <li>
            <strong className="text-white">• Tesouro Selic (Pós-Fixado):</strong> Risco soberano (o
            investimento mais seguro do país), liquidez diária e rendimento atrelado à taxa Selic sem
            oscilação negativa relevante.
          </li>
          <li>
            <strong className="text-white">• CDB com Liquidez Diária (100%+ do CDI):</strong> Emitido
            por bancos grandes e sólidos, com resgate imediato em qualquer dia útil e proteção do FGC
            até R$ 250 mil por CPF/instituição.
          </li>
          <li>
            <strong className="text-white">• Contas Remuneradas Sólidas (100% do CDI):</strong>{' '}
            Caixinhas ou contas digitais com liquidez imediata (D+0, inclusive para emergências fora
            do horário comercial).
          </li>
        </ul>
      </div>

      {/* Onde NUNCA Guardar (Inadequado) */}
      <div className="rounded-2xl border-2 border-rose-500/50 bg-[#1b0a10] p-5 shadow-lg sm:p-6">
        <div className="mb-4 flex items-center gap-2.5 border-b border-rose-500/25 pb-3">
          <XCircle className="h-6 w-6 shrink-0 text-rose-400" />
          <h3 className="text-base font-extrabold text-rose-300 sm:text-lg">
            Onde NUNCA Guardar a Reserva (Inadequado)
          </h3>
        </div>

        <ul className="space-y-3.5 text-sm leading-relaxed text-slate-100 sm:text-[15px]">
          <li>
            <strong className="text-white">• Ações, FIIs, Stocks e REITs:</strong> Renda variável
            oscila todos os dias. Em uma urgência médica ou familiar, você pode ser forçado a vender
            com prejuízo.
          </li>
          <li>
            <strong className="text-white">• Títulos Prefixados ou Tesouro IPCA+ Longo:</strong>{' '}
            Sofrem marcação a mercado e podem dar rentabilidade negativa caso você precise resgatar
            antes do vencimento.
          </li>
          <li>
            <strong className="text-white">• CDBs, LCIs ou LCAs com Carência:</strong> Dinheiro
            travado por 1, 2 ou 3 anos não serve para imprevistos imediatos.
          </li>
          <li>
            <strong className="text-white">• Criptomoedas ou Operações de Risco:</strong>{' '}
            Volatilidade extrema é incompatível com a preservação do colchão essencial da sua
            família.
          </li>
        </ul>
      </div>
    </div>
  );
}
