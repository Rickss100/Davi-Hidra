'use client';

import React from 'react';
import Link from 'next/link';
import { TrendingUp, Wallet, Coins, Shield, ArrowUpRight, UploadCloud } from 'lucide-react';
import { usePortfolioData } from '@/hooks/use-portfolio';
import { Card, Badge, Button, Skeleton } from '@/components/ui/primitives';
import { formatBRL, formatPercent } from '@/lib/money';
import { HomeCharts } from '@/components/dashboard/home-charts';

export default function HomeExecutivePage() {
  const { data, isLoading } = usePortfolioData();

  if (isLoading || !data) {
    return (
      <div className="space-y-6">
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[1, 2, 3, 4].map((k) => (
            <Skeleton key={k} className="h-32" />
          ))}
        </div>
        <div className="grid gap-6 lg:grid-cols-2">
          <Skeleton className="h-80" />
          <Skeleton className="h-80" />
        </div>
      </div>
    );
  }

  const { snapshot, context } = data;
  const isProfitPositive = snapshot.totalProfitBrl >= 0;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-white">
            Visão Executiva Patrimonial
          </h1>
          <p className="text-xs text-slate-400">
            Titular: <strong className="text-slate-200">{context.portfolioOwner.name}</strong> • Consolidação PostgreSQL em tempo real
          </p>
        </div>

        <div className="flex flex-wrap gap-2.5">
          <Link href="/historico">
            <Button variant="outline" size="sm">
              <UploadCloud className="h-4 w-4 text-gold-400" />
              Importar Planilha B3
            </Button>
          </Link>
          <Link href="/onde-aportar">
            <Button variant="gold" size="sm">
              Simular Próximo Aporte
              <ArrowUpRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </div>

      {/* KPIs Private Banking */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Card className="border-gold-500/25">
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Patrimônio Consolidado</span>
            <Wallet className="h-4 w-4 text-gold-400" />
          </div>
          <p className="money-value mt-2 text-2xl font-extrabold text-white">
            {formatBRL(snapshot.totalEquityBrl)}
          </p>
          <p className="money-value mt-1 text-xs text-slate-400">
            Custo investido: {formatBRL(snapshot.totalInvestedBrl)}
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Resultado de Capital</span>
            <TrendingUp className="h-4 w-4 text-emerald-400" />
          </div>
          <p
            className={`money-value mt-2 text-2xl font-extrabold ${
              isProfitPositive ? 'text-emerald-400' : 'text-rose-400'
            }`}
          >
            {isProfitPositive ? '+' : ''}
            {formatBRL(snapshot.totalProfitBrl)}
          </p>
          <div className="mt-1">
            <Badge tone={isProfitPositive ? 'emerald' : 'rose'}>
              {isProfitPositive ? '+' : ''}
              {formatPercent(snapshot.totalProfitPercent)} sobre o custo
            </Badge>
          </div>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Proventos (Últimos 12M)</span>
            <Coins className="h-4 w-4 text-gold-400" />
          </div>
          <p className="money-value mt-2 text-2xl font-extrabold text-white">
            {formatBRL(snapshot.passiveIncome.last12MonthsBrl)}
          </p>
          <p className="money-value mt-1 text-xs text-emerald-400">
            YoC Carteira: {formatPercent(snapshot.passiveIncome.portfolioYieldOnCostPercent)} a.a.
          </p>
        </Card>

        <Card>
          <div className="flex items-center justify-between text-xs text-slate-400">
            <span>Reserva de Emergência</span>
            <Shield className="h-4 w-4 text-sky-400" />
          </div>
          <p className="money-value mt-2 text-2xl font-extrabold text-white">
            {formatPercent(snapshot.emergencyReserve.reserveCompletionPercent, 1)}
          </p>
          <p className="money-value mt-1 text-xs text-slate-400">
            {snapshot.emergencyReserve.reserveMonthsCovered} meses cobertos de{' '}
            {snapshot.emergencyReserve.monthsTarget}
          </p>
        </Card>
      </div>

      {/* Gráficos Principais */}
      <HomeCharts snapshot={snapshot} />

      {/* Maiores Posições */}
      <Card>
        <div className="mb-4 flex items-center justify-between">
          <h2 className="text-base font-bold text-white">Principais Posições em Custódia</h2>
          <Link href="/carteira" className="text-xs font-semibold text-gold-400 hover:underline">
            Ver custódia completa →
          </Link>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="border-b border-slate-800 text-slate-400">
              <tr>
                <th className="pb-2.5 font-semibold">Ativo</th>
                <th className="pb-2.5 font-semibold">Classe</th>
                <th className="pb-2.5 text-right font-semibold">Qtd</th>
                <th className="pb-2.5 text-right font-semibold">Preço Médio</th>
                <th className="pb-2.5 text-right font-semibold">Cotação</th>
                <th className="pb-2.5 text-right font-semibold">Posição Atual</th>
                <th className="pb-2.5 text-right font-semibold">Peso</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-800/60">
              {snapshot.flatHoldings.slice(0, 8).map((h) => (
                <tr key={h.code} className="hover:bg-obsidian-800/40">
                  <td className="py-2.5 font-bold text-white">{h.code}</td>
                  <td className="py-2.5 uppercase text-slate-400">{h.category}</td>
                  <td className="money-value py-2.5 text-right text-slate-300">{h.quantity}</td>
                  <td className="money-value py-2.5 text-right text-slate-300">
                    {formatBRL(h.averagePrice)}
                  </td>
                  <td className="money-value py-2.5 text-right text-slate-200">
                    {formatBRL(h.currentPrice)}
                  </td>
                  <td className="money-value py-2.5 text-right font-semibold text-white">
                    {formatBRL(h.currentValueBrl)}
                  </td>
                  <td className="money-value py-2.5 text-right text-gold-300">
                    {formatPercent(h.portfolioWeightPercent)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
