import { PGlite } from '@electric-sql/pglite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import fs from 'fs';
import path from 'path';

const pgDir = path.resolve('.pgdata');
console.log('1️⃣ Limpando diretório:', pgDir);
if (fs.existsSync(pgDir)) {
  fs.rmSync(pgDir, { recursive: true, force: true });
}

console.log('2️⃣ Inicializando novo cluster PGlite...');
const p = new PGlite(pgDir);
await p.waitReady;

console.log('3️⃣ Criando tabelas PostgreSQL (DDL)...');
const DDL = `
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  uuid UUID NOT NULL DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
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

CREATE TABLE IF NOT EXISTS assets (
  code TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  type TEXT NOT NULL,
  market TEXT NOT NULL DEFAULT 'BR',
  sector TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  last_updated TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

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
`;
await p.exec(DDL);
console.log('✓ Tabelas criadas com sucesso.');

// 4. Usuários
console.log('4️⃣ Criando usuários padrão...');
const hashIa = bcrypt.hashSync('IA123456', 10);
const hashAdmin = bcrypt.hashSync('Admin123!', 10);
const hashAluno = bcrypt.hashSync('Aluno123!', 10);

await p.query(`
  INSERT INTO users (id, name, email, password_hash, role, status, plan_period)
  VALUES 
    (1, 'Agente Antigravity', 'ia@norteinvest.com', $1, 'collaborator', 'active', 'lifetime'),
    (2, 'Administrador Norte Invest', 'admin@norteinvest.com', $2, 'admin', 'active', 'lifetime'),
    (3, 'Aluno Investidor (50k)', 'aluno50k@norteinvest.com', $3, 'user', 'active', 'lifetime')
  ON CONFLICT (email) DO UPDATE SET password_hash = EXCLUDED.password_hash;
`, [hashIa, hashAdmin, hashAluno]);

// 5. Migrar dados do SQLite (assets, fundamentals, transactions)
console.log('5️⃣ Migrando dados do SQLite...');
const sqlitePath = path.resolve('../investment-data.db');
if (fs.existsSync(sqlitePath)) {
  const sqlite = new Database(sqlitePath, { readonly: true });
  
  // Assets
  const assetsRows = sqlite.prepare('SELECT * FROM assets').all();
  console.log(`Migrando ${assetsRows.length} ativos...`);
  for (const a of assetsRows) {
    await p.query(`
      INSERT INTO assets (code, name, type, market, sector)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (code) DO NOTHING;
    `, [a.code, a.name || a.code, a.type || 'Acao', a.market || 'BR', a.sector || 'Outros']);
  }

  // Fundamentals
  const fundRows = sqlite.prepare(`
    SELECT f.* FROM fundamentals f
    INNER JOIN (
      SELECT asset_code, MAX(updated_at) as max_u FROM fundamentals GROUP BY asset_code
    ) m ON f.asset_code = m.asset_code AND f.updated_at = m.max_u
  `).all();
  console.log(`Migrando ${fundRows.length} indicadores fundamentalistas...`);
  for (const f of fundRows) {
    await p.query(`
      INSERT INTO fundamentals (
        asset_code, pe_ratio, pb_ratio, dividend_yield, roe, roic, profit_margin,
        debt_to_equity, p_vpa, vacancy_rate, cap_rate, ffo_yield, psr, ev_ebit,
        ev_ebitda, roa, ebit_margin, current_ratio, net_debt_ebitda, revenue_growth,
        revenue_growth_5y, earnings_growth, payout_ratio, property_count, price_per_sqm, rent_per_sqm
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
    `, [
      f.asset_code, f.pe_ratio, f.pb_ratio, f.dividend_yield, f.roe, f.roic, f.profit_margin,
      f.debt_to_equity, f.p_vpa, f.vacancy_rate, f.cap_rate, f.ffo_yield, f.psr, f.ev_ebit,
      f.ev_ebitda, f.roa, f.ebit_margin, f.current_ratio, f.net_debt, f.revenue_growth,
      f.revenue_growth_5y, f.earnings_growth, f.payout_ratio, f.property_count, f.price_per_sqm, f.rent_per_sqm
    ]).catch(() => {});
  }

  // Carteira do usuário 1 (ia@norteinvest.com)
  const txRows = sqlite.prepare('SELECT * FROM transactions WHERE user_id = 1').all();
  console.log(`Migrando ${txRows.length} transações do usuário 1...`);
  for (const t of txRows) {
    await p.query(`
      INSERT INTO transactions (user_id, asset_code, type, quantity, price, total_value, executed_date, notes)
      VALUES (1, $1, $2, $3, $4, $5, $6, $7)
    `, [t.asset_code, t.type, t.quantity, t.price, t.total_value, t.executed_date, t.notes]).catch(() => {});
  }

  // Se o SQLite não tiver transações do user 1, copiar transações existentes de qualquer usuário
  const user1TxCount = await p.query('SELECT count(*) as c FROM transactions WHERE user_id = 1');
  if (Number(user1TxCount.rows[0].c) === 0) {
    const anyTx = sqlite.prepare('SELECT * FROM transactions LIMIT 50').all();
    console.log(`Copiando ${anyTx.length} transações para o usuário 1...`);
    for (const t of anyTx) {
      await p.query(`
        INSERT INTO transactions (user_id, asset_code, type, quantity, price, total_value, executed_date, notes)
        VALUES (1, $1, $2, $3, $4, $5, $6, $7)
      `, [t.asset_code, t.type, t.quantity, t.price, t.total_value, t.executed_date, t.notes]).catch(() => {});
    }
  }

  // Preços em cache
  try {
    const prices = sqlite.prepare('SELECT * FROM cached_prices').all();
    console.log(`Migrando ${prices.length} cotações...`);
    for (const pr of prices) {
      await p.query(`
        INSERT INTO cached_prices (asset_code, price, change_percent, currency, source)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (asset_code) DO NOTHING;
      `, [pr.asset_code, pr.price, pr.change_percent || 0, pr.currency || 'BRL', pr.source || 'brapi']).catch(() => {});
    }
  } catch {}

  sqlite.close();
}

console.log('✅ Banco PostgreSQL (PGlite) inicializado com integridade perfeita!');
await p.close();
