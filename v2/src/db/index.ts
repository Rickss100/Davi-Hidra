import fs from 'fs';
import path from 'path';
import postgres from 'postgres';
import { drizzle as drizzlePostgres, type PostgresJsDatabase } from 'drizzle-orm/postgres-js';
import { PGlite } from '@electric-sql/pglite';
import { drizzle as drizzlePglite, type PgliteDatabase } from 'drizzle-orm/pglite';
import { env } from '@/env';
import * as schema from './schema';

export type AppDatabase = PostgresJsDatabase<typeof schema> | PgliteDatabase<typeof schema>;

const BOOTSTRAP_DDL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  password_hash TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',
  status TEXT NOT NULL DEFAULT 'active',
  plan_period TEXT NOT NULL DEFAULT 'lifetime',
  plan_expires_at TIMESTAMPTZ,
  totp_secret_encrypted TEXT,
  totp_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  reset_token_hash TEXT,
  reset_expires_at TIMESTAMPTZ,
  last_login_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_uuid ON users(uuid);
CREATE UNIQUE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);

CREATE TABLE IF NOT EXISTS user_sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  impersonated_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  ip_address TEXT,
  user_agent TEXT,
  expires_at TIMESTAMPTZ NOT NULL,
  revoked_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_sessions_user ON user_sessions(user_id);

CREATE TABLE IF NOT EXISTS assets (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  market TEXT NOT NULL DEFAULT 'BR',
  sector TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_market ON assets(market);

CREATE TABLE IF NOT EXISTS fundamentals (
  id SERIAL PRIMARY KEY,
  asset_code TEXT NOT NULL REFERENCES assets(code) ON DELETE CASCADE,
  market_cap NUMERIC(20, 2),
  pe_ratio NUMERIC(14, 4),
  pb_ratio NUMERIC(14, 4),
  dividend_yield NUMERIC(14, 4),
  roe NUMERIC(14, 4),
  roic NUMERIC(14, 4),
  profit_margin NUMERIC(14, 4),
  debt_to_equity NUMERIC(14, 4),
  p_vpa NUMERIC(14, 4),
  vacancy_rate NUMERIC(14, 4),
  cap_rate NUMERIC(14, 4),
  ffo_yield NUMERIC(14, 4),
  liquidity NUMERIC(20, 2),
  psr NUMERIC(14, 4),
  ev_ebit NUMERIC(14, 4),
  ev_ebitda NUMERIC(14, 4),
  roa NUMERIC(14, 4),
  ebit_margin NUMERIC(14, 4),
  current_ratio NUMERIC(14, 4),
  net_debt_ebitda NUMERIC(14, 4),
  revenue_growth NUMERIC(14, 4),
  revenue_growth_5y NUMERIC(14, 4),
  earnings_growth NUMERIC(14, 4),
  payout_ratio NUMERIC(14, 4),
  property_count NUMERIC(14, 2),
  price_per_sqm NUMERIC(14, 2),
  rent_per_sqm NUMERIC(14, 2),
  indexer TEXT,
  rate_fixed NUMERIC(14, 4),
  rate_description TEXT,
  maturity_date TEXT,
  liquidity_type TEXT,
  guarantee TEXT,
  tax_free BOOLEAN DEFAULT FALSE,
  min_investment NUMERIC(18, 2),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_fundamentals_asset_unique ON fundamentals(asset_code);

CREATE TABLE IF NOT EXISTS cached_prices (
  asset_code TEXT PRIMARY KEY,
  price NUMERIC(18, 6) NOT NULL,
  change_percent NUMERIC(12, 4) DEFAULT 0,
  currency TEXT NOT NULL DEFAULT 'BRL',
  source TEXT NOT NULL DEFAULT 'brapi',
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS economic_indicators (
  id SERIAL PRIMARY KEY,
  indicator TEXT NOT NULL,
  reference_date TEXT NOT NULL,
  value NUMERIC(18, 6) NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE UNIQUE INDEX IF NOT EXISTS idx_econ_indicator_date ON economic_indicators(indicator, reference_date);

CREATE TABLE IF NOT EXISTS transactions (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL REFERENCES assets(code) ON DELETE RESTRICT,
  type TEXT NOT NULL,
  quantity NUMERIC(18, 8) NOT NULL,
  price NUMERIC(18, 6) NOT NULL,
  total_value NUMERIC(18, 2) NOT NULL,
  executed_date TEXT NOT NULL,
  notes TEXT,
  dedup_hash TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_tx_user_date ON transactions(user_id, executed_date);
CREATE INDEX IF NOT EXISTS idx_tx_user_asset ON transactions(user_id, asset_code);
CREATE INDEX IF NOT EXISTS idx_tx_dedup ON transactions(user_id, dedup_hash);

CREATE TABLE IF NOT EXISTS user_objectives (
  user_id INTEGER PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
  macro_allocation JSONB NOT NULL,
  asset_targets JSONB NOT NULL,
  emergency_config JSONB NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS user_asset_notes (
  user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  asset_code TEXT NOT NULL REFERENCES assets(code) ON DELETE CASCADE,
  rating INTEGER DEFAULT 5,
  notes TEXT,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (user_id, asset_code)
);

CREATE TABLE IF NOT EXISTS audit_logs (
  id SERIAL PRIMARY KEY,
  actor_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  target_user_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  action TEXT NOT NULL,
  ip_address TEXT,
  metadata JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);
CREATE INDEX IF NOT EXISTS idx_audit_actor ON audit_logs(actor_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_target ON audit_logs(target_user_id);
CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_logs(created_at);
`;

declare global {
  // eslint-disable-next-line no-var
  var __nortePgDbPromise: Promise<AppDatabase> | undefined;
  // eslint-disable-next-line no-var
  var __norteRawPglite: PGlite | undefined;
}

async function createDatabaseConnection(): Promise<AppDatabase> {
  // 1. Conexão Produção / Cloud: PostgreSQL Supabase / Neon via postgres-js
  if (env.DATABASE_URL && env.DATABASE_URL.startsWith('postgres')) {
    const client = postgres(env.DATABASE_URL, {
      prepare: false, // Compatível com Supabase Transaction Pooler (Supavisor porta 6543)
      max: 10,
      idle_timeout: 20
    });
    await client.unsafe(BOOTSTRAP_DDL);
    return drizzlePostgres(client, { schema });
  }

  // 2. Conexão Local / Testes Vitest: PostgreSQL 16 Embarcado (@electric-sql/pglite)
  const isMemory = process.env.PGLITE_MEMORY === 'true' || env.NODE_ENV === 'test';
  const dataDir = isMemory ? undefined : './.pgdata';
  const absDataDir = path.join(process.cwd(), '.pgdata');

  if (dataDir && !globalThis.__norteRawPglite && fs.existsSync(absDataDir)) {
    // Limpa lock residual caso um processo anterior tenha encerrado abruptamente
    for (const lockFile of ['postmaster.pid', '.s.PGSQL.5432.lock.out']) {
      const lockPath = path.join(absDataDir, lockFile);
      if (fs.existsSync(lockPath)) {
        try {
          fs.rmSync(lockPath, { force: true });
        } catch {
          // ignora caso já removido
        }
      }
    }
  }

  const pglite = globalThis.__norteRawPglite ?? new PGlite(dataDir);
  if (!isMemory && !globalThis.__norteRawPglite) {
    globalThis.__norteRawPglite = pglite;
  }
  await pglite.waitReady;
  await pglite.exec(BOOTSTRAP_DDL);

  // Migrações dinâmicas de colunas fundamentalistas estendidas
  const ALTER_COLUMNS = `
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS psr NUMERIC(14, 4);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS ev_ebit NUMERIC(14, 4);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS ev_ebitda NUMERIC(14, 4);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS roa NUMERIC(14, 4);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS ebit_margin NUMERIC(14, 4);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS current_ratio NUMERIC(14, 4);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS net_debt_ebitda NUMERIC(14, 4);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS revenue_growth NUMERIC(14, 4);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS revenue_growth_5y NUMERIC(14, 4);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS earnings_growth NUMERIC(14, 4);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS payout_ratio NUMERIC(14, 4);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS property_count NUMERIC(14, 2);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS price_per_sqm NUMERIC(14, 2);
    ALTER TABLE fundamentals ADD COLUMN IF NOT EXISTS rent_per_sqm NUMERIC(14, 2);
  `;
  await pglite.exec(ALTER_COLUMNS).catch(() => {});
  await syncV1Fundamentals((sql) => pglite.exec(sql));

  return drizzlePglite(pglite, { schema });
}

async function syncV1Fundamentals(dbExec: (sql: string) => Promise<unknown>) {
  try {
    const sqlitePath = path.resolve(process.cwd(), '../investment-data.db');
    const localSqlitePath = path.resolve(process.cwd(), 'investment-data.db');
    const finalSqlitePath = fs.existsSync(sqlitePath)
      ? sqlitePath
      : fs.existsSync(localSqlitePath)
        ? localSqlitePath
        : null;
    if (!finalSqlitePath) return;

    // @ts-expect-error better-sqlite3 declaration is optional in v2
    const { default: Database } = (await import('better-sqlite3')) as {
      default: new (
        path: string,
        options?: Record<string, unknown>
      ) => { prepare: (sql: string) => { all: () => Record<string, unknown>[] } };
    };
    const v1Db = new Database(finalSqlitePath, { readonly: true });
    const rows = v1Db
      .prepare(`
        SELECT f.* FROM fundamentals f
        INNER JOIN (
          SELECT asset_code, MAX(updated_at) as max_u FROM fundamentals GROUP BY asset_code
        ) m ON f.asset_code = m.asset_code AND f.updated_at = m.max_u
      `)
      .all() as Record<string, unknown>[];

    if (!rows || rows.length === 0) return;

    for (const r of rows) {
      const code = String(r.asset_code || '').toUpperCase().trim();
      if (!code) continue;

      const psr = r.psr != null ? Number(r.psr) : 'NULL';
      const evEbit = r.ev_ebit != null ? Number(r.ev_ebit) : 'NULL';
      const evEbitda = r.ev_ebitda != null ? Number(r.ev_ebitda) : 'NULL';
      const roa = r.roa != null ? Number(r.roa) : 'NULL';
      const ebitMargin = r.ebit_margin != null ? Number(r.ebit_margin) : 'NULL';
      const currentRatio = r.current_ratio != null ? Number(r.current_ratio) : 'NULL';
      const netDebtEbitda = r.net_debt != null ? Number(r.net_debt) : 'NULL';
      const revenueGrowth = r.revenue_growth != null ? Number(r.revenue_growth) : 'NULL';
      const revenueGrowth5y = r.revenue_growth_5y != null ? Number(r.revenue_growth_5y) : 'NULL';
      const earningsGrowth = r.earnings_growth != null ? Number(r.earnings_growth) : 'NULL';
      const propertyCount = r.property_count != null ? Number(r.property_count) : 'NULL';
      const pricePerSqm = r.price_per_sqm != null ? Number(r.price_per_sqm) : 'NULL';
      const rentPerSqm = r.rent_per_sqm != null ? Number(r.rent_per_sqm) : 'NULL';
      const roic = r.roic != null ? Number(r.roic) : 'NULL';
      const capRate = r.cap_rate != null ? Number(r.cap_rate) : 'NULL';
      const ffoYield = r.ffo_yield != null ? Number(r.ffo_yield) : 'NULL';

      const sql = `
        UPDATE fundamentals
        SET psr = COALESCE(${psr}, psr),
            ev_ebit = COALESCE(${evEbit}, ev_ebit),
            ev_ebitda = COALESCE(${evEbitda}, ev_ebitda),
            roa = COALESCE(${roa}, roa),
            ebit_margin = COALESCE(${ebitMargin}, ebit_margin),
            current_ratio = COALESCE(${currentRatio}, current_ratio),
            net_debt_ebitda = COALESCE(${netDebtEbitda}, net_debt_ebitda),
            revenue_growth = COALESCE(${revenueGrowth}, revenue_growth),
            revenue_growth_5y = COALESCE(${revenueGrowth5y}, revenue_growth_5y),
            earnings_growth = COALESCE(${earningsGrowth}, earnings_growth),
            property_count = COALESCE(${propertyCount}, property_count),
            price_per_sqm = COALESCE(${pricePerSqm}, price_per_sqm),
            rent_per_sqm = COALESCE(${rentPerSqm}, rent_per_sqm),
            roic = COALESCE(${roic}, roic),
            cap_rate = COALESCE(${capRate}, cap_rate),
            ffo_yield = COALESCE(${ffoYield}, ffo_yield)
        WHERE asset_code = '${code}';
      `;
      await dbExec(sql).catch(() => {});
    }
  } catch {
    // Ignora em caso de indisponibilidade
  }
}

export async function getDb(): Promise<AppDatabase> {
  if (!globalThis.__nortePgDbPromise) {
    globalThis.__nortePgDbPromise = createDatabaseConnection();
  }
  return globalThis.__nortePgDbPromise;
}

export async function closeDb(): Promise<void> {
  if (globalThis.__norteRawPglite) {
    await globalThis.__norteRawPglite.close();
    globalThis.__norteRawPglite = undefined;
    globalThis.__nortePgDbPromise = undefined;
  }
}
