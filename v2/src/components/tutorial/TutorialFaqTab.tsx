'use client';

import React, { useState } from 'react';
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react';
import { FAQ_ITEMS } from './manual-content';

export function TutorialFaqTab() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);
  const [filterCategory, setFilterCategory] = useState<'all' | 'iniciante' | 'metodo' | 'plataforma'>('all');

  const filtered = filterCategory === 'all'
    ? FAQ_ITEMS
    : FAQ_ITEMS.filter((f) => f.category === filterCategory);

  const toggle = (idx: number) => {
    setOpenIndex(openIndex === idx ? null : idx);
  };

  return (
    <div className="space-y-6">
      {/* Banner */}
      <div className="flex flex-wrap items-center justify-between gap-6 rounded-2xl border border-slate-800 bg-gradient-to-r from-[#0d1527] to-[#131f3b] p-6 shadow-xl">
        <div className="max-w-2xl space-y-2">
          <h2 className="text-xl font-extrabold text-white">
            Perguntas Frequentes (FAQ do Investidor)
          </h2>
          <p className="text-xs leading-relaxed text-slate-300">
            Respostas diretas e esclarecedoras para as dúvidas mais comuns de quem está trilhando o caminho da liberdade financeira.
          </p>
        </div>
        <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-400 border border-amber-500/20">
          <HelpCircle className="h-7 w-7" />
        </div>
      </div>

      {/* Filtro de Categorias */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => setFilterCategory('all')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filterCategory === 'all'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'border border-slate-800 bg-[#0d1527] text-slate-400 hover:text-white'
          }`}
        >
          Todas as Dúvidas
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('metodo')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filterCategory === 'metodo'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'border border-slate-800 bg-[#0d1527] text-slate-400 hover:text-white'
          }`}
        >
          Método DAVI & Hydra
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('iniciante')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filterCategory === 'iniciante'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'border border-slate-800 bg-[#0d1527] text-slate-400 hover:text-white'
          }`}
        >
          Iniciantes & Aportes
        </button>
        <button
          type="button"
          onClick={() => setFilterCategory('plataforma')}
          className={`rounded-xl px-3.5 py-1.5 text-xs font-semibold transition-colors ${
            filterCategory === 'plataforma'
              ? 'bg-emerald-600 text-white shadow-sm'
              : 'border border-slate-800 bg-[#0d1527] text-slate-400 hover:text-white'
          }`}
        >
          Segurança & Plataforma
        </button>
      </div>

      {/* Lista Accordion */}
      <div className="space-y-3">
        {filtered.map((item, index) => {
          const isOpen = openIndex === index;
          return (
            <div
              key={item.q}
              className={`rounded-2xl border transition-all ${
                isOpen
                  ? 'border-emerald-500/40 bg-[#0d1527] shadow-lg shadow-emerald-500/5'
                  : 'border-slate-800 bg-[#0d1527]/70 hover:border-slate-700'
              }`}
            >
              <button
                type="button"
                onClick={() => toggle(index)}
                className="flex w-full items-center justify-between p-4 text-left"
              >
                <span className="text-sm font-bold text-white pr-4">{item.q}</span>
                <span className="shrink-0 text-slate-400">
                  {isOpen ? (
                    <ChevronUp className="h-5 w-5 text-emerald-400" />
                  ) : (
                    <ChevronDown className="h-5 w-5" />
                  )}
                </span>
              </button>

              {isOpen && (
                <div className="border-t border-slate-800/80 px-4 pb-4 pt-3 text-xs leading-relaxed text-slate-300">
                  {item.a}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
