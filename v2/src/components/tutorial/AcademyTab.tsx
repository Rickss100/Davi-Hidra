'use client';

import React, { useState, useEffect, useMemo } from 'react';
import {
  GraduationCap,
  CheckCircle2,
  Circle,
  Play,
  ChevronDown,
  ChevronUp,
  Award,
  BookOpen,
  Clock,
  Sparkles,
  ArrowRight,
  RotateCcw
} from 'lucide-react';
import {
  ACADEMY_CURRICULUM,
  TOTAL_LESSONS,
  type AcademyLesson,
  type AcademyModule
} from '@/data/academy/curriculum';
import { LessonViewerModal } from './LessonViewerModal';

const STORAGE_KEY = 'norte_invest_academy_completed_lessons';

export function AcademyTab() {
  const [completedLessons, setCompletedLessons] = useState<string[]>([]);
  const [expandedModules, setExpandedModules] = useState<Record<string, boolean>>({
    'modulo-1': true,
  });
  const [activeLesson, setActiveLesson] = useState<AcademyLesson | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoaded, setIsLoaded] = useState(false);

  // Carregar progresso do localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        setCompletedLessons(JSON.parse(saved));
      }
    } catch {
      // Silencioso se der erro no storage
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Salvar progresso
  const saveProgress = (newCompleted: string[]) => {
    setCompletedLessons(newCompleted);
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(newCompleted));
    } catch {
      // Silencioso
    }
  };

  const toggleLessonCompleted = (lessonId: string) => {
    if (completedLessons.includes(lessonId)) {
      saveProgress(completedLessons.filter((id) => id !== lessonId));
    } else {
      saveProgress([...completedLessons, lessonId]);
    }
  };

  const handleResetProgress = () => {
    if (window.confirm('Deseja reiniciar a sua barra de progresso de estudos para 0%?')) {
      saveProgress([]);
    }
  };

  const toggleModuleExpanded = (modId: string) => {
    setExpandedModules((prev) => ({
      ...prev,
      [modId]: !prev[modId],
    }));
  };

  // Estatísticas de Progresso
  const progressPercent = useMemo(() => {
    if (TOTAL_LESSONS === 0) return 0;
    return Math.min(100, Math.round((completedLessons.length / TOTAL_LESSONS) * 100));
  }, [completedLessons]);

  const levelBadge = useMemo(() => {
    if (progressPercent === 100) return { label: '👑 Mestre do Ponto Mágico', color: 'text-amber-400 border-amber-500/30 bg-amber-500/10' };
    if (progressPercent >= 75) return { label: '💎 Escultor de Riqueza', color: 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10' };
    if (progressPercent >= 50) return { label: '🐉 Estrategista Hydra', color: 'text-teal-400 border-teal-500/30 bg-teal-500/10' };
    if (progressPercent >= 25) return { label: '🛡️ Construtor de Defesa', color: 'text-blue-400 border-blue-500/30 bg-blue-500/10' };
    return { label: '🌱 Aprendiz do Método', color: 'text-slate-300 border-slate-700 bg-slate-800/40' };
  }, [progressPercent]);

  // Lista linear de todas as aulas para navegação
  const allLessons = useMemo(() => {
    return ACADEMY_CURRICULUM.flatMap((m) => m.aulas);
  }, []);

  const openLesson = (lesson: AcademyLesson) => {
    setActiveLesson(lesson);
    setIsModalOpen(true);
  };

  const currentLessonIndex = useMemo(() => {
    if (!activeLesson) return -1;
    return allLessons.findIndex((l) => l.id === activeLesson.id);
  }, [activeLesson, allLessons]);

  const handleNavigateLesson = (direction: 'prev' | 'next') => {
    if (currentLessonIndex === -1) return;
    const nextIdx = direction === 'next' ? currentLessonIndex + 1 : currentLessonIndex - 1;
    if (nextIdx >= 0 && nextIdx < allLessons.length) {
      const nextLesson = allLessons[nextIdx];
      if (nextLesson) setActiveLesson(nextLesson);
    }
  };

  // Primeira aula pendente
  const nextPendingLesson = useMemo(() => {
    return allLessons.find((l) => !completedLessons.includes(l.id)) || allLessons[0];
  }, [allLessons, completedLessons]);

  return (
    <div className="space-y-6 animate-in fade-in duration-300">
      {/* Banner Principal de Progresso & Gamificação */}
      <div className="relative overflow-hidden rounded-2xl border border-emerald-500/30 bg-gradient-to-br from-slate-900 via-slate-950 to-emerald-950/30 p-6 sm:p-8 shadow-xl">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-xl">
            <div className="flex items-center gap-2">
              <span className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-xs font-bold tracking-wide ${levelBadge.color}`}>
                <Award className="h-3.5 w-3.5" />
                {levelBadge.label}
              </span>
              <span className="text-xs font-medium text-slate-400">
                {completedLessons.length} de {TOTAL_LESSONS} Aulas
              </span>
            </div>

            <h1 className="text-xl sm:text-2xl font-black text-white tracking-tight">
              Academia Norte Invest: Método DAVI & Mecanismo Hydra
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Currículo master de formação de investidores. Aprenda passo a passo a construir seu império patrimonial com aulas práticas, infográficos e geração de podcasts.
            </p>
          </div>

          <div className="flex flex-col sm:flex-row md:flex-col items-start md:items-end gap-3 w-full md:w-auto">
            {nextPendingLesson && (
              <button
                type="button"
                onClick={() => openLesson(nextPendingLesson)}
                className="w-full sm:w-auto inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-5 py-3 text-xs sm:text-sm font-bold text-slate-950 hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Play className="h-4 w-4 fill-slate-950" />
                <span>
                  {completedLessons.length === 0 ? 'Começar Primeira Aula' : 'Continuar de Onde Parou'}
                </span>
                <ArrowRight className="h-4 w-4" />
              </button>
            )}

            {completedLessons.length > 0 && (
              <button
                type="button"
                onClick={handleResetProgress}
                className="inline-flex items-center gap-1.5 text-[11px] font-medium text-slate-400 hover:text-slate-200 transition-colors"
              >
                <RotateCcw className="h-3 w-3" />
                <span>Reiniciar Progresso</span>
              </button>
            )}
          </div>
        </div>

        {/* Barra de Progresso Visual de 0% a 100% */}
        <div className="relative z-10 mt-6 pt-6 border-t border-slate-800/80 space-y-2">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="text-slate-300 flex items-center gap-1.5">
              <Sparkles className="h-3.5 w-3.5 text-emerald-400" />
              Progresso Curricular Geral
            </span>
            <span className="text-emerald-400">{progressPercent}% Concluído</span>
          </div>

          <div className="relative h-3 w-full overflow-hidden rounded-full bg-slate-900 border border-slate-800">
            <div
              className="h-full rounded-full bg-gradient-to-r from-teal-500 via-emerald-400 to-emerald-300 transition-all duration-700 ease-out shadow-sm"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
        </div>
      </div>

      {/* Grade de Módulos Expansíveis */}
      <div className="space-y-4">
        {ACADEMY_CURRICULUM.map((mod: AcademyModule) => {
          const isExpanded = !!expandedModules[mod.id];
          const moduleCompletedCount = mod.aulas.filter((a) => completedLessons.includes(a.id)).length;
          const isModuleFullyComplete = moduleCompletedCount === mod.aulas.length && mod.aulas.length > 0;
          const modulePercent = Math.round((moduleCompletedCount / mod.aulas.length) * 100);

          return (
            <div
              key={mod.id}
              className={`rounded-2xl border transition-all duration-200 overflow-hidden ${
                isModuleFullyComplete
                  ? 'border-emerald-500/40 bg-slate-950/80'
                  : 'border-slate-800/80 bg-slate-950/60 hover:border-slate-700'
              }`}
            >
              {/* Header do Card do Módulo (Clicável para expandir) */}
              <button
                type="button"
                onClick={() => toggleModuleExpanded(mod.id)}
                className="w-full flex items-center justify-between p-5 text-left transition-colors hover:bg-slate-900/40"
              >
                <div className="flex items-start sm:items-center gap-4">
                  <div
                    className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border font-black text-sm ${
                      isModuleFullyComplete
                        ? 'border-emerald-500/40 bg-emerald-500/10 text-emerald-400'
                        : 'border-slate-800 bg-slate-900 text-slate-300'
                    }`}
                  >
                    {isModuleFullyComplete ? <CheckCircle2 className="h-5 w-5 text-emerald-400" /> : `0${mod.numero}`}
                  </div>

                  <div className="space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-[11px] font-bold text-emerald-400 tracking-wider uppercase">
                        {mod.subtitulo}
                      </span>
                      {isModuleFullyComplete && (
                        <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-2 py-0.5 text-[10px] font-bold text-emerald-400">
                          100% Concluído ✓
                        </span>
                      )}
                    </div>
                    <h3 className="text-sm sm:text-base font-bold text-white">{mod.titulo}</h3>
                    <p className="text-xs text-slate-400 line-clamp-1">{mod.descricao}</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 shrink-0 ml-4">
                  <div className="hidden sm:flex flex-col items-end gap-1">
                    <span className="text-[11px] font-semibold text-slate-300">
                      {moduleCompletedCount} / {mod.aulas.length} Aulas
                    </span>
                    <div className="w-20 h-1.5 rounded-full bg-slate-900 border border-slate-800 overflow-hidden">
                      <div
                        className="h-full bg-emerald-400 transition-all duration-500"
                        style={{ width: `${modulePercent}%` }}
                      />
                    </div>
                  </div>
                  <span className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-800 transition-colors">
                    {isExpanded ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
                  </span>
                </div>
              </button>

              {/* Lista de Aulas do Módulo */}
              {isExpanded && (
                <div className="border-t border-slate-800/80 bg-slate-900/30 divide-y divide-slate-800/50">
                  {mod.aulas.map((lesson) => {
                    const isCompleted = completedLessons.includes(lesson.id);

                    return (
                      <div
                        key={lesson.id}
                        className="flex items-center justify-between p-4 sm:px-6 hover:bg-slate-900/60 transition-colors gap-3"
                      >
                        <div className="flex items-center gap-3.5 min-w-0">
                          <button
                            type="button"
                            onClick={() => toggleLessonCompleted(lesson.id)}
                            className="text-slate-500 hover:text-emerald-400 transition-colors shrink-0"
                            title={isCompleted ? 'Desmarcar conclusão' : 'Marcar como concluída'}
                            aria-label={`Marcar aula ${lesson.numeroAula} como concluída`}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                            ) : (
                              <Circle className="h-5 w-5 text-slate-600 hover:text-slate-400" />
                            )}
                          </button>

                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-mono font-bold text-slate-400">
                                Aula {lesson.numeroAula}
                              </span>
                              <span className="inline-flex items-center gap-1 text-[11px] text-slate-500">
                                <Clock className="h-3 w-3" />
                                {lesson.duracaoLeitura}
                              </span>
                            </div>
                            <h4
                              onClick={() => openLesson(lesson)}
                              className={`text-xs sm:text-sm font-semibold cursor-pointer truncate transition-colors ${
                                isCompleted
                                  ? 'text-slate-300 hover:text-white line-through decoration-slate-600'
                                  : 'text-white hover:text-emerald-400'
                              }`}
                            >
                              {lesson.titulo}
                            </h4>
                          </div>
                        </div>

                        <div className="shrink-0">
                          <button
                            type="button"
                            onClick={() => openLesson(lesson)}
                            className={`inline-flex items-center gap-1.5 rounded-xl px-3 py-1.5 text-xs font-bold transition-all ${
                              isCompleted
                                ? 'border border-slate-700 bg-slate-800/40 text-slate-300 hover:bg-slate-800 hover:text-white'
                                : 'bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/20'
                            }`}
                          >
                            <BookOpen className="h-3.5 w-3.5" />
                            <span className="hidden sm:inline">
                              {isCompleted ? 'Revisar' : 'Estudar Aula'}
                            </span>
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Modal Leitor Imersivo da Aula */}
      <LessonViewerModal
        lesson={activeLesson}
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        isCompleted={activeLesson ? completedLessons.includes(activeLesson.id) : false}
        onToggleCompleted={toggleLessonCompleted}
        onNavigateLesson={handleNavigateLesson}
        hasPrev={currentLessonIndex > 0}
        hasNext={currentLessonIndex < allLessons.length - 1}
      />
    </div>
  );
}
