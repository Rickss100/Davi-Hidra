'use client';

import { useEffect, useRef } from 'react';
import { useAccessibility } from '@/contexts/accessibility-context';
import { speakText, stopSpeech, extractNodeReadableText } from './speech-engine';

export function useClickToSpeech() {
  const { preferences } = useAccessibility();
  const highlightedElRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!preferences.clickToSpeech) {
      stopSpeech();
      if (highlightedElRef.current) {
        highlightedElRef.current.classList.remove('speech-highlight-active');
        highlightedElRef.current = null;
      }
      return;
    }

    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target) return;

      // Não ler cliques dentro do próprio Drawer de acessibilidade para evitar eco na interface de configuração
      if (target.closest('[data-accessibility-drawer="true"]')) return;

      const readableText = extractNodeReadableText(target);
      if (!readableText || readableText.length < 2) return;

      // Remove destaque anterior
      if (highlightedElRef.current) {
        highlightedElRef.current.classList.remove('speech-highlight-active');
      }

      // Aplica destaque visual no elemento que está sendo lido
      target.classList.add('speech-highlight-active');
      highlightedElRef.current = target;

      speakText(readableText, {
        rate: preferences.speechRate,
        onEnd: () => {
          if (highlightedElRef.current === target) {
            target.classList.remove('speech-highlight-active');
            highlightedElRef.current = null;
          }
        }
      });
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      // Pressionar Esc interrompe a leitura imediatamente
      if (e.key === 'Escape') {
        stopSpeech();
        if (highlightedElRef.current) {
          highlightedElRef.current.classList.remove('speech-highlight-active');
          highlightedElRef.current = null;
        }
      }
    };

    document.addEventListener('click', handleClick, { capture: true });
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      document.removeEventListener('click', handleClick, { capture: true });
      window.removeEventListener('keydown', handleKeyDown);
      stopSpeech();
      if (highlightedElRef.current) {
        highlightedElRef.current.classList.remove('speech-highlight-active');
      }
    };
  }, [preferences.clickToSpeech, preferences.speechRate]);
}
