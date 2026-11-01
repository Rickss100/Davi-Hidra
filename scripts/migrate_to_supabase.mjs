import { PGlite } from '@electric-sql/pglite';
import postgres from 'postgres';

const SUPABASE_URL = process.env.DATABASE_URL;
if (!SUPABASE_URL) {
  console.error('❌ Erro: DATABASE_URL não definida no ambiente (.env).');
  process.exit(1);
}

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

async function main() {
  console.log('🚀 Iniciando Migração Padrão Ouro de Alta Performance (PGlite ➔ Supabase Cloud)...');

  // 1. Conectar ao PGlite Local
  console.log('📦 Conectando à base local (.pgdata)...');
  const localPg = new PGlite('./.pgdata');
  await localPg.waitReady;
  console.log('✓ Base local conectada.');

  // 2. Conectar ao Supabase
  console.log('🌐 Conectando ao cluster do Supabase...');
  const remoteSql = postgres(SUPABASE_URL, { connect_timeout: 15, ssl: 'require', max: 5 });
  const check = await remoteSql`SELECT version()`;
  console.log('✓ Supabase conectado:', check[0].version.split(',')[0]);

  // 3. Criar DDL no Supabase
  console.log('🏗️ Criando tabelas e índices no Supabase...');
  await remoteSql.unsafe('DROP TABLE IF EXISTS audit_logs CASCADE;');
  await remoteSql.unsafe(BOOTSTRAP_DDL);
  console.log('✓ Tabelas e índices criados.');

  // 4. Migrar Usuários
  const localUsers = (await localPg.query('SELECT * FROM users ORDER BY id ASC')).rows;
  console.log(`👤 Migrando ${localUsers.length} usuários...`);
  for (const u of localUsers) {
    await remoteSql`
      INSERT INTO users (
        id, uuid, email, password_hash, name, role, status, plan_period, plan_expires_at,
        totp_secret_encrypted, totp_enabled, reset_token_hash, reset_expires_at, last_login_at, created_at, updated_at
      ) VALUES (
        ${u.id}, ${u.uuid}, ${u.email}, ${u.password_hash}, ${u.name}, ${u.role}, ${u.status}, ${u.plan_period},
        ${u.plan_expires_at}, ${u.totp_secret_encrypted}, ${u.totp_enabled}, ${u.reset_token_hash},
        ${u.reset_expires_at}, ${u.last_login_at}, ${u.created_at}, ${u.updated_at}
      )
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        plan_period = EXCLUDED.plan_period,
        password_hash = EXCLUDED.password_hash,
        totp_enabled = EXCLUDED.totp_enabled,
        totp_secret_encrypted = EXCLUDED.totp_secret_encrypted;
    `;
  }
  await remoteSql`SELECT setval('users_id_seq', (SELECT COALESCE(MAX(id), 1) FROM users))`;
  console.log(`✓ ${localUsers.length} usuários migrados.`);

  // 5. Migrar Ativos em Lotes (Chunks de 200)
  const localAssets = (await localPg.query('SELECT * FROM assets ORDER BY code ASC')).rows;
  console.log(`📦 Migrando ${localAssets.length} ativos do catálogo (em lotes)...`);
  const assetCols = ['code', 'name', 'type', 'market', 'sector', 'created_at', 'last_updated'];
  const CHUNK_SIZE = 150;
  for (let i = 0; i < localAssets.length; i += CHUNK_SIZE) {
    const chunk = localAssets.slice(i, i + CHUNK_SIZE);
    await remoteSql`
      INSERT INTO assets ${remoteSql(chunk, ...assetCols)}
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        market = EXCLUDED.market,
        sector = EXCLUDED.sector,
        last_updated = EXCLUDED.last_updated
    `;
  }
  console.log(`✓ ${localAssets.length} ativos migrados.`);

  // 6. Migrar Fundamentals em Lotes
  const localFundamentals = (await localPg.query('SELECT * FROM fundamentals')).rows;
  console.log(`📊 Migrando ${localFundamentals.length} indicadores fundamentalistas (em lotes)...`);
  const fundCols = [
    'asset_code', 'market_cap', 'pe_ratio', 'pb_ratio', 'dividend_yield', 'roe', 'roic', 'profit_margin',
    'debt_to_equity', 'p_vpa', 'vacancy_rate', 'cap_rate', 'ffo_yield', 'liquidity', 'psr', 'ev_ebit',
    'ev_ebitda', 'roa', 'ebit_margin', 'current_ratio', 'net_debt_ebitda', 'revenue_growth', 'revenue_growth_5y',
    'earnings_growth', 'payout_ratio', 'property_count', 'price_per_sqm', 'rent_per_sqm', 'indexer',
    'rate_fixed', 'rate_description', 'maturity_date', 'liquidity_type', 'guarantee', 'tax_free', 'min_investment', 'updated_at'
  ];
  for (let i = 0; i < localFundamentals.length; i += CHUNK_SIZE) {
    const chunk = localFundamentals.slice(i, i + CHUNK_SIZE);
    await remoteSql`
      INSERT INTO fundamentals ${remoteSql(chunk, ...fundCols)}
      ON CONFLICT (asset_code) DO UPDATE SET
        dividend_yield = EXCLUDED.dividend_yield,
        p_vpa = EXCLUDED.p_vpa,
        pe_ratio = EXCLUDED.pe_ratio,
        roe = EXCLUDED.roe,
        liquidity = EXCLUDED.liquidity,
        updated_at = EXCLUDED.updated_at
    `;
  }
  console.log(`✓ ${localFundamentals.length} indicadores fundamentalistas migrados.`);

  // 7. Migrar Cached Prices
  const localPrices = (await localPg.query('SELECT * FROM cached_prices')).rows;
  console.log(`💰 Migrando ${localPrices.length} cotações em cache...`);
  if (localPrices.length > 0) {
    const priceCols = ['asset_code', 'price', 'change_percent', 'currency', 'source', 'updated_at'];
    for (let i = 0; i < localPrices.length; i += CHUNK_SIZE) {
      const chunk = localPrices.slice(i, i + CHUNK_SIZE);
      await remoteSql`
        INSERT INTO cached_prices ${remoteSql(chunk, ...priceCols)}
        ON CONFLICT (asset_code) DO UPDATE SET
          price = EXCLUDED.price,
          change_percent = EXCLUDED.change_percent,
          updated_at = EXCLUDED.updated_at
      `;
    }
  }
  console.log(`✓ ${localPrices.length} cotações migradas.`);

  // 8. Migrar Economic Indicators
  const localEcon = (await localPg.query('SELECT * FROM economic_indicators')).rows;
  console.log(`📈 Migrando ${localEcon.length} indicadores macroeconômicos...`);
  if (localEcon.length > 0) {
    const econCols = ['indicator', 'reference_date', 'value', 'updated_at'];
    for (let i = 0; i < localEcon.length; i += CHUNK_SIZE) {
      const chunk = localEcon.slice(i, i + CHUNK_SIZE);
      await remoteSql`
        INSERT INTO economic_indicators ${remoteSql(chunk, ...econCols)}
        ON CONFLICT (indicator, reference_date) DO UPDATE SET
          value = EXCLUDED.value,
          updated_at = EXCLUDED.updated_at
      `;
    }
  }
  console.log(`✓ ${localEcon.length} indicadores macroeconômicos migrados.`);

  // 9. Migrar User Objectives
  const localObjectives = (await localPg.query('SELECT * FROM user_objectives')).rows;
  console.log(`🎯 Migrando ${localObjectives.length} objetivos patrimoniais Hydra...`);
  for (const obj of localObjectives) {
    await remoteSql`
      INSERT INTO user_objectives (user_id, macro_allocation, asset_targets, emergency_config, updated_at)
      VALUES (
        ${obj.user_id},
        ${typeof obj.macro_allocation === 'string' ? obj.macro_allocation : JSON.stringify(obj.macro_allocation)},
        ${typeof obj.asset_targets === 'string' ? obj.asset_targets : JSON.stringify(obj.asset_targets)},
        ${typeof obj.emergency_config === 'string' ? obj.emergency_config : JSON.stringify(obj.emergency_config)},
        ${obj.updated_at}
      )
      ON CONFLICT (user_id) DO UPDATE SET
        macro_allocation = EXCLUDED.macro_allocation,
        asset_targets = EXCLUDED.asset_targets,
        emergency_config = EXCLUDED.emergency_config,
        updated_at = EXCLUDED.updated_at;
    `;
  }
  console.log(`✓ ${localObjectives.length} objetivos Hydra migrados.`);

  // 10. Migrar Transações em Lotes
  const localTxs = (await localPg.query('SELECT * FROM transactions ORDER BY id ASC')).rows;
  console.log(`🧾 Migrando ${localTxs.length} transações e proventos históricos (em lotes)...`);

  await remoteSql`TRUNCATE TABLE transactions RESTART IDENTITY CASCADE`;

  const txCols = [
    'id', 'uuid', 'user_id', 'asset_code', 'type', 'quantity',
    'price', 'total_value', 'executed_date', 'notes', 'dedup_hash', 'created_at'
  ];
  for (let i = 0; i < localTxs.length; i += CHUNK_SIZE) {
    const chunk = localTxs.slice(i, i + CHUNK_SIZE);
    await remoteSql`
      INSERT INTO transactions ${remoteSql(chunk, ...txCols)}
    `;
    const done = Math.min(localTxs.length, i + chunk.length);
    const pct = Math.round((done / localTxs.length) * 100);
    process.stdout.write(`\r   Progresso das Transações: ${done}/${localTxs.length} (${pct}%)`);
  }
  process.stdout.write('\n');
  await remoteSql`SELECT setval('transactions_id_seq', (SELECT COALESCE(MAX(id), 1) FROM transactions))`;
  console.log(`✓ ${localTxs.length} transações migradas com sucesso.`);

  // 11. Validação Final Remota
  console.log('🔍 Executando auditoria final no Supabase Cloud...');
  const remoteCounts = await remoteSql`
    SELECT 
      (SELECT COUNT(*) FROM users) as users_count,
      (SELECT COUNT(*) FROM assets) as assets_count,
      (SELECT COUNT(*) FROM fundamentals) as fundamentals_count,
      (SELECT COUNT(*) FROM transactions) as tx_count,
      (SELECT COUNT(*) FROM transactions WHERE type = 'buy') as buys_count,
      (SELECT COUNT(*) FROM transactions WHERE type = 'event') as events_count,
      (SELECT SUM(total_value) FROM transactions) as total_volume
  `;
  console.log('📊 CONTAGEM OFICIAL NO SUPABASE:');
  console.table(remoteCounts[0]);

  await localPg.close();
  await remoteSql.end();
  console.log('🎉 Migração concluída com 100% de êxito! O Supabase está pronto para produção.');
}

main().catch((err) => {
  console.error('❌ Falha na migração para o Supabase:', err);
  process.exit(1);
});
