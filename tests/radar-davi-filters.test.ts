import { describe, it, expect } from 'vitest';
import { matchesDaviFilterMap, ComprehensiveRadarItem } from '../src/components/radar/radar-matcher';
import { PRESETS } from '../src/components/radar/davi-sidebar-filters';

describe('Radar DAVI Filters Matcher', () => {
  const sampleAcao: ComprehensiveRadarItem = {
    code: 'BBAS3',
    name: 'Banco do Brasil',
    type: 'Ações',
    category: 'acoes',
    market: 'B3',
    sector: 'Financeiro',
    price: 28.5,
    peRatio: 4.8,
    pbRatio: 0.85,
    pVpa: 0.85,
    dividendYield: 9.8,
    roe: 21.5,
    roic: 18.0,
    roa: 2.1,
    debtToEquity: 0.0,
    currentRatio: 1.5,
    netDebtEbitda: 0.5,
    ebitMargin: 35.0,
    profitMargin: 20.0,
    evEbit: 4.2,
    evEbitda: 3.9,
    psr: 0.9,
    revenueGrowth: 8.5,
    revenueGrowth5y: 12.0,
    earningsGrowth: 15.0,
    payoutRatio: 45.0,
    marketCap: 80000,
    vacancyRate: null,
    capRate: null,
    ffoYield: null,
    liquidity: 50000000,
    propertyCount: null,
    pricePerSqm: null,
    rentPerSqm: null,
    rateFixed: null,
    rateDescription: null,
    liquidityType: null,
    minInvestment: null,
    userRating: 5,
    userNotes: 'Excelente pagadora',
  };

  it('deve aprovar BBAS3 no Perfil Moderado da V1', () => {
    const filters = PRESETS.moderado.filters.acoes ?? {};
    const matches = matchesDaviFilterMap(sampleAcao, filters);
    expect(matches).toBe(true);
  });

  it('deve reprovar ativo com P/L acima do teto estipulado', () => {
    const highPeAcao = { ...sampleAcao, peRatio: 22.0 };
    const filters = { pe_ratio: { min: 0.01, max: 15 } };
    expect(matchesDaviFilterMap(highPeAcao, filters)).toBe(false);
  });

  it('deve reprovar ativo com DY menor que o mínimo', () => {
    const lowDyAcao = { ...sampleAcao, dividendYield: 1.5 };
    const filters = { dividend_yield: { min: 4 } };
    expect(matchesDaviFilterMap(lowDyAcao, filters)).toBe(false);
  });

  it('deve filtrar corretamente FIIs com vacância e cap rate', () => {
    const sampleFii: ComprehensiveRadarItem = {
      ...sampleAcao,
      code: 'HGLG11',
      name: 'CSHG Logística',
      type: 'FIIs',
      category: 'fiis',
      vacancyRate: 5.2,
      capRate: 9.1,
      ffoYield: 8.5,
      pbRatio: 0.98,
      pVpa: 0.98,
    };

    // Filtro de FII: vacância máxima 10% e DY mínimo 7%
    const fiiFilter = {
      vacancy_rate: { max: 10 },
      dividend_yield: { min: 7 },
    };
    expect(matchesDaviFilterMap(sampleFii, fiiFilter)).toBe(true);

    // Reprovação se vacância ultrapassar
    const altaVacancia = { ...sampleFii, vacancyRate: 15.0 };
    expect(matchesDaviFilterMap(altaVacancia, fiiFilter)).toBe(false);
  });

  it('deve filtrar por nota mínima do usuário', () => {
    const starFilter = { user_rating: { min: 4 } };
    expect(matchesDaviFilterMap(sampleAcao, starFilter)).toBe(true);

    const unratedAcao = { ...sampleAcao, userRating: 2 };
    expect(matchesDaviFilterMap(unratedAcao, starFilter)).toBe(false);
  });

  describe('Novos Filtros do Método DAVI (Alinhados às 30 Aulas da Academia)', () => {
    it('deve aprovar ações Novo Mercado (Tag Along 100%) e reprovar PN sem tag along', () => {
      const filterNM = { only_novo_mercado: true };
      expect(matchesDaviFilterMap(sampleAcao, filterNM)).toBe(true); // BBAS3 é Novo Mercado

      const acaoPN = { ...sampleAcao, code: 'PETR4', name: 'Petrobras PN' };
      expect(matchesDaviFilterMap(acaoPN, filterNM)).toBe(false);
    });

    it('deve filtrar setores perenes BEST (Bancos, Energia, Saneamento, Telecom, Seguros)', () => {
      const filterBest = { only_best_sectors: true };
      // BBAS3 é Financeiro/Bancos -> BEST
      expect(matchesDaviFilterMap(sampleAcao, filterBest)).toBe(true);

      const acaoEnergia = { ...sampleAcao, code: 'EGIE3', name: 'Engie Brasil', sector: 'Energia Elétrica' };
      expect(matchesDaviFilterMap(acaoEnergia, filterBest)).toBe(true);

      const acaoVarejo = { ...sampleAcao, code: 'MGLU3', name: 'Magazine Luiza', sector: 'Varejo' };
      expect(matchesDaviFilterMap(acaoVarejo, filterBest)).toBe(false);
    });

    it('deve filtrar FIIs multiativo (>5 imóveis) e reprovar monoativos ou sem imóveis físicos', () => {
      const filterMulti = { only_multi_property: true };

      const fiiMultiativo: ComprehensiveRadarItem = {
        ...sampleAcao,
        code: 'HGLG11',
        type: 'fiis',
        category: 'fiis',
        propertyCount: 20
      };
      expect(matchesDaviFilterMap(fiiMultiativo, filterMulti)).toBe(true);

      const fiiMonoativo: ComprehensiveRadarItem = {
        ...sampleAcao,
        code: 'FAMB11B',
        type: 'fiis',
        category: 'fiis',
        propertyCount: 1
      };
      expect(matchesDaviFilterMap(fiiMonoativo, filterMulti)).toBe(false);
    });

    it('deve aplicar régua inteligente de P/VP: papel máximo 1.02 e tijolo até 1.08', () => {
      const filterSmartPvp = { smart_fii_pvp: true };

      // FII de Papel com P/VP 1.05 -> DEVE REPROVAR (Aula 5.2: risco de pagar ágio sobre dívida)
      const fiiPapelCaro: ComprehensiveRadarItem = {
        ...sampleAcao,
        code: 'KNCR11',
        name: 'Kinea Rendimentos Imobiliários',
        type: 'fiis',
        category: 'fiis',
        sector: 'Títulos e Val. Mob.',
        pVpa: 1.05
      };
      expect(matchesDaviFilterMap(fiiPapelCaro, filterSmartPvp)).toBe(false);

      // FII de Papel com P/VP 0.99 -> DEVE APROVAR
      const fiiPapelJusto: ComprehensiveRadarItem = {
        ...fiiPapelCaro,
        pVpa: 0.99
      };
      expect(matchesDaviFilterMap(fiiPapelJusto, filterSmartPvp)).toBe(true);

      // FII de Tijolo com P/VP 1.06 -> DEVE APROVAR (tijolo aceita até 1.08 pela qualidade do imóvel)
      const fiiTijolo: ComprehensiveRadarItem = {
        ...sampleAcao,
        code: 'HGLG11',
        name: 'CSHG Logística',
        type: 'fiis',
        category: 'fiis',
        sector: 'Logística',
        pVpa: 1.06
      };
      expect(matchesDaviFilterMap(fiiTijolo, filterSmartPvp)).toBe(true);
    });

    it('deve filtrar ETFs Globais e reprovar ações pontuais', () => {
      const filterEtf = { only_etfs: true };

      const etfVoo: ComprehensiveRadarItem = {
        ...sampleAcao,
        code: 'VOO',
        name: 'Vanguard S&P 500 ETF',
        type: 'stocks',
        category: 'stocks'
      };
      expect(matchesDaviFilterMap(etfVoo, filterEtf)).toBe(true);

      // Ação individual não é ETF
      expect(matchesDaviFilterMap(sampleAcao, filterEtf)).toBe(false);
    });
  });
});
