'use client';

import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';

export type ColorTheme =
  | 'obsidian'
  | 'high_contrast'
  | 'deuteranopia'
  | 'protanopia'
  | 'tritanopia'
  | 'light_titanium';

export type FontScale = 'standard' | 'medium' | 'large' | 'extra_large';

export interface AccessibilityPreferences {
  colorTheme: ColorTheme;
  fontScale: FontScale;
  fontDyslexic: boolean;
  cursorMagnifier: boolean;
  magnifierZoom: number; // 1.5, 2.0, 2.5
  pageZoom: number; // 1.0, 1.15, 1.25, 1.5
  highlightClickTargets: boolean;
  clickToSpeech: boolean;
  speechRate: number; // 0.8 a 1.4
  reduceMotion: boolean;
}

export const DEFAULT_PREFERENCES: AccessibilityPreferences = {
  colorTheme: 'obsidian',
  fontScale: 'standard',
  fontDyslexic: false,
  cursorMagnifier: false,
  magnifierZoom: 2.0,
  pageZoom: 1.0,
  highlightClickTargets: false,
  clickToSpeech: false,
  speechRate: 1.0,
  reduceMotion: false
};

interface AccessibilityContextValue {
  preferences: AccessibilityPreferences;
  isDrawerOpen: boolean;
  openDrawer: () => void;
  closeDrawer: () => void;
  toggleDrawer: () => void;
  setColorTheme: (theme: ColorTheme) => void;
  setFontScale: (scale: FontScale) => void;
  toggleDyslexicFont: () => void;
  toggleCursorMagnifier: () => void;
  setMagnifierZoom: (zoom: number) => void;
  setPageZoom: (zoom: number) => void;
  toggleHighlightTargets: () => void;
  toggleClickToSpeech: () => void;
  setSpeechRate: (rate: number) => void;
  toggleReduceMotion: () => void;
  resetToDefaults: () => void;
}

const AccessibilityContext = createContext<AccessibilityContextValue | null>(null);

const STORAGE_KEY = 'norte_invest_accessibility_v2';

export function AccessibilityProvider({ children }: { children: React.ReactNode }) {
  const [preferences, setPreferences] = useState<AccessibilityPreferences>(DEFAULT_PREFERENCES);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // 1. Carrega preferências salvas no localStorage
  useEffect(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        const parsed = JSON.parse(saved);
        setPreferences((prev) => ({ ...prev, ...parsed }));
      }
    } catch (e) {
      console.warn('Erro ao carregar preferências de acessibilidade:', e);
    }
    setMounted(true);
  }, []);

  // 2. Aplica as variáveis e atributos no <html> sempre que o estado mudar
  useEffect(() => {
    if (!mounted) return;

    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences));
    } catch (e) {
      console.warn('Erro ao salvar preferências:', e);
    }

    const root = document.documentElement;

    // Tema de Cores e Classe Dark/Light
    root.setAttribute('data-theme', preferences.colorTheme);
    if (preferences.colorTheme === 'light_titanium') {
      root.classList.remove('dark');
      root.classList.add('light');
    } else {
      root.classList.add('dark');
      root.classList.remove('light');
    }

    // Zoom Geral da Interface (Página Inteira)
    const zoomVal = preferences.pageZoom || 1.0;
    if (zoomVal !== 1.0) {
      (root.style as any).zoom = String(zoomVal);
    } else {
      (root.style as any).zoom = '';
    }

    // Escala Tipográfica
    if (preferences.fontScale === 'standard') {
      root.removeAttribute('data-font-scale');
    } else {
      root.setAttribute('data-font-scale', preferences.fontScale);
    }

    // Dislexia
    if (preferences.fontDyslexic) {
      root.setAttribute('data-dyslexic', 'true');
    } else {
      root.removeAttribute('data-dyslexic');
    }

    // Realce de Clicáveis
    if (preferences.highlightClickTargets) {
      root.setAttribute('data-highlight-targets', 'true');
    } else {
      root.removeAttribute('data-highlight-targets');
    }

    // Redução de Movimento
    if (preferences.reduceMotion) {
      root.setAttribute('data-reduce-motion', 'true');
    } else {
      root.removeAttribute('data-reduce-motion');
    }
  }, [preferences, mounted]);

  const openDrawer = () => setIsDrawerOpen(true);
  const closeDrawer = () => setIsDrawerOpen(false);
  const toggleDrawer = () => setIsDrawerOpen((prev) => !prev);

  const setColorTheme = (colorTheme: ColorTheme) => {
    setPreferences((prev) => ({ ...prev, colorTheme }));
  };

  const setFontScale = (fontScale: FontScale) => {
    setPreferences((prev) => ({ ...prev, fontScale }));
  };

  const toggleDyslexicFont = () => {
    setPreferences((prev) => ({ ...prev, fontDyslexic: !prev.fontDyslexic }));
  };

  const toggleCursorMagnifier = () => {
    setPreferences((prev) => ({ ...prev, cursorMagnifier: !prev.cursorMagnifier }));
  };

  const setMagnifierZoom = (magnifierZoom: number) => {
    setPreferences((prev) => ({ ...prev, magnifierZoom }));
  };

  const setPageZoom = (pageZoom: number) => {
    setPreferences((prev) => ({ ...prev, pageZoom }));
  };

  const toggleHighlightTargets = () => {
    setPreferences((prev) => ({ ...prev, highlightClickTargets: !prev.highlightClickTargets }));
  };

  const toggleClickToSpeech = () => {
    setPreferences((prev) => ({ ...prev, clickToSpeech: !prev.clickToSpeech }));
  };

  const setSpeechRate = (speechRate: number) => {
    setPreferences((prev) => ({ ...prev, speechRate }));
  };

  const toggleReduceMotion = () => {
    setPreferences((prev) => ({ ...prev, reduceMotion: !prev.reduceMotion }));
  };

  const resetToDefaults = () => {
    setPreferences(DEFAULT_PREFERENCES);
    const root = document.documentElement;
    (root.style as any).zoom = '';
  };

  const value = useMemo(
    () => ({
      preferences,
      isDrawerOpen,
      openDrawer,
      closeDrawer,
      toggleDrawer,
      setColorTheme,
      setFontScale,
      toggleDyslexicFont,
      toggleCursorMagnifier,
      setMagnifierZoom,
      setPageZoom,
      toggleHighlightTargets,
      toggleClickToSpeech,
      setSpeechRate,
      toggleReduceMotion,
      resetToDefaults
    }),
    [preferences, isDrawerOpen]
  );

  return (
    <AccessibilityContext.Provider value={value}>
      {children}
    </AccessibilityContext.Provider>
  );
}

export function useAccessibility() {
  const context = useContext(AccessibilityContext);
  if (!context) {
    throw new Error('useAccessibility deve ser utilizado dentro de um AccessibilityProvider.');
  }
  return context;
}
