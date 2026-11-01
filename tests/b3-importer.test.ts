import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { parseB3WorkbookBuffers } from '../src/server/importers/b3-xlsx.importer';

function createMockB3WorkbookBuffer(rows: Record<string, unknown>[], sheetName = 'Movimentação'): ArrayBuffer {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(rows);
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return buf;
}

describe('Importador B3 (Excel .xlsx)', () => {
  it('deve extrair operações de compra e venda com formatação brasileira de números e datas', () => {
    const rows = [
      {
        'Data': '15/03/2025',
        'Movimentação': 'Compra',
        'Produto': 'BBAS3 - BANCO DO BRASIL ON',
        'Quantidade': '100',
        'Preço': '28,50',
        'Valor da Operação': '2.850,00'
      },
      {
        'Data': '20/04/2025',
        'Movimentação': 'Venda',
        'Produto': 'PETR4 - PETROBRAS PN',
        'Quantidade': '50',
        'Preço': '36,00',
        'Valor da Operação': '1.800,00'
      }
    ];

    const buffer = createMockB3WorkbookBuffer(rows);
    const result = parseB3WorkbookBuffers(1, [buffer]);

    expect(result.tradesCount).toBe(2);
    expect(result.dividendsCount).toBe(0);
    expect(result.operations).toHaveLength(2);

    const buyOp = result.operations[0];
    expect(buyOp?.assetCode).toBe('BBAS3');
    expect(buyOp?.type).toBe('buy');
    expect(Number(buyOp?.quantity)).toBe(100);
    expect(Number(buyOp?.price)).toBe(28.5);
    expect(Number(buyOp?.totalValue)).toBe(2850);
    expect(buyOp?.executedDate).toBe('2025-03-15');

    const sellOp = result.operations[1];
    expect(sellOp?.assetCode).toBe('PETR4');
    expect(sellOp?.type).toBe('sell');
    expect(Number(sellOp?.quantity)).toBe(50);
    expect(Number(sellOp?.price)).toBe(36);
    expect(Number(sellOp?.totalValue)).toBe(1800);
    expect(sellOp?.executedDate).toBe('2025-04-20');
  });

  it('deve identificar e converter eventos de proventos (Dividendos, JCP e Rendimentos de FIIs)', () => {
    const rows = [
      {
        'Data': '10/05/2025',
        'Movimentação': 'Rendimento',
        'Produto': 'HGLG11 - CSHG LOGISTICA FII',
        'Quantidade': '100',
        'Preço': '1,10',
        'Valor da Operação': '110,00'
      },
      {
        'Data': '12/06/2025',
        'Movimentação': 'Dividendo',
        'Produto': 'ITSA4',
        'Quantidade': '500',
        'Preço': '0,35',
        'Valor da Operação': '175,00'
      }
    ];

    const buffer = createMockB3WorkbookBuffer(rows);
    const result = parseB3WorkbookBuffers(1, [buffer]);

    expect(result.tradesCount).toBe(0);
    expect(result.dividendsCount).toBe(2);
    expect(result.operations).toHaveLength(2);

    const fiiDiv = result.operations[0];
    expect(fiiDiv?.assetCode).toBe('HGLG11');
    expect(fiiDiv?.type).toBe('event');
    expect(Number(fiiDiv?.totalValue)).toBe(110);
    expect(fiiDiv?.notes).toContain('Rendimento');

    const acaoDiv = result.operations[1];
    expect(acaoDiv?.assetCode).toBe('ITSA4');
    expect(acaoDiv?.type).toBe('event');
    expect(Number(acaoDiv?.totalValue)).toBe(175);
  });

  it('deve gerar hashes de deduplicação consistentes e descartar duplicatas no mesmo lote', () => {
    const rows = [
      {
        'Data': '15/03/2025',
        'Movimentação': 'Compra',
        'Produto': 'WEGE3',
        'Quantidade': '10',
        'Preço': '45,00',
        'Valor': '450,00'
      },
      {
        'Data': '15/03/2025',
        'Movimentação': 'Compra',
        'Produto': 'WEGE3',
        'Quantidade': '10',
        'Preço': '45,00',
        'Valor': '450,00'
      }
    ];

    const buffer = createMockB3WorkbookBuffer(rows);
    const result = parseB3WorkbookBuffers(1, [buffer]);

    // Linha idêntica deve ser deduplicada
    expect(result.tradesCount).toBe(1);
    expect(result.operations).toHaveLength(1);
    expect(result.operations[0]?.dedupHash).toBeDefined();
    expect(result.operations[0]?.dedupHash.length).toBe(32);
  });

  it('deve ignorar abas ou linhas inválidas sem quebrar a execução', () => {
    const rows = [
      {
        'Data': '',
        'Movimentação': 'Atualização de Sistema',
        'Produto': 'Total',
        'Quantidade': '0',
        'Preço': '0',
        'Valor': '0'
      }
    ];

    const buffer = createMockB3WorkbookBuffer(rows);
    const result = parseB3WorkbookBuffers(1, [buffer]);

    expect(result.operations).toHaveLength(0);
    expect(result.tradesCount).toBe(0);
    expect(result.dividendsCount).toBe(0);
  });
});
