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
});
