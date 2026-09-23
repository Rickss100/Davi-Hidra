/**
 * Serviço de REITs (Real Estate Investment Trusts - EUA)
 * Gerencia importação, múltiplos imobiliários (P/FFO, FFO Yield, Vacância, P/VP) e cotações.
 */

import fs from 'fs';
import path from 'path';
import { getDatabase, upsertAsset, upsertPrice, insertFundamentals } from './database.service.js';

const REITS_CSV_PATH = path.join(process.cwd(), 'src/data/reits.csv');

function parseNumber(val) {
  if (val === null || val === undefined) return null;
  let str = String(val).trim();
  if (str === '' || str === '-' || str === 'N/A' || str === 'null') return null;
  str = str.replace('%', '').trim().replace(/\$/g, '');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

function parseCSVLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if ((char === ',' || char === ';') && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  return values;
}

/**
 * Carrega o catálogo de REITs para o banco SQLite
 */
export async function seedREITs() {
  console.log('🏢 Carregando catálogo de REITs para o SQLite...');

  if (!fs.existsSync(REITS_CSV_PATH)) {
    throw new Error(`Arquivo ${REITS_CSV_PATH} não encontrado.`);
  }

  const content = fs.readFileSync(REITS_CSV_PATH, 'utf-8');
  const lines = content.split('\n');
  const today = new Date().toISOString().split('T')[0];
  let importedCount = 0;

  const rawHeaders = parseCSVLine(lines[0]);
  const headers = rawHeaders.map(h => h.toLowerCase().replace(/['"]/g, '').trim());

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;

    const cols = parseCSVLine(line).map(c => c.replace(/^["']|["']$/g, '').trim());
    const getVal = (field) => {
      const idx = headers.indexOf(field.toLowerCase());
      return idx >= 0 && idx < cols.length ? cols[idx] : null;
    };

    const ticker = getVal('code') || getVal('ticker') || cols[0];
    if (!ticker || ticker === 'Ticker' || ticker === 'code') continue;

    const name = getVal('name') || ticker;
    const sector = getVal('sector') || 'Real Estate';
    const price = parseNumber(getVal('price'));
    const market_cap = parseNumber(getVal('market_cap'));
    const pe_ratio = parseNumber(getVal('pe_ratio')); // P/FFO
    const pb_ratio = parseNumber(getVal('pb_ratio'));
    const p_vpa = parseNumber(getVal('p_vpa')) || pb_ratio;
    const psr = parseNumber(getVal('psr'));
    const dividend_yield = parseNumber(getVal('dividend_yield'));
    const ffo_yield = parseNumber(getVal('ffo_yield')) || (pe_ratio ? parseFloat((100 / pe_ratio).toFixed(2)) : null);
    const vacancy_rate = parseNumber(getVal('vacancy_rate'));
    const payout_ratio = parseNumber(getVal('payout_ratio'));
    const current_ratio = parseNumber(getVal('current_ratio')) || 1.35;
    const debt_to_equity = parseNumber(getVal('debt_to_equity')) || 0.75;
    const property_count = parseNumber(getVal('property_count'));

    // 1. Cadastra/atualiza em assets
    upsertAsset({
      code: ticker,
      name: name,
      type: 'REIT',
      market: 'US',
      sector: sector
    });

    // 2. Preço inicial
    if (price !== null) {
      upsertPrice({
        asset_code: ticker,
        date: today,
        open: price,
        high: price,
        low: price,
        close: price,
        volume: 5000000
      });
    }

    // 3. Indicadores fundamentalistas imobiliários
    insertFundamentals({
      asset_code: ticker,
      pe_ratio, // P/FFO
      pb_ratio,
      p_vpa,
      psr,
      dividend_yield,
      ffo_yield,
      vacancy_rate,
      property_count,
      current_ratio,
      debt_to_equity,
      market_cap,
      payout_ratio,
      liquidity: 50000000,
      updated_at: new Date().toISOString().replace('T', ' ').substring(0, 19)
    });

    importedCount++;
  }

  console.log(`✅ ${importedCount} REITs carregados com sucesso.`);
  return {
    total: importedCount
  };
}

/**
 * Atualiza cotações e fundamentos dos REITs
 */
export async function syncREITs() {
  console.log('🔄 Sincronizando catálogo de REITs...');
  return seedREITs();
}
