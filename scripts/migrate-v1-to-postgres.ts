import path from 'path';
import crypto from 'crypto';
import fs from 'fs';
import { createRequire } from 'module';
import { sql, eq } from 'drizzle-orm';
import { closeDb, getDb } from '../src/db';
import {
  users,
  assets,
  fundamentals,
  cachedPrices,
  economicIndicators,
  transactions,
  userObjectives,
  type MacroAllocationConfig,
  type AssetTargetsConfig,
  type EmergencyReserveConfig
} from '../src/db/schema';
import { d, roundCurrencyStr, roundPriceStr, roundQuantityStr } from '../src/lib/money';

const ROOT_DIR = path.resolve(process.cwd(), '..');
const V1_DB_PATH = path.join(ROOT_DIR, 'investment-data.db');

const DEFAULT_MACRO: MacroAllocationConfig = {
  fixed: 15,
  variable: 85,
  brasil: 100,
  usa: 0,
  acoes: 60,
  fiis: 40,
  stocks: 0,
  reits: 0
};

const DEFAULT_TARGETS: AssetTargetsConfig = {
  acoes: [],
  fiis: [],
  stocks: [],
  reits: [],
  fixed: [],
  reserva: [{ code: 'TESOURO_SELIC_2029', sector: 'Título Público Federal', target: 100 }]
};

const DEFAULT_EMERGENCY: EmergencyReserveConfig = {
  monthlyExpense: 3000,
  monthsTarget: 6,
  manualReserveBalance: 0,
  strategyMode: 'hybrid_70_30'
};

function toNumOrNull(val: unknown, decimals = 4): string | null {
  if (val === null || val === undefined || val === '') return null;
  const num = Number(val);
  if (!Number.isFinite(num)) return null;
  return d(num).toFixed(decimals);
}

function inferAssetType(code: string): { type: string; market: string } {
  const upper = code.toUpperCase();
  if (upper.includes('TESOURO') || upper.includes('CDB') || upper.includes('SELIC') || upper.includes('IPCA') || upper.includes('LCI') || upper.includes('LCA')) {
    return { type: 'Renda Fixa', market: 'BR' };
  }
  if (/^[A-Z]{4}11B?$/.test(upper)) {
    return { type: 'FII', market: 'BR' };
  }
  if (/^[A-Z]{4}\d{1,2}$/.test(upper)) {
    return { type: 'Acao', market: 'BR' };
  }
  return { type: 'Stock', market: 'US' };
}

async function runMigration() {
  console.log('🏦 === INICIANDO MIGRAÇÃO AUDITADA V1 (SQLite) -> V2 ENTERPRISE (PostgreSQL) ===\n');

  if (!fs.existsSync(V1_DB_PATH)) {
    throw new Error(`Banco V1 não encontrado em: ${V1_DB_PATH}`);
  }

  const rootRequire = createRequire(path.join(ROOT_DIR, 'package.json'));
  const Database = rootRequire('better-sqlite3');
  const v1 = new Database(V1_DB_PATH, { readonly: true });
  const db = await getDb();

  // 1. Migrar Usuários
  const v1Users = v1.prepare('SELECT * FROM users').all() as Array<Record<string, unknown>>;
  console.log(`👤 Migrando ${v1Users.length} usuários (preservando UUIDs e hashes Bcrypt)...`);

  const validUserIds = new Set<number>();
  for (const u of v1Users) {
    const id = Number(u.id);
    validUserIds.add(id);
    const userUuid =
      typeof u.uuid === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-/i.test(u.uuid)
        ? u.uuid
        : crypto.randomUUID();

    await db
      .insert(users)
      .values({
        id,
        uuid: userUuid,
        email: String(u.email).trim(),
        passwordHash: String(u.password),
        name: String(u.name || u.email),
        role: String(u.role || 'user'),
        status: String(u.status || 'active'),
        planPeriod: String(u.plan_period || 'lifetime'),
        planExpiresAt: u.plan_expires_at ? new Date(String(u.plan_expires_at)) : null,
        lastLoginAt: u.last_login ? new Date(String(u.last_login)) : null
      })
      .onConflictDoUpdate({
        target: users.id,
        set: {
          uuid: userUuid,
          email: String(u.email).trim(),
          passwordHash: String(u.password),
          name: String(u.name || u.email),
          role: String(u.role || 'user'),
          status: String(u.status || 'active'),
          planPeriod: String(u.plan_period || 'lifetime'),
          planExpiresAt: u.plan_expires_at ? new Date(String(u.plan_expires_at)) : null
        }
      });
  }

  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('users', 'id'), COALESCE((SELECT MAX(id) FROM users), 1), true)`
  );

  // 2. Migrar Catálogo de Ativos
  const v1Assets = v1.prepare('SELECT * FROM assets').all() as Array<Record<string, unknown>>;
  console.log(`📊 Migrando ${v1Assets.length} ativos do catálogo...`);

  const knownAssetCodes = new Set<string>();
  const assetBatchSize = 250;
  for (let i = 0; i < v1Assets.length; i += assetBatchSize) {
    const slice = v1Assets.slice(i, i + assetBatchSize);
    const values = slice.map((a) => {
      const code = String(a.code).trim();
      knownAssetCodes.add(code);
      return {
        code,
        name: String(a.name || code),
        type: String(a.type || 'Acao'),
        market: String(a.market || 'BR'),
        sector: a.sector ? String(a.sector) : null
      };
    });
    if (values.length > 0) {
      await db
        .insert(assets)
        .values(values)
        .onConflictDoNothing();
    }
  }

  // Garantir ativos referenciados em transactions que eventualmente não estivessem no catálogo
  const v1TxAssets = v1.prepare('SELECT DISTINCT asset_code FROM transactions').all() as Array<{
    asset_code: string;
  }>;
  for (const row of v1TxAssets) {
    const code = String(row.asset_code || '').trim();
    if (code && !knownAssetCodes.has(code)) {
      const inferred = inferAssetType(code);
      await db
        .insert(assets)
        .values({
          code,
          name: code,
          type: inferred.type,
          market: inferred.market,
          sector: 'Outros'
        })
        .onConflictDoNothing();
      knownAssetCodes.add(code);
    }
  }

  // 3. Migrar Fundamentos (último registro por ativo)
  const v1Fundamentals = v1
    .prepare(
      `SELECT f.* FROM fundamentals f
       INNER JOIN (SELECT asset_code, MAX(id) as max_id FROM fundamentals GROUP BY asset_code) latest
       ON f.id = latest.max_id`
    )
    .all() as Array<Record<string, unknown>>;
  console.log(`📈 Migrando ${v1Fundamentals.length} registros fundamentalistas...`);

  for (let i = 0; i < v1Fundamentals.length; i += 200) {
    const slice = v1Fundamentals
      .slice(i, i + 200)
      .filter((f) => knownAssetCodes.has(String(f.asset_code || '').trim()));
    if (slice.length === 0) continue;

    await db
      .insert(fundamentals)
      .values(
        slice.map((f) => ({
          assetCode: String(f.asset_code).trim(),
          marketCap: toNumOrNull(f.market_cap, 2),
          peRatio: toNumOrNull(f.pe_ratio, 4),
          pbRatio: toNumOrNull(f.pb_ratio, 4),
          dividendYield: toNumOrNull(f.dividend_yield, 4),
          roe: toNumOrNull(f.roe, 4),
          roic: toNumOrNull(f.roic, 4),
          profitMargin: toNumOrNull(f.profit_margin, 4),
          debtToEquity: toNumOrNull(f.debt_to_equity, 4),
          pVpa: toNumOrNull(f.p_vpa, 4),
          vacancyRate: toNumOrNull(f.vacancy_rate, 4),
          capRate: toNumOrNull(f.cap_rate, 4),
          ffoYield: toNumOrNull(f.ffo_yield, 4),
          liquidity: toNumOrNull(f.liquidity, 2),
          indexer: f.indexer ? String(f.indexer) : null,
          rateFixed: toNumOrNull(f.rate_fixed, 4),
          rateDescription: f.rate_description ? String(f.rate_description) : null,
          maturityDate: f.maturity_date ? String(f.maturity_date) : null,
          liquidityType: f.liquidity_type ? String(f.liquidity_type) : null,
          guarantee: f.guarantee ? String(f.guarantee) : null,
          taxFree: Boolean(Number(f.tax_free || 0) === 1),
          minInvestment: toNumOrNull(f.min_investment, 2)
        }))
      )
      .onConflictDoNothing();
  }

  // 4. Migrar Cotações em Cache (cached_prices + fallback da tabela prices)
  let migratedPrices = 0;
  const hasCachedPricesTable = v1
    .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name='cached_prices'")
    .get();

  if (hasCachedPricesTable) {
    const v1Cached = v1.prepare('SELECT * FROM cached_prices').all() as Array<Record<string, unknown>>;
    for (const cp of v1Cached) {
      const code = String(cp.asset_code || cp.symbol || '').trim();
      const priceVal = Number(cp.price ?? cp.regularMarketPrice ?? 0);
      if (!code || priceVal <= 0) continue;
      await db
        .insert(cachedPrices)
        .values({
          assetCode: code,
          price: roundPriceStr(priceVal),
          changePercent: toNumOrNull(cp.change_percent ?? 0, 4) ?? '0',
          currency: String(cp.currency || 'BRL'),
          source: 'turso_v1_cache'
        })
        .onConflictDoUpdate({
          target: cachedPrices.assetCode,
          set: {
            price: roundPriceStr(priceVal)
          }
        });
      migratedPrices++;
    }
  }

  const latestPricesFromHistory = v1
    .prepare(
      `SELECT p.asset_code, p.close FROM prices p
       INNER JOIN (SELECT asset_code, MAX(date) as max_date FROM prices GROUP BY asset_code) latest
       ON p.asset_code = latest.asset_code AND p.date = latest.max_date`
    )
    .all() as Array<{ asset_code: string; close: number }>;

  for (let i = 0; i < latestPricesFromHistory.length; i += 250) {
    const slice = latestPricesFromHistory
      .slice(i, i + 250)
      .filter((p) => p.asset_code && Number(p.close) > 0);
    if (slice.length === 0) continue;
    await db
      .insert(cachedPrices)
      .values(
        slice.map((p) => ({
          assetCode: String(p.asset_code).trim(),
          price: roundPriceStr(p.close),
          changePercent: '0',
          currency: 'BRL',
          source: 'historical_seed'
        }))
      )
      .onConflictDoNothing();
    migratedPrices += slice.length;
  }
  console.log(`⚡ Cotações disponíveis no cache PostgreSQL: ${migratedPrices} registros processados.`);

  // 5. Migrar Indicadores Econômicos
  const v1Econ = v1.prepare('SELECT * FROM economic_indicators').all() as Array<Record<string, unknown>>;
  for (const e of v1Econ) {
    await db
      .insert(economicIndicators)
      .values({
        indicator: String(e.indicator),
        referenceDate: String(e.date),
        value: roundPriceStr(Number(e.value || 0))
      })
      .onConflictDoNothing();
  }

  // 6. Migrar Objetivos dos Clientes (JSONB)
  const v1Objectives = v1.prepare('SELECT * FROM user_objectives').all() as Array<Record<string, unknown>>;
  let migratedObjCount = 0;
  for (const obj of v1Objectives) {
    const uid = Number(obj.user_id);
    if (!validUserIds.has(uid)) continue;

    let macro = DEFAULT_MACRO;
    let targets = DEFAULT_TARGETS;
    try {
      if (obj.macro_allocation) {
        macro = { ...DEFAULT_MACRO, ...JSON.parse(String(obj.macro_allocation)) };
      }
      if (obj.asset_targets) {
        targets = { ...DEFAULT_TARGETS, ...JSON.parse(String(obj.asset_targets)) };
      }
    } catch {
      // mantém fallback seguro se JSON legado estiver malformado
    }

    await db
      .insert(userObjectives)
      .values({
        userId: uid,
        macroAllocation: macro,
        assetTargets: targets,
        emergencyConfig: DEFAULT_EMERGENCY
      })
      .onConflictDoUpdate({
        target: userObjectives.userId,
        set: {
          macroAllocation: macro,
          assetTargets: targets
        }
      });
    migratedObjCount++;
  }
  console.log(`🎯 Objetivos migrados para JSONB: ${migratedObjCount}`);

  // 7. Migrar Transações (Limpa e recarrega por ID original para garantir idempotência exata 1:1)
  const v1Transactions = v1
    .prepare('SELECT * FROM transactions ORDER BY id ASC')
    .all() as Array<Record<string, unknown>>;
  console.log(`💰 Migrando ${v1Transactions.length} transações com precisão NUMERIC(18, 2)...`);

  for (let i = 0; i < v1Transactions.length; i += 250) {
    const slice = v1Transactions
      .slice(i, i + 250)
      .filter((t) => validUserIds.has(Number(t.user_id || 1)));

    if (slice.length === 0) continue;

    await db
      .insert(transactions)
      .values(
        slice.map((t) => {
          const txId = Number(t.id);
          const uid = Number(t.user_id || 1);
          const code = String(t.asset_code).trim();
          const txType = String(t.type || 'buy');
          const qtyStr = roundQuantityStr(Number(t.quantity || 0));
          const priceStr = roundPriceStr(Number(t.price || 0));
          const totalStr = roundCurrencyStr(Number(t.total_value || 0));
          const execDate = String(t.date || new Date().toISOString().slice(0, 10));
          const dedupHash = crypto
            .createHash('sha256')
            .update(`v1:${txId}:${uid}:${code}:${txType}:${execDate}:${qtyStr}:${totalStr}`)
            .digest('hex')
            .slice(0, 32);

          return {
            id: txId,
            userId: uid,
            assetCode: code,
            type: txType,
            quantity: qtyStr,
            price: priceStr,
            totalValue: totalStr,
            executedDate: execDate,
            notes: t.notes ? String(t.notes) : null,
            dedupHash
          };
        })
      )
      .onConflictDoUpdate({
        target: transactions.id,
        set: {
          totalValue: sql`excluded.total_value`,
          quantity: sql`excluded.quantity`,
          price: sql`excluded.price`
        }
      });
  }

  await db.execute(
    sql`SELECT setval(pg_get_serial_sequence('transactions', 'id'), COALESCE((SELECT MAX(id) FROM transactions), 1), true)`
  );

  // ==========================================================================
  // 8. LAUDO DE RECONCILIAÇÃO BANCÁRIA (V1 SQLite vs V2 PostgreSQL)
  // ==========================================================================
  console.log('\n🔎 === EXECUTANDO RECONCILIAÇÃO MATEMÁTICA CENTAVO A CENTAVO ===');

  const v1TotalTxSum = v1
    .prepare('SELECT COUNT(*) as cnt, COALESCE(SUM(ROUND(total_value, 2)), 0) as total FROM transactions WHERE user_id IN (SELECT id FROM users)')
    .get() as { cnt: number; total: number };

  const pgAllTx = await db.select().from(transactions);
  const pgSumDecimal = pgAllTx.reduce((acc, row) => acc.plus(d(row.totalValue)), d(0));

  const gabrielPgTx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, 1000001));
  const gabrielDividends = gabrielPgTx
    .filter((t) => t.type === 'event')
    .reduce((acc, t) => acc.plus(d(t.totalValue)), d(0));

  const eduardoPgTx = await db
    .select()
    .from(transactions)
    .where(eq(transactions.userId, 38));
  const eduardoDividends = eduardoPgTx
    .filter((t) => t.type === 'event')
    .reduce((acc, t) => acc.plus(d(t.totalValue)), d(0));

  v1.close();

  const diffGlobal = d(v1TotalTxSum.total).minus(pgSumDecimal).abs();

  console.log(`• Transações V1: ${v1TotalTxSum.cnt} | Transações PostgreSQL V2: ${pgAllTx.length}`);
  console.log(`• Volume Financeiro V1: R$ ${d(v1TotalTxSum.total).toFixed(2)} | PostgreSQL V2: R$ ${pgSumDecimal.toFixed(2)}`);
  console.log(`• Diferença de Centavos Global: R$ ${diffGlobal.toFixed(2)}`);
  console.log(`• Carteira Gabriel (ID 1000001): ${gabrielPgTx.length} registros | Proventos Acumulados: R$ ${gabrielDividends.toFixed(2)}`);
  console.log(`• Carteira Eduardo (ID 38):      ${eduardoPgTx.length} registros | Proventos Acumulados: R$ ${eduardoDividends.toFixed(2)}`);

  if (v1TotalTxSum.cnt !== pgAllTx.length || diffGlobal.greaterThan('0.01')) {
    throw new Error('❌ FALHA DE RECONCILIAÇÃO: Divergência detectada entre V1 e V2!');
  }

  console.log('\n✅ LAUDO DE RECONCILIAÇÃO APROVADO COM 100,00% DE PRECISÃO BANCÁRIA!\n');
}

runMigration()
  .then(async () => {
    await closeDb();
    process.exit(0);
  })
  .catch(async (err) => {
    console.error('❌ Erro na migração:', err);
    await closeDb().catch(() => {});
    process.exit(1);
  });
