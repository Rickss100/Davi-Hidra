'use client';

import React from 'react';
import {
  Sparkles,
  ShieldCheck,
  PieChart,
  TrendingUp,
  DollarSign
} from 'lucide-react';

export function TutorialMethodTab() {
  return (
    <div className="space-y-6">
      {/* Banner de Apresentação */}
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d1527] to-[#131f3b] p-6 shadow-xl">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl font-extrabold text-white">
            A Tríade da Riqueza Duradoura: Disciplina, Método e Tempo
          </h2>
          <p className="text-xs leading-relaxed text-slate-300">
            O <strong className="text-emerald-400">MANTFRAI</strong> não é uma ferramenta de apostas ou especulação. É um sistema desenhado para eliminar a emoção humana e transformar poupança mensal regular em um fluxo crescente de liberdade financeira.
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
          <Sparkles className="h-7 w-7" />
        </div>
      </div>

      {/* Grid com os 4 Pilares D-A-V-I */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {/* Pilar D */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#0d1527] p-5 shadow-sm hover:border-slate-700 transition-colors">
          <div>
            <div className="mb-3">
              <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                Pilar D
              </span>
            </div>
            <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-white">
              <ShieldCheck className="h-5 w-5 text-emerald-400" />
              Defesa Patrimonial
            </h3>
            <p className="text-xs leading-relaxed text-slate-400">
              Nenhum castelo resiste sem fundações sólidas. Antes de almejar grandes rentabilidades em ações, o investidor inteligente constrói sua <strong>Reserva de Emergência</strong> em ativos de liquidez diária.
            </p>
          </div>
          <div className="mt-4 rounded-xl border-l-4 border-emerald-500 bg-[#111c34]/70 p-3 text-xs text-slate-300 leading-relaxed">
            Garante que imprevistos de saúde ou trabalho nunca forcem você a vender ativos com prejuízo na baixa.
          </div>
        </div>

        {/* Pilar A */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#0d1527] p-5 shadow-sm hover:border-slate-700 transition-colors">
          <div>
            <div className="mb-3">
              <span className="inline-flex rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-sky-400">
                Pilar A
              </span>
            </div>
            <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-white">
              <PieChart className="h-5 w-5 text-sky-400" />
              Alocação Estratégica
            </h3>
            <p className="text-xs leading-relaxed text-slate-400">
              Estudos comprovam que mais de 90% do retorno de uma carteira depende da proporção entre classes de ativos (Ações, FIIs, Renda Fixa e Exterior), e não da tentativa de acertar a próxima ação da moda.
            </p>
          </div>
          <div className="mt-4 rounded-xl border-l-4 border-sky-500 bg-[#111c34]/70 p-3 text-xs text-slate-300 leading-relaxed">
            Você define suas porcentagens ideais e deixa o sistema controlar o rebalanceamento automático.
          </div>
        </div>

        {/* Pilar V */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#0d1527] p-5 shadow-sm hover:border-slate-700 transition-colors">
          <div>
            <div className="mb-3">
              <span className="inline-flex rounded-full border border-purple-500/30 bg-purple-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-purple-400">
                Pilar V
              </span>
            </div>
            <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-white">
              <TrendingUp className="h-5 w-5 text-purple-400" />
              Valor & Fundamentos
            </h3>
            <p className="text-xs leading-relaxed text-slate-400">
              Compramos frações de empresas e imóveis reais. Focamos em companhias lucrativas, com histórico de pagamento de dividendos e governança impecável.
            </p>
          </div>
          <div className="mt-4 rounded-xl border-l-4 border-purple-500 bg-[#111c34]/70 p-3 text-xs text-slate-300 leading-relaxed">
            Preço é o que você paga; Valor é o que você recebe. Seja sócio de bons negócios no longo prazo.
          </div>
        </div>

        {/* Pilar I */}
        <div className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#0d1527] p-5 shadow-sm hover:border-slate-700 transition-colors">
          <div>
            <div className="mb-3">
              <span className="inline-flex rounded-full border border-amber-500/30 bg-amber-500/10 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-amber-400">
                Pilar I
              </span>
            </div>
            <h3 className="mb-2 flex items-center gap-2 text-base font-bold text-white">
              <DollarSign className="h-5 w-5 text-amber-400" />
              Independência Financeira
            </h3>
            <p className="text-xs leading-relaxed text-slate-400">
              O destino final é atingir o <em>Ponto Mágico</em>: o momento em que os proventos mensais dos seus Fundos Imobiliários e Ações pagam todas as suas contas, tornando o trabalho uma opção, e não uma obrigação.
            </p>
          </div>
          <div className="mt-4 rounded-xl border-l-4 border-amber-500 bg-[#111c34]/70 p-3 text-xs text-slate-300 leading-relaxed">
            Cada cota comprada é um funcionário trabalhando 24 horas por dia para gerar renda passiva para você.
          </div>
        </div>
      </div>

      {/* Card Especial: A Filosofia Central */}
      <div className="rounded-2xl border border-sky-500/30 bg-gradient-to-br from-[#0d1527] via-[#0f172a] to-[#131f3b] p-6 shadow-xl">
        <div className="mb-3">
          <span className="inline-flex rounded-full border border-sky-500/40 bg-sky-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-sky-400">
            A Filosofia Central
          </span>
        </div>
        <h3 className="text-lg font-bold text-white">
          O Método MFS & A Carteira Antifrágil: Esculpa o Seu Império
        </h3>

        <div className="mt-4 space-y-4">
          <div className="rounded-xl border-l-4 border-sky-500 bg-[#111c34]/60 p-4">
            <h4 className="mb-1 text-sm font-bold text-white">
              🗿 O Princípio de Davi: Retirar tudo o que não presta
            </h4>
            <p className="text-xs leading-relaxed text-slate-300">
              Quando perguntaram a <strong>Michelangelo</strong> como ele esculpiu a perfeição da estátua de Davi em um bloco bruto de mármore, ele respondeu:  
              <em className="text-sky-300 font-medium"> &quot;Davi sempre esteve ali. Eu apenas retirei tudo o que não era Davi.&quot;</em>  
              No mercado de investimentos, construir riqueza duradoura não é tentar acertar a próxima ação milagrosa, mas sim ter a disciplina de <strong>eliminar os erros</strong>: empresas ruins, especulação de curto prazo, taxas abusivas e decisões tomadas no pânico. O que sobra é a obra de arte: o seu patrimônio sólido.
            </p>
          </div>

          <div className="rounded-xl border-l-4 border-emerald-500 bg-[#111c34]/60 p-4">
            <h4 className="mb-1 text-sm font-bold text-white">
              🐉 A Estratégia Antifrágil: Os múltiplos motores do seu Império
            </h4>
            <p className="text-xs leading-relaxed text-slate-300">
              Na mitologia, quando alguém tenta cortar uma cabeça da Hidra, novas cabeças nascem ainda mais fortes.  
              No <strong>MANTFRAI</strong>, você não investe em uma única empresa ou aposta isolada — <strong>você constrói um império patrimonial</strong> distribuído em múltiplos motores: Ações, Fundos Imobiliários, Renda Fixa Soberana e Ativos Globais. Quando o mercado entra em crise e pressiona um setor ou moeda, o algoritmo do Motor RDM automaticamente se reposiciona, aportando com desconto nos ativos mais baratos e fazendo o seu império florescer ainda mais forte.
            </p>
          </div>
        </div>
      </div>

      {/* Card Algoritmo de Alocação Motor RDM */}
      <div className="rounded-2xl border border-slate-800 bg-[#0d1527] p-6 shadow-sm">
        <div className="mb-3">
          <span className="inline-flex rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-[11px] font-bold uppercase tracking-wider text-emerald-400">
            O Algoritmo de Alocação
          </span>
        </div>
        <h3 className="text-lg font-bold text-white">
          A Metodologia Motor RDM: Por que nunca tentamos adivinhar o mercado?
        </h3>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          <strong>Motor RDM</strong> significa <em>&quot;Aporte no Mais Distante do Objetivo&quot;</em>. A cada mês, o mercado estará em uma fase diferente: às vezes ações brasileiras caem, enquanto o dólar sobe; em outros momentos, os fundos imobiliários ficam baratos enquanto a renda fixa recua.
        </p>
        <p className="mt-2 text-xs leading-relaxed text-slate-300">
          Em vez de tentar prever o futuro (o que ninguém consegue com consistência), você abre o aplicativo, informa o valor disponível para investir e o sistema aponta matematicamente para o ativo que mais se distanciou da sua meta ideal.
        </p>
        <div className="mt-4 rounded-xl border-l-4 border-emerald-500 bg-[#111c34]/70 p-4 text-xs leading-relaxed text-slate-200">
          🎯 <strong>Resultado Prático:</strong> Você sempre comprará na baixa com desconto, evitará comprar no topo da euforia e nunca precisará vender ativos para rebalancear, economizando impostos e taxas de corretagem!
        </div>
      </div>
    </div>
  );
}
