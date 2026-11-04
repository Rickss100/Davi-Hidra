import { describe, it, expect } from 'vitest';
import {
  detectAiIntent,
  generateLocalAiResponse,
  PortfolioAiContext
} from '@/server/engines/mantfrai-ai.engine';
import { formatBRL } from '@/lib/money';

describe('MANTFRAI AI Engine - Classificação Semântica e Respostas Inteligentes', () => {
  const mockContext: PortfolioAiContext = {
    userName: 'Ricardo Arthur',
    totalEquityBrl: 150000,
    totalInvestedBrl: 120000,
    totalProfitBrl: 30000,
    totalProfitPercent: 25,
    last12MonthsIncomeBrl: 12500,
    yieldOnCostPercent: 10.41,
    emergencyReserveCompletedPercent: 100,
    emergencyReserveStatus: 'Meta Atingida',
    underweightCategoryName: 'Ações Brasil',
    underweightCategoryDistance: 14.5,
    topHoldings: 'ITSA4 (18%), BBSE3 (15%), TAEE11 (12%)'
  };

  it('classifica corretamente perguntas de navegação para configurações e acessibilidade', () => {
    const questions = [
      'onde fica a aba de configuraçao',
      'onde fica a aba de configuracao',
      'onde mudo o tema do app',
      'como ativar o modo claro',
      'como ligar a lupa',
      'onde altero minha senha',
      'como configurar 2fa'
    ];

    for (const q of questions) {
      expect(detectAiIntent(q)).toBe('SETTINGS_ACCESSIBILITY');
      const response = generateLocalAiResponse(q, mockContext);
      expect(response).toContain('Configurações & Acessibilidade');
      expect(response).toContain('Engrenagem (⚙️)');
      expect(response).toContain('Menu Lateral');
      expect(response).not.toContain('seu patrimônio consolidado está em');
    }
  });

  it('classifica corretamente perguntas sobre o simulador Onde Aportar e Motor RDM', () => {
    const questions = [
      'onde aportar este mes?',
      'como funciona o simulador de aporte',
      'o que o motor rdm faz?',
      'qual ativo comprar agora?'
    ];

    for (const q of questions) {
      expect(detectAiIntent(q)).toBe('WHERE_TO_INVEST');
      const response = generateLocalAiResponse(q, mockContext);
      expect(response).toContain('Onde Aportar');
      expect(response).toContain('Motor RDM');
      expect(response).toContain('Ações Brasil');
    }
  });

  it('classifica perguntas sobre a metodologia MANTFRAI e filosofia de Michelangelo', () => {
    const questions = [
      'o que e o metodo mantfrai?',
      'quem e michelangelo?',
      'o que sao os setores best?',
      'qual a ideia da estrategia barbell?'
    ];

    for (const q of questions) {
      expect(detectAiIntent(q)).toBe('METHODOLOGY_PHILOSOPHY');
      const response = generateLocalAiResponse(q, mockContext);
      expect(response).toContain('Michelangelo');
      expect(response).toContain('Setores BEST');
    }
  });

  it('classifica perguntas sobre o Radar de Ativos e indicadores fundamentalistas', () => {
    const questions = [
      'como funciona o radar de ativos',
      'o que significa pl e roe?',
      'como filtrar acoes baratas',
      'onde analiso no fundamentus?'
    ];

    for (const q of questions) {
      expect(detectAiIntent(q)).toBe('RADAR_FILTERS');
      const response = generateLocalAiResponse(q, mockContext);
      expect(response).toContain('Radar de Ativos');
      expect(response).toContain('Fundamentus');
      expect(response).toContain('Status Invest');
    }
  });

  it('responde com dados reais da carteira quando perguntado sobre patrimônio/carteira', () => {
    const questions = [
      'como esta minha carteira?',
      'analise da minha carteira',
      'qual meu patrimonio atual?'
    ];

    for (const q of questions) {
      expect(detectAiIntent(q)).toBe('PORTFOLIO_ANALYSIS');
      const response = generateLocalAiResponse(q, mockContext);
      expect(response).toContain('Ricardo Arthur');
      expect(response).toContain(formatBRL(mockContext.totalEquityBrl));
      expect(response).toContain(formatBRL(mockContext.last12MonthsIncomeBrl));
      expect(response).toContain('ITSA4');
    }
  });

  it('saudações trazem menu de ajuda com opções úteis', () => {
    const questions = ['oi', 'olá!', 'bom dia', 'quem é você?'];

    for (const q of questions) {
      expect(detectAiIntent(q)).toBe('GREETINGS');
      const response = generateLocalAiResponse(q, mockContext);
      expect(response).toContain('MANTFRAI AI');
      expect(response).toContain('Ricardo Arthur');
      expect(response).toContain('Onde fica a aba de configuração?');
    }
  });
});
