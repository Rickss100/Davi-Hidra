import { describe, it, expect } from 'vitest';
import { DEFAULT_PREFERENCES } from '@/contexts/accessibility-context';
import {
  formatFinancialTextForSpeech,
  extractNodeReadableText
} from '@/lib/accessibility/speech-engine';

describe('Accessibility & Settings Suite (WCAG AAA)', () => {
  it('verifies default preferences configuration', () => {
    expect(DEFAULT_PREFERENCES.colorTheme).toBe('obsidian');
    expect(DEFAULT_PREFERENCES.fontScale).toBe('standard');
    expect(DEFAULT_PREFERENCES.fontDyslexic).toBe(false);
    expect(DEFAULT_PREFERENCES.cursorMagnifier).toBe(false);
    expect(DEFAULT_PREFERENCES.magnifierZoom).toBe(2.0);
    expect(DEFAULT_PREFERENCES.pageZoom).toBe(1.0);
    expect(DEFAULT_PREFERENCES.clickToSpeech).toBe(false);
    expect(DEFAULT_PREFERENCES.speechRate).toBe(1.0);
    expect(DEFAULT_PREFERENCES.reduceMotion).toBe(false);
  });

  describe('Financial Speech Engine (PT-BR Text-to-Speech)', () => {
    it('converts Brazilian Real currency values into spoken phonetic Brazilian Portuguese', () => {
      expect(formatFinancialTextForSpeech('R$ 1.500,00')).toBe('1500 reais');
      expect(formatFinancialTextForSpeech('R$ 29.207,56')).toBe('29207 reais e 56 centavos');
      expect(formatFinancialTextForSpeech('R$ 100,05')).toBe('100 reais e 5 centavos');
    });

    it('converts positive and negative return percentages into clear spoken words', () => {
      expect(formatFinancialTextForSpeech('+16,94%')).toBe('mais 16 vírgula 94 por cento');
      expect(formatFinancialTextForSpeech('-4,13%')).toBe('menos 4 vírgula 13 por cento');
      expect(formatFinancialTextForSpeech('10,5%')).toBe('10 vírgula 5 por cento');
    });

    it('spells out B3 stock and FII tickers for natural pronunciation', () => {
      expect(formatFinancialTextForSpeech('PETR4')).toBe('P E T R 4');
      expect(formatFinancialTextForSpeech('VALE3')).toBe('V A L E 3');
      expect(formatFinancialTextForSpeech('MXRF11')).toBe('M X R F 11');
      expect(formatFinancialTextForSpeech('HGLG11')).toBe('H G L G 11');
    });

    it('expands financial acronyms into full terms', () => {
      expect(formatFinancialTextForSpeech('FIIs')).toBe('Fundos Imobiliários');
      expect(formatFinancialTextForSpeech('CDI')).toBe('C D I');
      expect(formatFinancialTextForSpeech('IPCA')).toBe('I P C A');
      expect(formatFinancialTextForSpeech('P/L')).toBe('P sobre L');
      expect(formatFinancialTextForSpeech('P/VP')).toBe('P sobre V P');
    });
  });

  describe('Node Readable Text Extractor', () => {
    it('prioritizes aria-label over inner text', () => {
      const el = {
        tagName: 'DIV',
        getAttribute: (attr: string) => (attr === 'aria-label' ? 'Patrimônio Consolidado' : null),
        innerText: 'R$ 20.000',
        textContent: 'R$ 20.000'
      } as unknown as HTMLElement;

      expect(extractNodeReadableText(el)).toBe('Patrimônio Consolidado');
    });

    it('prefixes role description for button elements', () => {
      const btn = {
        tagName: 'BUTTON',
        getAttribute: () => null,
        innerText: 'Salvar Alterações',
        textContent: 'Salvar Alterações'
      } as unknown as HTMLElement;

      expect(extractNodeReadableText(btn)).toBe('Botão: Salvar Alterações');
    });
  });
});
