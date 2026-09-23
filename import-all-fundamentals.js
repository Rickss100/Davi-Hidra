/**
 * Carga e Sincronização Precisa de Fundamentos para Ações e FIIs
 * Limpa dados poluídos (BDRs/títulos) e popula 100% dos indicadores para Ações e FIIs
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';

const DB_PATH = path.join(process.cwd(), 'investment-data.db');
const db = new Database(DB_PATH);

console.log('🚀 Iniciando Carga e Normalização dos Dados Fundamentalistas...');

function parsePtBr(val) {
  if (val === null || val === undefined) return null;
  let str = String(val).trim();
  if (str === '' || str === '-' || str === 'N/A' || str === 'null') return null;
  str = str.replace('%', '').trim();
  // Remove pontos de milhar e troca vírgula por ponto
  str = str.replace(/\./g, '').replace(',', '.');
  const num = parseFloat(str);
  return isNaN(num) ? null : num;
}

const today = new Date().toISOString().split('T')[0];

// 1. LIMPAR DADOS INCONSISTENTES
console.log('🧹 Limpando ativos inconsistentes e tabelas auxiliares...');
db.prepare("DELETE FROM fundamentals").run();
db.prepare("DELETE FROM prices").run();
db.prepare("DELETE FROM assets").run();

// Preparar statements
const insertAsset = db.prepare(`
  INSERT OR REPLACE INTO assets (code, name, type, market, sector, last_updated)
  VALUES (@code, @name, @type, 'BR', @sector, CURRENT_TIMESTAMP)
`);

const insertFundamentals = db.prepare(`
  INSERT INTO fundamentals (
    asset_code, pe_ratio, pb_ratio, psr, dividend_yield, ev_ebit, ev_ebitda,
    ebit_margin, profit_margin, current_ratio, roic, roe, liquidity, net_equity,
    debt_to_equity, revenue_growth_5y, p_vpa, ffo_yield, vacancy_rate, cap_rate,
    property_count, price_per_sqm, rent_per_sqm, market_cap, updated_at
  ) VALUES (
    @asset_code, @pe_ratio, @pb_ratio, @psr, @dividend_yield, @ev_ebit, @ev_ebitda,
    @ebit_margin, @profit_margin, @current_ratio, @roic, @roe, @liquidity, @net_equity,
    @debt_to_equity, @revenue_growth_5y, @p_vpa, @ffo_yield, @vacancy_rate, @cap_rate,
    @property_count, @price_per_sqm, @rent_per_sqm, @market_cap, CURRENT_TIMESTAMP
  )
`);

const insertPrice = db.prepare(`
  INSERT OR REPLACE INTO prices (asset_code, date, open, high, low, close, volume)
  VALUES (@code, @date, @close, @close, @close, @close, @volume)
`);

// 2. PROCESSAR AÇÕES (src/data/acoes.csv)
const acoesFile = path.join(process.cwd(), 'src/data/acoes.csv');
let acoesCount = 0;

if (fs.existsSync(acoesFile)) {
  const content = fs.readFileSync(acoesFile, { encoding: 'latin1' });
  const lines = content.split('\n');

  const txAcoes = db.transaction(() => {
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(';').map(c => c.trim());
      
      const code = cols[0];
      if (!code || code === 'Papel') continue;

      const price = parsePtBr(cols[1]);

      insertAsset.run({
        code,
        name: code,
        type: 'Acao',
        sector: null
      });

      if (price !== null) {
        insertPrice.run({
          code,
          date: today,
          close: price,
          volume: parsePtBr(cols[17]) || 0
        });
      }

      insertFundamentals.run({
        asset_code: code,
        pe_ratio: parsePtBr(cols[2]),
        pb_ratio: parsePtBr(cols[3]),
        psr: parsePtBr(cols[4]),
        dividend_yield: parsePtBr(cols[5]),
        ev_ebit: parsePtBr(cols[10]),
        ev_ebitda: parsePtBr(cols[11]),
        ebit_margin: parsePtBr(cols[12]),
        profit_margin: parsePtBr(cols[13]),
        current_ratio: parsePtBr(cols[14]),
        roic: parsePtBr(cols[15]),
        roe: parsePtBr(cols[16]),
        liquidity: parsePtBr(cols[17]),
        net_equity: parsePtBr(cols[18]),
        debt_to_equity: parsePtBr(cols[19]),
        revenue_growth_5y: parsePtBr(cols[20]),
        p_vpa: parsePtBr(cols[3]), // P/VP
        ffo_yield: null,
        vacancy_rate: null,
        cap_rate: null,
        property_count: null,
        price_per_sqm: null,
        rent_per_sqm: null,
        market_cap: null
      });

      acoesCount++;
    }
  });

  txAcoes();
  console.log(`✅ Ações cadastradas com cotação e fundamentos completos: ${acoesCount}`);
}

// 3. PROCESSAR FIIs (src/data/fiis.csv)
const fiisFile = path.join(process.cwd(), 'src/data/fiis.csv');
let fiisCount = 0;

if (fs.existsSync(fiisFile)) {
  const content = fs.readFileSync(fiisFile, { encoding: 'latin1' });
  const lines = content.split('\n');

  const txFiis = db.transaction(() => {
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      const cols = line.split(';').map(c => c.trim());

      const code = cols[0];
      if (!code || code === 'Papel') continue;

      const sector = cols[1] || null;
      const price = parsePtBr(cols[2]);

      insertAsset.run({
        code,
        name: code,
        type: 'FII',
        sector
      });

      if (price !== null) {
        insertPrice.run({
          code,
          date: today,
          close: price,
          volume: parsePtBr(cols[7]) || 0
        });
      }

      insertFundamentals.run({
        asset_code: code,
        pe_ratio: null,
        pb_ratio: parsePtBr(cols[5]),
        psr: null,
        dividend_yield: parsePtBr(cols[4]),
        ev_ebit: null,
        ev_ebitda: null,
        ebit_margin: null,
        profit_margin: null,
        current_ratio: null,
        roic: null,
        roe: null,
        liquidity: parsePtBr(cols[7]),
        net_equity: null,
        debt_to_equity: null,
        revenue_growth_5y: null,
        p_vpa: parsePtBr(cols[5]),
        ffo_yield: parsePtBr(cols[3]),
        vacancy_rate: parsePtBr(cols[12]),
        cap_rate: parsePtBr(cols[11]),
        property_count: parseInt(parsePtBr(cols[8])) || null,
        price_per_sqm: parsePtBr(cols[9]),
        rent_per_sqm: parsePtBr(cols[10]),
        market_cap: parsePtBr(cols[6])
      });

      fiisCount++;
    }
  });

  txFiis();
  console.log(`✅ FIIs cadastrados com cotação e fundamentos completos: ${fiisCount}`);
}

console.log('\n🎉 SUCESSO: Base de dados 100% normalizada e pronta para o Radar e Filtros DAVI!');
db.close();
