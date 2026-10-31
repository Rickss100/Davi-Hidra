import {
  pgTable,
  serial,
  integer,
  text,
  boolean,
  numeric,
  timestamp,
  uuid,
  jsonb,
  index,
  uniqueIndex,
  primaryKey
} from 'drizzle-orm/pg-core';

export interface MacroAllocationConfig {
  fixed: number;
  variable: number;
  brasil: number;
  usa: number;
  acoes: number;
  fiis: number;
  stocks: number;
  reits: number;
}

export interface AssetTargetItem {
  code: string;
  ticker?: string;
  sector?: string;
  target: number;
}

export interface AssetTargetsConfig {
  acoes: AssetTargetItem[];
  fiis: AssetTargetItem[];
  stocks: AssetTargetItem[];
  reits: AssetTargetItem[];
  fixed: AssetTargetItem[];
  reserva: AssetTargetItem[];
}

export interface EmergencyReserveConfig {
  monthlyExpense: number;
  monthsTarget: number;
  manualReserveBalance: number;
  strategyMode: 'focus_100' | 'hybrid_70_30' | 'hybrid_50_50';
}

// ============================================================================
// 1. USERS (Identidade Híbrida ID Interno + UUID Público + 2FA AES-256-GCM)
// ============================================================================
export const users = pgTable(
  'users',
  {
    id: serial('id').primaryKey(),
    uuid: uuid('uuid').defaultRandom().notNull(),
    email: text('email').notNull(),
    passwordHash: text('password_hash').notNull(),
    name: text('name').notNull(),
    role: text('role').notNull().default('user'), // 'admin' | 'collaborator' | 'user'
    status: text('status').notNull().default('active'), // 'active' | 'suspended' | 'inactive'
    planPeriod: text('plan_period').notNull().default('lifetime'),
    planExpiresAt: timestamp('plan_expires_at', { withTimezone: true }),
    totpSecretEncrypted: text('totp_secret_encrypted'),
    totpEnabled: boolean('totp_enabled').notNull().default(false),
    resetTokenHash: text('reset_token_hash'),
    resetExpiresAt: timestamp('reset_expires_at', { withTimezone: true }),
    lastLoginAt: timestamp('last_login_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    uniqueIndex('idx_users_uuid').on(table.uuid),
    uniqueIndex('idx_users_email').on(table.email),
    index('idx_users_role').on(table.role),
    index('idx_users_status').on(table.status)
  ]
);

// ============================================================================
// 2. USER SESSIONS (Sessões HttpOnly Revogáveis + Modo Auditoria Server-Side)
// ============================================================================
export const userSessions = pgTable(
  'user_sessions',
  {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    impersonatedUserId: integer('impersonated_user_id').references(() => users.id, {
      onDelete: 'set null'
    }),
    ipAddress: text('ip_address'),
    userAgent: text('user_agent'),
    expiresAt: timestamp('expires_at', { withTimezone: true }).notNull(),
    revokedAt: timestamp('revoked_at', { withTimezone: true }),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [index('idx_sessions_user').on(table.userId)]
);

// ============================================================================
// 3. ASSETS (Catálogo Global de Ativos BR & US)
// ============================================================================
export const assets = pgTable(
  'assets',
  {
    code: text('code').primaryKey(),
    name: text('name').notNull(),
    type: text('type').notNull(), // 'Acao' | 'FII' | 'Stock' | 'REIT' | 'Renda Fixa'
    market: text('market').notNull().default('BR'), // 'BR' | 'US'
    sector: text('sector'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull(),
    lastUpdated: timestamp('last_updated', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_assets_type').on(table.type),
    index('idx_assets_market').on(table.market)
  ]
);

// ============================================================================
// 4. FUNDAMENTALS (Indicadores Fundamentalistas & Renda Fixa — Precisão NUMERIC)
// ============================================================================
export const fundamentals = pgTable(
  'fundamentals',
  {
    id: serial('id').primaryKey(),
    assetCode: text('asset_code')
      .notNull()
      .references(() => assets.code, { onDelete: 'cascade' }),
    marketCap: numeric('market_cap', { precision: 20, scale: 2 }),
    peRatio: numeric('pe_ratio', { precision: 14, scale: 4 }),
    pbRatio: numeric('pb_ratio', { precision: 14, scale: 4 }),
    dividendYield: numeric('dividend_yield', { precision: 14, scale: 4 }),
    roe: numeric('roe', { precision: 14, scale: 4 }),
    roic: numeric('roic', { precision: 14, scale: 4 }),
    profitMargin: numeric('profit_margin', { precision: 14, scale: 4 }),
    debtToEquity: numeric('debt_to_equity', { precision: 14, scale: 4 }),
    pVpa: numeric('p_vpa', { precision: 14, scale: 4 }),
    vacancyRate: numeric('vacancy_rate', { precision: 14, scale: 4 }),
    capRate: numeric('cap_rate', { precision: 14, scale: 4 }),
    ffoYield: numeric('ffo_yield', { precision: 14, scale: 4 }),
    liquidity: numeric('liquidity', { precision: 20, scale: 2 }),
    psr: numeric('psr', { precision: 14, scale: 4 }),
    evEbit: numeric('ev_ebit', { precision: 14, scale: 4 }),
    evEbitda: numeric('ev_ebitda', { precision: 14, scale: 4 }),
    roa: numeric('roa', { precision: 14, scale: 4 }),
    ebitMargin: numeric('ebit_margin', { precision: 14, scale: 4 }),
    currentRatio: numeric('current_ratio', { precision: 14, scale: 4 }),
    netDebtEbitda: numeric('net_debt_ebitda', { precision: 14, scale: 4 }),
    revenueGrowth: numeric('revenue_growth', { precision: 14, scale: 4 }),
    revenueGrowth5y: numeric('revenue_growth_5y', { precision: 14, scale: 4 }),
    earningsGrowth: numeric('earnings_growth', { precision: 14, scale: 4 }),
    payoutRatio: numeric('payout_ratio', { precision: 14, scale: 4 }),
    propertyCount: numeric('property_count', { precision: 14, scale: 2 }),
    pricePerSqm: numeric('price_per_sqm', { precision: 14, scale: 2 }),
    rentPerSqm: numeric('rent_per_sqm', { precision: 14, scale: 2 }),
    indexer: text('indexer'),
    rateFixed: numeric('rate_fixed', { precision: 14, scale: 4 }),
    rateDescription: text('rate_description'),
    maturityDate: text('maturity_date'),
    liquidityType: text('liquidity_type'),
    guarantee: text('guarantee'),
    taxFree: boolean('tax_free').default(false),
    minInvestment: numeric('min_investment', { precision: 18, scale: 2 }),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [uniqueIndex('idx_fundamentals_asset_unique').on(table.assetCode)]
);

// ============================================================================
// 5. CACHED PRICES (Cache Centralizado de Cotações Live — NUMERIC 18,6)
// ============================================================================
export const cachedPrices = pgTable('cached_prices', {
  assetCode: text('asset_code').primaryKey(),
  price: numeric('price', { precision: 18, scale: 6 }).notNull(),
  changePercent: numeric('change_percent', { precision: 12, scale: 4 }).default('0'),
  currency: text('currency').notNull().default('BRL'),
  source: text('source').notNull().default('brapi'),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ============================================================================
// 6. ECONOMIC INDICATORS (SELIC, CDI, IPCA, DOLAR)
// ============================================================================
export const economicIndicators = pgTable(
  'economic_indicators',
  {
    id: serial('id').primaryKey(),
    indicator: text('indicator').notNull(),
    referenceDate: text('reference_date').notNull(),
    value: numeric('value', { precision: 18, scale: 6 }).notNull(),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [uniqueIndex('idx_econ_indicator_date').on(table.indicator, table.referenceDate)]
);

// ============================================================================
// 7. TRANSACTIONS (Custódia & Proventos dos Clientes — NUMERIC Bancário)
// ============================================================================
export const transactions = pgTable(
  'transactions',
  {
    id: serial('id').primaryKey(),
    uuid: uuid('uuid').defaultRandom().notNull(),
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assetCode: text('asset_code')
      .notNull()
      .references(() => assets.code, { onDelete: 'restrict' }),
    type: text('type').notNull(), // 'buy' | 'sell' | 'event'
    quantity: numeric('quantity', { precision: 18, scale: 8 }).notNull(),
    price: numeric('price', { precision: 18, scale: 6 }).notNull(),
    totalValue: numeric('total_value', { precision: 18, scale: 2 }).notNull(),
    executedDate: text('executed_date').notNull(), // YYYY-MM-DD
    notes: text('notes'),
    dedupHash: text('dedup_hash'),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_tx_user_date').on(table.userId, table.executedDate),
    index('idx_tx_user_asset').on(table.userId, table.assetCode),
    index('idx_tx_dedup').on(table.userId, table.dedupHash)
  ]
);

// ============================================================================
// 8. USER OBJECTIVES (Metas DAVI & Hydra + Reserva de Emergência — JSONB Tipado)
// ============================================================================
export const userObjectives = pgTable('user_objectives', {
  userId: integer('user_id')
    .primaryKey()
    .references(() => users.id, { onDelete: 'cascade' }),
  macroAllocation: jsonb('macro_allocation').$type<MacroAllocationConfig>().notNull(),
  assetTargets: jsonb('asset_targets').$type<AssetTargetsConfig>().notNull(),
  emergencyConfig: jsonb('emergency_config').$type<EmergencyReserveConfig>().notNull(),
  updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
});

// ============================================================================
// 9. USER ASSET NOTES (Avaliações e Notas Isoladas por Cliente — Fix de Segurança V2)
// ============================================================================
export const userAssetNotes = pgTable(
  'user_asset_notes',
  {
    userId: integer('user_id')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    assetCode: text('asset_code')
      .notNull()
      .references(() => assets.code, { onDelete: 'cascade' }),
    rating: integer('rating').default(5),
    notes: text('notes'),
    updatedAt: timestamp('updated_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [primaryKey({ columns: [table.userId, table.assetCode] })]
);

// ============================================================================
// 10. AUDIT LOGS (Trilha de Auditoria Imutável Compliance / LGPD)
// ============================================================================
export const auditLogs = pgTable(
  'audit_logs',
  {
    id: serial('id').primaryKey(),
    actorUserId: integer('actor_user_id').references(() => users.id, { onDelete: 'set null' }),
    targetUserId: integer('target_user_id').references(() => users.id, { onDelete: 'set null' }),
    action: text('action').notNull(),
    ipAddress: text('ip_address'),
    metadata: jsonb('metadata').$type<Record<string, unknown>>(),
    createdAt: timestamp('created_at', { withTimezone: true }).defaultNow().notNull()
  },
  (table) => [
    index('idx_audit_actor').on(table.actorUserId),
    index('idx_audit_target').on(table.targetUserId),
    index('idx_audit_created').on(table.createdAt)
  ]
);
