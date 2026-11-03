'use client';

import React from 'react';
import Link from 'next/link';
import {
  Briefcase,
  TrendingUp,
  PieChart,
  PiggyBank,
  DollarSign,
  Search,
  History,
  BarChart3,
  Layers,
  ArrowRight
} from 'lucide-react';

const APP_MODULES = [
  {
    icon: Briefcase,
    title: '1. Carteira',
    path: '/carteira',
    tone: 'emerald',
    desc: 'O centro de controle onde você cadastra suas movimentações. Use o botão de Novo Lançamento para registrar compras e vendas informando a categoria, o ticker (código), quantidade e preço.',
    tip: 'Dica: O campo de ativo possui autocompletar inteligente com mais de 1.500 ativos pré-carregados da B3 e mercado americano.'
  },
  {
    icon: TrendingUp,
    title: '2. Onde Aportar',
    path: '/onde-aportar',
    tone: 'sky',
    desc: 'No dia do seu aporte mensal, entre nesta tela e digite o valor que deseja investir. A Hydra cruza sua carteira atual com seus objetivos e entrega a recomendação exata de compras para o mês.',
    tip: 'Dica: O motor divide matematicamente seu aporte nos ativos mais distantes da meta sem precisar vender nada.'
  },
  {
    icon: PieChart,
    title: '3. Definir Objetivos',
    path: '/definir-objetivos',
    tone: 'purple',
    desc: 'Aqui você ensina ao sistema suas metas ideais. Defina o percentual macro (ex: 40% Ações, 30% FIIs, 15% Stocks, 15% Renda Fixa) e utilize o Assistente Guiado para calibrar pesos por ativo.',
    tip: 'Dica: Use o Assistente Passo a Passo para calibrar os percentuais sem complexidade matemática.'
  },
  {
    icon: PiggyBank,
    title: '4. Reserva de Emergência',
    path: '/reserva-emergencia',
    tone: 'amber',
    desc: 'Calculadora interativa baseada no seu custo de vida mensal e na sua profissão (Servidor: 6 meses; CLT: 8 meses; Autônomo: 12 meses). Acompanhe o percentual já concluído com ativos de liquidez diária.',
    tip: 'Dica: Cadastre títulos como Tesouro Selic ou CDB Liquidez Diária na sua carteira para alimentar o termômetro.'
  },
  {
    icon: DollarSign,
    title: '5. Renda Passiva',
    path: '/renda-passiva',
    tone: 'emerald',
    desc: 'Monitore sua renda média mensal, seu Dividend Yield e acompanhe a evolução dos proventos recebidos. Utilize o Simulador de Futuro para projetar seu patrimônio daqui a 5, 10 ou 20 anos.',
    tip: 'Dica: Veja o poder dos juros compostos simulando o reinvestimento integral dos seus dividendos.'
  },
  {
    icon: Search,
    title: '6. Radar de Ativos',
    path: '/radar',
    tone: 'sky',
    desc: 'Uma central fundamentalista com centenas de empresas e FIIs. Filtre por múltiplos de valorização e saúde financeira como P/L, Dividend Yield, P/VP, ROE e Dívida para selecionar os melhores ativos.',
    tip: 'Dica: Use os presets Conservador, Moderado e Agressivo do Filtro MFS para filtrar em um clique.'
  },
  {
    icon: History,
    title: '7. Histórico de Transações',
    path: '/historico',
    tone: 'purple',
    desc: 'O livro contábil da sua carteira. Acompanhe a lista cronológica de todas as suas compras e vendas, visualize totais investidos, média por aporte e filtre por ticker com agilidade.',
    tip: 'Dica: Errou uma digitação? Basta clicar no ícone de lixeira para excluir a ordem e recalcular a carteira.'
  },
  {
    icon: BarChart3,
    title: '8. Resumo da Carteira',
    path: '/resumo',
    tone: 'amber',
    desc: 'A visão executiva de desempenho. Veja seu patrimônio total, lucro histórico e o gráfico interativo de rentabilidade contra os maiores benchmarks: S&P 500, Ibovespa, CDI/Selic, IPCA e IFIX.',
    tip: 'Dica: A rentabilidade ponderada no tempo (Modified Dietz) garante números 100% fiéis à realidade, sem distorção por aportes.'
  }
];

export function TutorialManualTab() {
  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d1527] to-[#131f3b] p-6 shadow-xl">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl font-extrabold text-white">
            Guia Passo a Passo: Dominando as Telas da MANTFRAI
          </h2>
          <p className="text-xs leading-relaxed text-slate-300">
            Veja abaixo exatamente como utilizar cada funcionalidade do sistema no seu dia a dia de investidor, com atalhos de acesso direto.
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-sky-500/10 text-sky-400 border border-sky-500/20">
          <Layers className="h-7 w-7" />
        </div>
      </div>

      {/* Grid com os 8 Módulos do Sistema */}
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
        {APP_MODULES.map((mod) => {
          const Icon = mod.icon;
          return (
            <div
              key={mod.title}
              className="flex flex-col justify-between rounded-2xl border border-slate-800/80 bg-[#0d1527] p-5 shadow-sm hover:border-slate-700 transition-colors"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <h3 className="flex items-center gap-2.5 text-base font-bold text-white">
                    <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-slate-800 text-emerald-400">
                      <Icon className="h-4 w-4" />
                    </div>
                    {mod.title}
                  </h3>
                  <Link
                    href={mod.path}
                    className="inline-flex items-center gap-1 rounded-lg border border-slate-700/60 bg-[#111c34] px-2.5 py-1 text-[11px] font-semibold text-slate-300 hover:text-white hover:border-emerald-500/40 transition-colors"
                  >
                    <span>Acessar</span>
                    <ArrowRight className="h-3 w-3" />
                  </Link>
                </div>
                <p className="text-xs leading-relaxed text-slate-400">{mod.desc}</p>
              </div>

              <div className="mt-4 rounded-xl border-l-4 border-emerald-500 bg-[#111c34]/70 p-3 text-xs text-slate-300 leading-relaxed">
                {mod.tip}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
