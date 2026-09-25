-- Database Schema for DAVI & HYDRA Investment Portfolio App
-- SQLite3 database for storing market data, fundamentals, and cache

-- ============================================================================
-- 1. ASSETS TABLE - Basic asset information
-- ============================================================================
CREATE TABLE IF NOT EXISTS assets (
  code TEXT PRIMARY KEY,              -- Ticker symbol (e.g., PETR4, AAPL)
  name TEXT NOT NULL,                 -- Full company/fund name
  type TEXT NOT NULL,                 -- 'acao', 'fii', 'stock', 'reit'
  market TEXT NOT NULL,               -- 'BR' or 'US'
  sector TEXT,                        -- Business sector
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  last_updated DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_assets_type ON assets(type);
CREATE INDEX IF NOT EXISTS idx_assets_market ON assets(market);

-- ============================================================================
-- 2. FUNDAMENTALS TABLE - Financial indicators
-- ============================================================================
CREATE TABLE IF NOT EXISTS fundamentals (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_code TEXT NOT NULL,
  
  -- Valuation metrics
  market_cap REAL,                    -- Market capitalization
  pe_ratio REAL,                      -- P/E (Price/Earnings)
  pb_ratio REAL,                      -- P/B (Price/Book)
  dividend_yield REAL,                -- Dividend Yield %
  psr REAL,                           -- Price/Sales Ratio (PSR)
  ev_ebit REAL,                       -- EV/EBIT
  ev_ebitda REAL,                     -- EV/EBITDA
  
  -- Profitability
  roe REAL,                           -- Return on Equity %
  roa REAL,                           -- Return on Assets %
  roic REAL,                          -- Return on Invested Capital %
  profit_margin REAL,                 -- Net profit margin %
  ebit_margin REAL,                   -- EBIT margin %
  
  -- Debt & Liquidity
  debt_to_equity REAL,                -- Debt/Equity ratio
  current_ratio REAL,                 -- Current assets / Current liabilities
  net_debt REAL,                      -- Dívida Líquida
  net_equity REAL,                    -- Patrimônio Líquido
  
  -- Growth
  revenue REAL,                       -- Annual revenue
  revenue_growth REAL,                -- Revenue growth % (YoY)
  revenue_growth_5y REAL,             -- Revenue growth 5 years %
  earnings_growth REAL,               -- Earnings growth %
  
  -- REITs/FIIs specific
  nav_per_share REAL,                 -- Net Asset Value per share
  vacancy_rate REAL,                  -- Vacancy rate %
  p_vpa REAL,                         -- Preço / Valor Patrimonial por Ação
  ffo_yield REAL,                     -- FFO Yield %
  cap_rate REAL,                      -- Capitalization Rate %
  liquidity REAL,                     -- Liquidez diária média (volume)
  property_count INTEGER,             -- Quantidade de imóveis
  price_per_sqm REAL,                 -- Preço por m²
  rent_per_sqm REAL,                  -- Aluguel por m²

  -- Renda Fixa specific
  indexer TEXT,                       -- 'SELIC', 'IPCA', 'CDI', 'PREFIXADO'
  rate_fixed REAL,                    -- Taxa numérica básica (ex: 6.5 para IPCA+ 6.5%, 100 para 100% CDI)
  rate_description TEXT,              -- Exibição amigável: 'IPCA + 6,50%', '100% do CDI'
  maturity_date TEXT,                 -- Data de vencimento ou 'Liquidez Diária'
  liquidity_type TEXT,                -- 'D+0 (Diária)', 'D+1', 'No Vencimento'
  guarantee TEXT,                     -- 'Tesouro Nacional (Soberano)', 'FGC (até R$ 250k)'
  tax_free INTEGER DEFAULT 0,         -- 1 = Isento de IR, 0 = Tabela Regressiva
  min_investment REAL,                -- Valor mínimo de aporte (ex: 35.50)
  
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_code) REFERENCES assets(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_fundamentals_asset ON fundamentals(asset_code);
CREATE INDEX IF NOT EXISTS idx_fundamentals_updated ON fundamentals(updated_at);

-- ============================================================================
-- 3. PRICES TABLE - Historical price data (OHLCV)
-- ============================================================================
CREATE TABLE IF NOT EXISTS prices (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_code TEXT NOT NULL,
  date DATE NOT NULL,
  open REAL,                          -- Opening price
  high REAL,                          -- Highest price
  low REAL,                           -- Lowest price
  close REAL NOT NULL,                -- Closing price
  volume INTEGER,                     -- Trading volume
  
  FOREIGN KEY (asset_code) REFERENCES assets(code) ON DELETE CASCADE,
  UNIQUE(asset_code, date)            -- Prevent duplicate entries
);

CREATE INDEX IF NOT EXISTS idx_prices_asset ON prices(asset_code);
CREATE INDEX IF NOT EXISTS idx_prices_date ON prices(date);
CREATE INDEX IF NOT EXISTS idx_prices_asset_date ON prices(asset_code, date);

-- ============================================================================
-- 4. DIVIDENDS TABLE - Dividend/Income distribution history
-- ============================================================================
CREATE TABLE IF NOT EXISTS dividends (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_code TEXT NOT NULL,
  ex_date DATE NOT NULL,             -- Ex-dividend date
  payment_date DATE,                 -- Payment date
  amount REAL NOT NULL,              -- Amount per share
  type TEXT,                         -- 'dividend', 'jcp', 'rendimento', 'bonus'
  
  FOREIGN KEY (asset_code) REFERENCES assets(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_dividends_asset ON dividends(asset_code);
CREATE INDEX IF NOT EXISTS idx_dividends_ex_date ON dividends(ex_date);

-- ============================================================================
-- 5. ECONOMIC INDICATORS TABLE - Macro economic data (BACEN, etc)
-- ============================================================================
CREATE TABLE IF NOT EXISTS economic_indicators (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  indicator TEXT NOT NULL,           -- 'SELIC', 'IPCA', 'CDI', 'DOLAR', etc
  date DATE NOT NULL,
  value REAL NOT NULL,
  
  UNIQUE(indicator, date)
);

CREATE INDEX IF NOT EXISTS idx_economic_indicator ON economic_indicators(indicator);
CREATE INDEX IF NOT EXISTS idx_economic_date ON economic_indicators(date);

-- ============================================================================
-- 6. API SYNC LOG TABLE - Track API synchronization
-- ============================================================================
CREATE TABLE IF NOT EXISTS api_sync_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  sync_type TEXT NOT NULL,           -- 'prices', 'fundamentals', 'dividends', 'economic'
  api_source TEXT NOT NULL,          -- 'brapi', 'alphavantage', 'bacen', 'manual'
  assets_updated INTEGER DEFAULT 0,
  status TEXT NOT NULL,              -- 'success', 'error', 'partial'
  error_message TEXT,
  started_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  completed_at DATETIME
);

CREATE INDEX IF NOT EXISTS idx_sync_log_type ON api_sync_log(sync_type);
CREATE INDEX IF NOT EXISTS idx_sync_log_started ON api_sync_log(started_at);

-- ============================================================================
-- 7. TRANSACTIONS TABLE - User portfolio transactions
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  asset_code TEXT NOT NULL,
  type TEXT NOT NULL,                 -- 'buy', 'sell'
  quantity REAL NOT NULL,
  price REAL NOT NULL,
  total_value REAL NOT NULL,
  date DATE NOT NULL,
  notes TEXT,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  FOREIGN KEY (asset_code) REFERENCES assets(code) ON DELETE RESTRICT
);
CREATE INDEX IF NOT EXISTS idx_transactions_asset ON transactions(asset_code);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);

-- ============================================================================
-- 8. IMPORT LOG TABLE - Track CSV/Excel imports
-- ============================================================================
CREATE TABLE IF NOT EXISTS import_log (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  import_type TEXT NOT NULL,         -- 'assets', 'transactions', 'fundamentals', 'prices'
  file_name TEXT NOT NULL,
  rows_imported INTEGER DEFAULT 0,
  rows_failed INTEGER DEFAULT 0,
  status TEXT NOT NULL,              -- 'success', 'error', 'partial'
  error_details TEXT,
  imported_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- 8. CACHE METADATA TABLE - Track data freshness
-- ============================================================================
CREATE TABLE IF NOT EXISTS cache_metadata (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  cache_key TEXT UNIQUE NOT NULL,    -- e.g., 'fundamentals:PETR4', 'prices:AAPL:2026-01'
  last_updated DATETIME NOT NULL,
  expires_at DATETIME,
  data_source TEXT                   -- 'api', 'manual', 'import'
);

CREATE INDEX IF NOT EXISTS idx_cache_key ON cache_metadata(cache_key);
CREATE INDEX IF NOT EXISTS idx_cache_expires ON cache_metadata(expires_at);

-- ============================================================================
-- 9. USER ASSET NOTES TABLE - User ratings and notes per asset
-- ============================================================================
CREATE TABLE IF NOT EXISTS user_asset_notes (
  asset_code TEXT PRIMARY KEY,
  rating INTEGER,                     -- User rating 1-5 stars (Nota)
  notes TEXT,                         -- User notes/information (Informação)
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  
  FOREIGN KEY (asset_code) REFERENCES assets(code) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_user_notes_rating ON user_asset_notes(rating);

-- ============================================================================
-- 10. USERS TABLE - System users, roles and subscription plans
-- ============================================================================
CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  email TEXT UNIQUE NOT NULL,
  password TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL DEFAULT 'user',           -- 'admin', 'collaborator', 'user'
  status TEXT NOT NULL DEFAULT 'active',       -- 'active', 'suspended', 'inactive'
  plan_period TEXT NOT NULL DEFAULT 'lifetime', -- '1_month', '3_months', '6_months', '1_year', 'lifetime'
  plan_expires_at DATETIME DEFAULT NULL,       -- Data limite da assinatura (NULL para vitalício)
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);
CREATE INDEX IF NOT EXISTS idx_users_status ON users(status);
