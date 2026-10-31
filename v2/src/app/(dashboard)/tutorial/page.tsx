import React from 'react';
import { Shield, Target, Compass, Coins } from 'lucide-react';
import { Card } from '@/components/ui/primitives';

const PILLARS = [
  {
    icon: Shield,
    title: '1. Blindagem Primeiro (Reserva Soberana)',
    desc: 'Antes de buscar assimetria em renda variável, construímos o colchão de liquidez diária (Tesouro Selic / CDB Soberano D+0) equivalente a 6 a 12 meses do custo familiar, impedindo vendas forçadas na baixa.'
  },
  {
    icon: Target,
    title: '2. Régua Estratégica (Método DAVI)',
    desc: 'Você define racionalmente seus pesos ideais entre Renda Fixa e Variável, Brasil e Estados Unidos, e seleciona empresas perenes e FIIs de tijolo/papel de alta qualidade.'
  },
  {
    icon: Compass,
    title: '3. Rebalanceamento Pelo Aporte (Motor Hydra)',
    desc: 'Em vez de girar patrimônio pagando taxas e impostos, todo dinheiro novo entra comprando exclusivamente os bons ativos que ficaram para trás da meta — comprando barato de forma automática e sem emoção.'
  },
  {
    icon: Coins,
    title: '4. Bola de Neve & Magic Number',
    desc: 'Reinvestindo sistematicamente os dividendos, JCP e rendimentos importados da B3, cada ativo atinge seu Magic Number, passando a comprar novas cotas todos os meses por conta própria.'
  }
];

export default function TutorialPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-extrabold text-white">
          Filosofia Institucional — Método DAVI & Hydra
        </h1>
        <p className="text-xs text-slate-400">
          Os 4 pilares de construção e preservação patrimonial de longo prazo da Norte Invest Private.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-2">
        {PILLARS.map((p) => {
          const Icon = p.icon;
          return (
            <Card key={p.title} className="space-y-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gold-500/15 text-gold-400">
                <Icon className="h-5 w-5" />
              </div>
              <h2 className="text-base font-bold text-white">{p.title}</h2>
              <p className="text-xs leading-relaxed text-slate-300">{p.desc}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
