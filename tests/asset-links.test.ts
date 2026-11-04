import { describe, it, expect } from 'vitest';
import { getAssetAnalysisUrl } from '@/lib/asset-links';

describe('Asset Analysis External Links Suite (Fundamentus & Bases Consolidadas)', () => {
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

  it('correctly maps Real Estate Funds (FIIs) to Fundamentus FIIs page', () => {
    const hglg11 = getAssetAnalysisUrl('HGLG11', 'FII');
    expect(hglg11.url).toBe('https://www.fundamentus.com.br/fii_detalhes.php?papel=HGLG11');
    expect(hglg11.provider).toBe('Fundamentus FIIs');

    const alzr11 = getAssetAnalysisUrl('ALZR11', 'FII');
    expect(alzr11.url).toBe('https://www.fundamentus.com.br/fii_detalhes.php?papel=ALZR11');
  });

  it('correctly maps US Stocks and REITs to Status Invest international pages', () => {
    const aapl = getAssetAnalysisUrl('AAPL', 'Stock');
    expect(aapl.url).toBe('https://statusinvest.com.br/acoes/eua/aapl');
    expect(aapl.provider).toBe('Status Invest');

    const o = getAssetAnalysisUrl('O', 'REIT');
    expect(o.url).toBe('https://statusinvest.com.br/reits/eua/o');
    expect(o.provider).toBe('Status Invest');
  });

  it('correctly maps Tesouro Selic to Tesouro Direto portal', () => {
    const selic = getAssetAnalysisUrl('TESOURO_SELIC_2029', 'Renda Fixa');
    expect(selic.url).toBe('https://www.tesourodireto.com.br/titulos/precos-e-taxas.htm');
    expect(selic.provider).toBe('Tesouro Direto');
  });
});
