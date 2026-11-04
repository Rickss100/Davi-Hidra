import { describe, it, expect } from 'vitest';
import { getAssetAnalysisUrl } from '@/lib/asset-links';

describe('Asset Analysis External Links Suite (Fundamentus & Status Invest)', () => {
  it('correctly maps Brazilian B3 stocks to Fundamentus details page', () => {
    const itsa3 = getAssetAnalysisUrl('ITSA3', 'Acao');
    expect(itsa3.url).toBe('https://www.fundamentus.com.br/detalhes.php?papel=ITSA3');
    expect(itsa3.provider).toBe('Fundamentus');

    const itsa4 = getAssetAnalysisUrl('ITSA4', 'Acao');
    expect(itsa4.url).toBe('https://www.fundamentus.com.br/detalhes.php?papel=ITSA4');

    const bbas3 = getAssetAnalysisUrl('BBAS3', 'Acao');
    expect(bbas3.url).toBe('https://www.fundamentus.com.br/detalhes.php?papel=BBAS3');

    const wege3 = getAssetAnalysisUrl('WEGE3', 'Acao');
    expect(wege3.url).toBe('https://www.fundamentus.com.br/detalhes.php?papel=WEGE3');
  });

  it('correctly maps B3 stock units to Fundamentus stock details instead of FIIs', () => {
    const taee11 = getAssetAnalysisUrl('TAEE11', 'Acao');
    expect(taee11.url).toBe('https://www.fundamentus.com.br/detalhes.php?papel=TAEE11');
    expect(taee11.provider).toBe('Fundamentus');

    const sapr11 = getAssetAnalysisUrl('SAPR11', 'Acao');
    expect(sapr11.url).toBe('https://www.fundamentus.com.br/detalhes.php?papel=SAPR11');
  });

  it('correctly maps Real Estate Funds (FIIs) to Status Invest (avoiding Fundamentus PHP bug)', () => {
    const cacr11 = getAssetAnalysisUrl('CACR11', 'FII');
    expect(cacr11.url).toBe('https://statusinvest.com.br/fundos-imobiliarios/cacr11');
    expect(cacr11.provider).toBe('Status Invest (FIIs)');

    const hglg11 = getAssetAnalysisUrl('HGLG11', 'FII');
    expect(hglg11.url).toBe('https://statusinvest.com.br/fundos-imobiliarios/hglg11');

    const alzr11 = getAssetAnalysisUrl('ALZR11', 'FII');
    expect(alzr11.url).toBe('https://statusinvest.com.br/fundos-imobiliarios/alzr11');
  });

  it('correctly maps US REITs to Status Invest /reits/ route (without /eua/ path)', () => {
    const orc = getAssetAnalysisUrl('ORC', 'REIT');
    expect(orc.url).toBe('https://statusinvest.com.br/reits/orc');
    expect(orc.provider).toBe('Status Invest (REITs)');

    const o = getAssetAnalysisUrl('O', 'REIT');
    expect(o.url).toBe('https://statusinvest.com.br/reits/o');

    const pld = getAssetAnalysisUrl('PLD', 'REIT');
    expect(pld.url).toBe('https://statusinvest.com.br/reits/pld');
  });

  it('correctly maps US Stocks to Status Invest /acoes/eua/ page', () => {
    const aapl = getAssetAnalysisUrl('AAPL', 'Stock');
    expect(aapl.url).toBe('https://statusinvest.com.br/acoes/eua/aapl');
    expect(aapl.provider).toBe('Status Invest (EUA)');
  });

  it('correctly maps Tesouro Selic to Tesouro Direto portal', () => {
    const selic = getAssetAnalysisUrl('TESOURO_SELIC_2029', 'Renda Fixa');
    expect(selic.url).toBe('https://www.tesourodireto.com.br/titulos/precos-e-taxas.htm');
    expect(selic.provider).toBe('Tesouro Direto');
  });
});
