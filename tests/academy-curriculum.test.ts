import { describe, it, expect } from 'vitest';
import {
  ACADEMY_CURRICULUM,
  TOTAL_LESSONS,
  getLessonById,
  getModuleById,
} from '../src/data/academy/curriculum';

describe('Academia Norte Invest — Currículo & Aulas do Método DAVI & Hydra', () => {
  it('deve conter exatamente 8 módulos estruturados', () => {
    expect(ACADEMY_CURRICULUM).toHaveLength(8);
  });

  it('deve conter um total de 30 aulas completas', () => {
    expect(TOTAL_LESSONS).toBe(30);
  });

  it('cada módulo deve possuir metadados válidos e pelo menos 2 aulas', () => {
    ACADEMY_CURRICULUM.forEach((modulo) => {
      expect(modulo.id).toBeDefined();
      expect(modulo.numero).toBeGreaterThan(0);
      expect(modulo.titulo).toBeTruthy();
      expect(modulo.subtitulo).toBeTruthy();
      expect(modulo.descricao).toBeTruthy();
      expect(modulo.aulas.length).toBeGreaterThanOrEqual(2);
    });
  });

  it('cada aula deve possuir conteúdo Markdown, título, número e prompt para o NotebookLM', () => {
    ACADEMY_CURRICULUM.forEach((modulo) => {
      modulo.aulas.forEach((aula) => {
        expect(aula.id).toBeTruthy();
        expect(aula.moduloId).toBe(modulo.id);
        expect(aula.titulo).toBeTruthy();
        expect(aula.numeroAula).toBeTruthy();
        expect(aula.duracaoLeitura).toContain('min');
        expect(aula.content.length).toBeGreaterThan(200);
        expect(aula.promptNotebookLM.length).toBeGreaterThan(30);
      });
    });
  });

  it('deve buscar corretamente uma aula específica por ID', () => {
    const aula1 = getLessonById('mod-1-aula-1');
    expect(aula1).toBeDefined();
    expect(aula1?.titulo).toContain('Tripé Patrimonial');

    const aulaDavi = getLessonById('mod-4-aula-5');
    expect(aulaDavi).toBeDefined();
    expect(aulaDavi?.titulo).toContain('Escultura de Michelangelo');
  });

  it('deve buscar corretamente um módulo por ID', () => {
    const mod4 = getModuleById('modulo-4');
    expect(mod4).toBeDefined();
    expect(mod4?.titulo).toContain('Método DAVI');
    expect(mod4?.aulas).toHaveLength(6);
  });
});
