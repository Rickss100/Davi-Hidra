'use client';

import React, { useState } from 'react';
import {
  GraduationCap,
  BookOpen,
  Layers,
  HelpCircle,
  Headphones,
  Share2
} from 'lucide-react';
import { TutorialHeader } from '@/components/tutorial/TutorialHeader';
import { AcademyTab } from '@/components/tutorial/AcademyTab';
import { TutorialMethodTab } from '@/components/tutorial/TutorialMethodTab';
import { TutorialManualTab } from '@/components/tutorial/TutorialManualTab';
import { TutorialFaqTab } from '@/components/tutorial/TutorialFaqTab';
import { TutorialNotebookLMTab } from '@/components/tutorial/TutorialNotebookLMTab';
import { TutorialGrowthTab } from '@/components/tutorial/TutorialGrowthTab';

type TabId = 'academia' | 'metodo' | 'manual' | 'faq' | 'notebooklm' | 'growth';

export default function TutorialPage() {
  const [activeTab, setActiveTab] = useState<TabId>('academia');
  const [feedback, setFeedback] = useState('');

  const showFeedback = (msg: string) => {
    setFeedback(msg);
    setTimeout(() => setFeedback(''), 4500);
  };

  return (
    <div className="space-y-6">
      {/* Cabeçalho Oficial */}
      <TutorialHeader onFeedback={showFeedback} />

      {feedback && (
        <div className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-3 text-xs font-semibold text-emerald-300">
          {feedback}
        </div>
      )}

      {/* Navegação entre Abas */}
      <div className="flex border-b border-slate-800/80 overflow-x-auto gap-2 pb-1 scrollbar-none">
        <button
          type="button"
          onClick={() => setActiveTab('academia')}
          className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'academia'
              ? 'border-emerald-500 text-emerald-400 bg-emerald-500/5'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <GraduationCap className="h-4 w-4 text-emerald-400" />
          <span>🎓 Academia Norte Invest (30 Aulas)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('metodo')}
          className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'metodo'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <BookOpen className="h-4 w-4" />
          <span>1. O Método & Filosofia</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('manual')}
          className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'manual'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Layers className="h-4 w-4" />
          <span>2. Manual do Aplicativo</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('faq')}
          className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'faq'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <HelpCircle className="h-4 w-4" />
          <span>3. Perguntas Frequentes (FAQ)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('notebooklm')}
          className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'notebooklm'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Headphones className="h-4 w-4" />
          <span>4. Gerar Podcast (NotebookLM)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('growth')}
          className={`inline-flex items-center gap-2 whitespace-nowrap border-b-2 px-4 py-3 text-xs font-bold transition-all ${
            activeTab === 'growth'
              ? 'border-emerald-500 text-emerald-400'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          <Share2 className="h-4 w-4" />
          <span>5. Divulgação Boca a Boca</span>
        </button>
      </div>

      {/* Conteúdo Dinâmico da Aba Selecionada */}
      {activeTab === 'academia' && <AcademyTab />}
      {activeTab === 'metodo' && <TutorialMethodTab />}
      {activeTab === 'manual' && <TutorialManualTab />}
      {activeTab === 'faq' && <TutorialFaqTab />}
      {activeTab === 'notebooklm' && <TutorialNotebookLMTab onFeedback={showFeedback} />}
      {activeTab === 'growth' && <TutorialGrowthTab onFeedback={showFeedback} />}
    </div>
  );
}
