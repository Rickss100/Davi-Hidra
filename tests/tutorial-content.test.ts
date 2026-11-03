import { describe, it, expect } from 'vitest';
import {
  FULL_MANUAL_TEXT,
  FAQ_ITEMS,
  PROMPTS_IA,
  GROWTH_TEMPLATES
} from '@/components/tutorial/manual-content';

describe('Tutorial & AI Facilitators Content Verification', () => {
  it('contains comprehensive manual text covering Michelangelo, Antifrágil and Motor RDM', () => {
    expect(FULL_MANUAL_TEXT).toContain('Michelangelo');
    expect(FULL_MANUAL_TEXT).toContain('Carteira Antifrágil');
    expect(FULL_MANUAL_TEXT).toContain('Motor RDM');
    expect(FULL_MANUAL_TEXT).toContain('Reserva de Emergência');
    expect(FULL_MANUAL_TEXT).toContain('Magic Number');
    expect(FULL_MANUAL_TEXT).toContain('/carteira');
    expect(FULL_MANUAL_TEXT).toContain('/onde-aportar');
    expect(FULL_MANUAL_TEXT).toContain('/definir-objetivos');
    expect(FULL_MANUAL_TEXT).toContain('/reserva-emergencia');
    expect(FULL_MANUAL_TEXT).toContain('/renda-passiva');
    expect(FULL_MANUAL_TEXT).toContain('/radar');
    expect(FULL_MANUAL_TEXT).toContain('/historico');
    expect(FULL_MANUAL_TEXT).toContain('/resumo');
    expect(FULL_MANUAL_TEXT.length).toBeGreaterThan(1500);
  });

  it('contains valid and categorized FAQ items', () => {
    expect(FAQ_ITEMS.length).toBeGreaterThanOrEqual(5);
    for (const faq of FAQ_ITEMS) {
      expect(faq.q.length).toBeGreaterThan(10);
      expect(faq.a.length).toBeGreaterThan(20);
      expect(['iniciante', 'metodo', 'plataforma']).toContain(faq.category);
    }
  });

  it('contains AI prompt templates for NotebookLM and LLM mentors', () => {
    expect(PROMPTS_IA.length).toBeGreaterThanOrEqual(3);
    const notebookPrompt = PROMPTS_IA.find((p) => p.title.includes('NotebookLM'));
    expect(notebookPrompt).toBeDefined();
    expect(notebookPrompt?.prompt).toContain('Michelangelo');
    expect(notebookPrompt?.prompt).toContain('Motor RDM');
  });

  it('contains viral word-of-mouth growth templates for WhatsApp, LinkedIn and Video', () => {
    expect(GROWTH_TEMPLATES.length).toBeGreaterThanOrEqual(3);
    const whatsappTemplate = GROWTH_TEMPLATES.find((t) => t.channel.includes('WhatsApp'));
    expect(whatsappTemplate).toBeDefined();
    expect(whatsappTemplate?.text).toContain('MANTFRAI');
    expect(whatsappTemplate?.text).toContain('tutorial');

    const linkedinTemplate = GROWTH_TEMPLATES.find((t) => t.channel.includes('LinkedIn'));
    expect(linkedinTemplate).toBeDefined();
    expect(linkedinTemplate?.text).toContain('Michelangelo');
  });

  it('preserves the 30-lesson core curriculum for certification while keeping broker guides elective', async () => {
    const { TOTAL_LESSONS, ACADEMY_CURRICULUM } = await import('@/data/academy/curriculum');
    expect(TOTAL_LESSONS).toBe(30);
    const totalAulasCount = ACADEMY_CURRICULUM.reduce((acc, mod) => acc + mod.aulas.length, 0);
    expect(totalAulasCount).toBe(30);
  });
});
