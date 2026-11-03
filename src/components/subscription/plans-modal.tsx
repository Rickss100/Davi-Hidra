'use client';

import React from 'react';
import { X, Check, Sparkles, MessageCircle, ShieldCheck, Zap } from 'lucide-react';
import { Button } from '@/components/ui/primitives';

interface PlansModalProps {
  onClose: () => void;
  userEmail?: string;
  currentPlan?: string;
}

interface PlanOption {
  id: string;
  name: string;
  period: string;
  priceTotal: string;
  priceMonthly: string;
  savingsBadge?: string;
  highlight?: boolean;
  ctaText: string;
  whatsappMessage: string;
  features: string[];
}

const PLANS: PlanOption[] = [
  {
    id: '3_months',
    name: 'Trimestral',
    period: '3 Meses',
    priceTotal: 'R$ 89,70',
    priceMonthly: 'R$ 29,90 / mês',
    ctaText: 'Escolher Trimestral',
    whatsappMessage: 'Olá! Gostaria de contratar o Plano Trimestral da MANTFRAI (R$ 89,70). Como posso efetuar o pagamento?',
    features: [
      'Acesso completo ao Motor RDM (Rebalanceamento por Distância da Meta)',
      'Radar de Ativos com Filtro MFS',
      'Mapa Anual de Proventos',
      'Academia com 30 Aulas e Simulador'
    ]
  },
  {
    id: '1_year',
    name: 'Anual Especial',
    period: '12 Meses',
    priceTotal: 'R$ 197,00 à vista',
    priceMonthly: 'R$ 16,40 / mês',
    savingsBadge: '45% DE ECONOMIA • MAIS ESCOLHIDO',
    highlight: true,
    ctaText: 'Garantir Oferta de Lançamento',
    whatsappMessage: 'Olá! Gostaria de aproveitar a condição especial de lançamento do Plano Anual da MANTFRAI (R$ 197,00 à vista ou 12x R$ 19,90). Como posso efetuar o pagamento?',
    features: [
      'Tudo do plano trimestral',
      'Apenas R$ 0,54 por dia (menos que um café)',
      'Condição de Lançamento vitaliciada na renovação',
      'Cálculo do Número Mágico e Bola de Neve',
      'Suporte prioritário na mesa Private',
      'Inteligência Artificial Private integrada'
    ]
  },
  {
    id: '6_months',
    name: 'Semestral',
    period: '6 Meses',
    priceTotal: 'R$ 149,40',
    priceMonthly: 'R$ 24,90 / mês',
    savingsBadge: '17% de Economia',
    ctaText: 'Escolher Semestral',
    whatsappMessage: 'Olá! Gostaria de contratar o Plano Semestral da MANTFRAI (R$ 149,40). Como posso efetuar o pagamento?',
    features: [
      'Acesso completo ao Motor RDM',
      'Radar de Ativos Fundamentalista MFS',
      'Mapa Anual de Proventos',
      'Academia com 30 Aulas e Simulador'
    ]
  }
];

export function PlansModal({ onClose, userEmail }: PlansModalProps) {
  const getWhatsappUrl = (message: string) => {
    const emailInfo = userEmail ? ` (Minha conta: ${userEmail})` : '';
    const fullMsg = encodeURIComponent(`${message}${emailInfo}`);
    return `https://api.whatsapp.com/send?phone=5527995263026&text=${fullMsg}`;
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
      <div className="relative w-full max-w-4xl rounded-3xl border border-slate-700/80 bg-[#0a1122] p-5 sm:p-7 shadow-2xl my-6">
        {/* Botão Fechar */}
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-xl p-2 text-slate-400 hover:bg-slate-800 hover:text-white transition-colors"
          aria-label="Fechar"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Cabeçalho */}
        <div className="text-center max-w-xl mx-auto space-y-2 mb-6 sm:mb-8">
          <div className="inline-flex items-center gap-2 rounded-full border border-gold-500/40 bg-gold-500/10 px-3.5 py-1 text-xs font-bold text-gold-300">
            <Sparkles className="h-3.5 w-3.5 text-gold-400" />
            CONDIÇÃO ESPECIAL DE LANÇAMENTO • MANTFRAI
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-white">
            Invista com Inteligência Institucional
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Economize tempo, evite erros caros e receba a indicação exata de onde aportar seus recursos com a metodologia MANTFRAI (Carteira Antifrágil & Motor RDM).
          </p>
        </div>

        {/* Grade de Planos */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 sm:gap-5 items-stretch">
          {PLANS.map((plan) => (
            <div
              key={plan.id}
              className={`relative flex flex-col justify-between rounded-2xl p-5 sm:p-6 transition-all ${
                plan.highlight
                  ? 'border-2 border-gold-400 bg-gradient-to-b from-[#142342] to-[#0e172a] shadow-xl shadow-gold-500/10 md:-translate-y-2'
                  : 'border border-slate-800 bg-[#0d162b]/80 hover:border-slate-700'
              }`}
            >
              {plan.savingsBadge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap rounded-full bg-gradient-to-r from-gold-500 to-amber-500 px-3 py-0.5 text-[10px] font-black uppercase tracking-wider text-obsidian-950 shadow-md">
                  {plan.savingsBadge}
                </div>
              )}

              <div>
                <div className="flex items-center justify-between">
                  <h3 className="text-base font-bold text-white">{plan.name}</h3>
                  <span className="text-xs font-semibold text-slate-400">{plan.period}</span>
                </div>

                <div className="mt-4 mb-3">
                  <div className="text-2xl sm:text-3xl font-black text-emerald-400">
                    {plan.priceMonthly}
                  </div>
                  <div className="text-xs text-slate-400 mt-0.5">
                    Total: <strong className="text-slate-200">{plan.priceTotal}</strong>
                  </div>
                </div>

                <div className="h-px bg-slate-800/80 my-4" />

                <ul className="space-y-2.5 text-xs text-slate-300">
                  {plan.features.map((feat, idx) => (
                    <li key={idx} className="flex items-start gap-2">
                      <Check className="h-4 w-4 shrink-0 text-emerald-400 mt-0.5" />
                      <span>{feat}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="pt-6 mt-4">
                <a
                  href={getWhatsappUrl(plan.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={`flex w-full items-center justify-center gap-2 rounded-xl py-2.5 px-4 text-xs font-bold transition-all ${
                    plan.highlight
                      ? 'bg-gradient-to-r from-gold-500 to-amber-400 text-obsidian-950 hover:brightness-110 shadow-lg shadow-gold-500/20'
                      : 'border border-slate-700 bg-obsidian-950 text-slate-200 hover:border-emerald-500/40 hover:text-white'
                  }`}
                >
                  <MessageCircle className="h-4 w-4" />
                  <span>{plan.ctaText}</span>
                </a>
              </div>
            </div>
          ))}
        </div>

        {/* Rodapé de Confiança e Inteligência do Investidor */}
        <div className="mt-6 sm:mt-8 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 p-4 text-center">
          <div className="flex flex-wrap items-center justify-center gap-4 text-xs text-slate-300">
            <span className="flex items-center gap-1.5 font-medium text-emerald-400">
              <Zap className="h-4 w-4" />
              Menos de R$ 0,54 por dia no Plano Anual
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span className="flex items-center gap-1.5 text-slate-300">
              <ShieldCheck className="h-4 w-4 text-gold-400" />
              Os próprios dividendos da carteira pagam a assinatura
            </span>
            <span className="hidden sm:inline text-slate-600">•</span>
            <span>Liberação imediata via PIX ou Cartão com nosso suporte</span>
          </div>
        </div>
      </div>
    </div>
  );
}
