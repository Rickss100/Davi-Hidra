import crypto from 'crypto';
import * as XLSX from 'xlsx';
import { and, eq, inArray } from 'drizzle-orm';
import { getDb } from '@/db';
import { assets, transactions } from '@/db/schema';
import { d, roundCurrencyStr, roundPriceStr, roundQuantityStr } from '@/lib/money';

export interface ParsedB3Operation {
  assetCode: string;
  type: 'buy' | 'sell' | 'event';
  quantity: string;
  price: string;
  totalValue: string;
  executedDate: string;
  notes: string;
  dedupHash: string;
}

export interface B3ImportReport {
  filesProcessed: number;
  tradesParsed: number;
  dividendsParsed: number;
  insertedCount: number;
  skippedDuplicates: number;
}

function parseBrNumber(val: unknown): number {
  if (typeof val === 'number') return Number.isFinite(val) ? Math.abs(val) : 0;
  if (!val) return 0;
  let s = String(val).replace('R$', '').replace('US$', '').trim();
  if (!s || s === '-') return 0;
  if (s.includes('.') && s.includes(',')) {
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    if (lastComma > lastDot) {
      s = s.replace(/\./g, '').replace(',', '.');
    } else {
      s = s.replace(/,/g, '');
    }
  } else if (s.includes(',')) {
    s = s.replace(',', '.');
  }
  const num = Number.parseFloat(s);
  return Number.isFinite(num) ? Math.abs(num) : 0;
}

function normalizeB3Date(raw: unknown): string {
  if (!raw) return new Date().toISOString().slice(0, 10);
  if (raw instanceof Date && !Number.isNaN(raw.getTime())) {
    return raw.toISOString().slice(0, 10);
  }
  const str = String(raw).trim();
  const slashParts = str.split('/');
  if (slashParts.length === 3) {
    const [dd, mm, yyyy] = slashParts;
    return `${yyyy}-${String(mm).padStart(2, '0')}-${String(dd).padStart(2, '0')}`;
  }
  if (/^\d{4}-\d{2}-\d{2}/.test(str)) {
    return str.slice(0, 10);
  }
  return new Date().toISOString().slice(0, 10);
}

function extractAssetTicker(rawCode: unknown, rawProduto: unknown): string {
  let code = String(rawCode || rawProduto || '').trim();
  if (code.includes(' - ')) {
    const parts = code.split(' - ').map((p) => p.trim());
    const first = (parts[0] || '').toUpperCase();
    if (['CDB', 'RDB', 'LC', 'LCI', 'LCA'].includes(first)) {
      code = parts[1] || parts[0] || '';
    } else {
      code = parts[0] || '';
    }
  }
  if (code.includes(' ') && code.length > 18 && !code.toUpperCase().startsWith('TESOURO')) {
    code = code.split(' ')[0] || code;
  }
  return code.trim();
}

export function parseB3WorkbookBuffers(userId: number, buffers: ArrayBuffer[]): {
  operations: ParsedB3Operation[];
  tradesCount: number;
  dividendsCount: number;
} {
  const seenHashes = new Set<string>();
  const operations: ParsedB3Operation[] = [];
  let tradesCount = 0;
  let dividendsCount = 0;

  for (const buf of buffers) {
    const workbook = XLSX.read(Buffer.from(buf), { type: 'buffer', cellDates: true });

    for (const sheetName of workbook.SheetNames) {
      if (sheetName.toLowerCase().includes('proventos')) continue;
      const sheet = workbook.Sheets[sheetName];
      if (!sheet) continue;

      const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, { defval: '' });

      for (const row of rows) {
        const mov = String(row['Movimentação'] || row['Movimentacao'] || row['Tipo'] || '').trim();
        const movUpper = mov.toUpperCase();

        if (
          movUpper.includes('ATUALIZAÇÃO') ||
          movUpper.includes('ATUALIZACAO') ||
          movUpper.includes('SUBSCRIÇÃO') ||
          movUpper.includes('SUBSCRICAO') ||
          movUpper.includes('AMORTIZAÇÃO')
        ) {
          continue;
        }

        const assetCode = extractAssetTicker(
          row['Código de Negociação'] || row['Código'],
          row['Produto'] || row['Ativo']
        );
        if (!assetCode || assetCode.toLowerCase() === 'total') continue;

        const executedDate = normalizeB3Date(row['Data'] || row['Data do Negócio']);
        const qty = parseBrNumber(row['Quantidade'] || row['Quantidade Disponível']);
        let price = parseBrNumber(row['Preço unitário'] || row['Preço de Fechamento'] || row['Preço']);
        let totalVal = parseBrNumber(row['Valor da Operação'] || row['Valor Atualizado'] || row['Valor']);
        const es = String(row['Entrada/Saída'] || row['Entrada/Saida'] || '').toUpperCase();

        const isDividendEvent =
          movUpper.includes('JUROS') ||
          movUpper.includes('DIVIDENDO') ||
          movUpper.includes('RENDIMENTO') ||
          movUpper.includes('LEILÃO') ||
          movUpper.includes('LEILAO');

        if (isDividendEvent) {
          if (totalVal <= 0 && qty > 0 && price > 0) {
            totalVal = d(qty).mul(price).toDecimalPlaces(2).toNumber();
          }
          if (totalVal <= 0) continue;

          const qtyStr = roundQuantityStr(qty > 0 ? qty : 1);
          const priceStr = roundPriceStr(price > 0 ? price : totalVal);
          const totalStr = roundCurrencyStr(totalVal);
          const dedupHash = crypto
            .createHash('sha256')
            .update(`b3:${userId}:event:${assetCode}:${executedDate}:${totalStr}:${movUpper}`)
            .digest('hex')
            .slice(0, 32);

          if (!seenHashes.has(dedupHash)) {
            seenHashes.add(dedupHash);
            operations.push({
              assetCode,
              type: 'event',
              quantity: qtyStr,
              price: priceStr,
              totalValue: totalStr,
              executedDate,
              notes: `Provento B3: ${mov}`,
              dedupHash
            });
            dividendsCount++;
          }
          continue;
        }

        // Operação de Custódia
        let opType: 'buy' | 'sell' = 'buy';
        if (es.includes('DEBITO') || es.includes('DÉBITO')) {
          opType = 'sell';
        } else if (es.includes('CREDITO') || es.includes('CRÉDITO')) {
          opType = 'buy';
        } else if (movUpper.includes('VENDA') || movUpper.includes('RESGATE')) {
          opType = 'sell';
        }

        if (qty <= 0) continue;
        if (price <= 0 && totalVal > 0) {
          price = d(totalVal).div(qty).toNumber();
        }

        const computedTotal = totalVal > 0 ? totalVal : d(qty).mul(price).toNumber();
        const qtyStr = roundQuantityStr(qty);
        const priceStr = roundPriceStr(price);
        const totalStr = roundCurrencyStr(computedTotal);

        const dedupHash = crypto
          .createHash('sha256')
          .update(`b3:${userId}:${opType}:${assetCode}:${executedDate}:${qtyStr}:${priceStr}`)
          .digest('hex')
          .slice(0, 32);

        if (!seenHashes.has(dedupHash)) {
          seenHashes.add(dedupHash);
          operations.push({
            assetCode,
            type: opType,
            quantity: qtyStr,
            price: priceStr,
            totalValue: totalStr,
            executedDate,
            notes: `Importado B3: ${mov || opType.toUpperCase()}`,
            dedupHash
          });
          tradesCount++;
        }
      }
    }
  }

  return { operations, tradesCount, dividendsCount };
}

export async function importB3FilesForUser(
  userId: number,
  buffers: ArrayBuffer[]
): Promise<B3ImportReport> {
  const { operations, tradesCount, dividendsCount } = parseB3WorkbookBuffers(userId, buffers);
  if (operations.length === 0) {
    return {
      filesProcessed: buffers.length,
      tradesParsed: 0,
      dividendsParsed: 0,
      insertedCount: 0,
      skippedDuplicates: 0
    };
  }

  const db = await getDb();

  // 1. Garantir cadastro automático no catálogo `assets` para evitar violação de FK
  const distinctCodes = Array.from(new Set(operations.map((o) => o.assetCode)));
  for (const code of distinctCodes) {
    const upper = code.toUpperCase();
    const inferredType =
      upper.includes('TESOURO') || upper.includes('CDB') || upper.includes('SELIC')
        ? 'Renda Fixa'
        : /^[A-Z]{4}11B?$/.test(upper)
          ? 'FII'
          : 'Acao';

    await db
      .insert(assets)
      .values({
        code,
        name: code,
        type: inferredType,
        market: 'BR',
        sector: 'B3 Import'
      })
      .onConflictDoNothing();
  }

  // 2. Filtrar hashes já existentes para este usuário
  const hashes = operations.map((o) => o.dedupHash);
  const existingRows = await db
    .select({ dedupHash: transactions.dedupHash })
    .from(transactions)
    .where(and(eq(transactions.userId, userId), inArray(transactions.dedupHash, hashes)));

  const existingSet = new Set(existingRows.map((r) => r.dedupHash).filter(Boolean));
  const toInsert = operations.filter((op) => !existingSet.has(op.dedupHash));

  for (let i = 0; i < toInsert.length; i += 200) {
    const batch = toInsert.slice(i, i + 200);
    await db.insert(transactions).values(
      batch.map((op) => ({
        userId,
        assetCode: op.assetCode,
        type: op.type,
        quantity: op.quantity,
        price: op.price,
        totalValue: op.totalValue,
        executedDate: op.executedDate,
        notes: op.notes,
        dedupHash: op.dedupHash
      }))
    );
  }

  return {
    filesProcessed: buffers.length,
    tradesParsed: tradesCount,
    dividendsParsed: dividendsCount,
    insertedCount: toInsert.length,
    skippedDuplicates: operations.length - toInsert.length
  };
}
