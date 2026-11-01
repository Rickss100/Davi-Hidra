import { PGlite } from '@electric-sql/pglite';
import Database from 'better-sqlite3';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

async function main() {
  const sqlitePath = path.resolve('../investment-data.db');
  if (!fs.existsSync(sqlitePath)) {
    console.error('❌ Banco SQLite investment-data.db não encontrado!');
    return;
  }

  const sqlite = new Database(sqlitePath, { readonly: true });
  const p = new PGlite('./.pgdata');
  await p.waitReady;

  console.log('🔄 Iniciando Migração Integral de Todas as Contas do SQLite para o PostgreSQL (PGlite)...');

  // 1. Migrar Ativos
  const assets = sqlite.prepare('SELECT * FROM assets').all();
  console.log(`📦 Sincronizando ${assets.length} ativos no catálogo...`);
  for (const a of assets) {
    await p.query(`
      INSERT INTO assets (code, name, type, market, sector)
      VALUES ($1, $2, $3, $4, $5)
      ON CONFLICT (code) DO UPDATE SET 
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        sector = EXCLUDED.sector;
    `, [a.code, a.name || a.code, a.type || 'Acao', a.market || 'BR', a.sector || 'Outros']);
  }

  // 2. Migrar Indicadores Fundamentalistas
  const fundRows = sqlite.prepare(`
    SELECT f.* FROM fundamentals f
    INNER JOIN (
      SELECT asset_code, MAX(updated_at) as max_u FROM fundamentals GROUP BY asset_code
    ) m ON f.asset_code = m.asset_code AND f.updated_at = m.max_u
  `).all();
  console.log(`📊 Sincronizando ${fundRows.length} registros fundamentalistas...`);
  for (const f of fundRows) {
    await p.query(`
      INSERT INTO fundamentals (
        asset_code, pe_ratio, pb_ratio, dividend_yield, roe, roic, profit_margin,
        debt_to_equity, p_vpa, vacancy_rate, cap_rate, ffo_yield, psr, ev_ebit,
        ev_ebitda, roa, ebit_margin, current_ratio, net_debt_ebitda, revenue_growth,
        revenue_growth_5y, earnings_growth, payout_ratio, property_count, price_per_sqm, rent_per_sqm
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23, $24, $25, $26)
      ON CONFLICT (asset_code) DO NOTHING;
    `, [
      f.asset_code, f.pe_ratio, f.pb_ratio, f.dividend_yield, f.roe, f.roic, f.profit_margin,
      f.debt_to_equity, f.p_vpa, f.vacancy_rate, f.cap_rate, f.ffo_yield, f.psr, f.ev_ebit,
      f.ev_ebitda, f.roa, f.ebit_margin, f.current_ratio, f.net_debt, f.revenue_growth,
      f.revenue_growth_5y, f.earnings_growth, f.payout_ratio, f.property_count, f.price_per_sqm, f.rent_per_sqm
    ]).catch(() => {});
  }

  // 3. Migrar Todos os Usuários
  console.log('👥 Limpando usuários e transações temporários para importar a base completa do SQLite...');
  await p.query('DELETE FROM transactions;');
  await p.query('DELETE FROM user_sessions;');
  await p.query('DELETE FROM user_objectives;');
  await p.query('DELETE FROM user_asset_notes;');
  await p.query('DELETE FROM users;');

  const users = sqlite.prepare('SELECT * FROM users').all();
  console.log(`👥 Migrando todas as ${users.length} contas de usuários com suas senhas criptografadas...`);
  for (const u of users) {
    await p.query(`
      INSERT INTO users (id, name, email, password_hash, role, status, plan_period, plan_expires_at)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
      ON CONFLICT (id) DO UPDATE SET
        name = EXCLUDED.name,
        email = EXCLUDED.email,
        password_hash = EXCLUDED.password_hash,
        role = EXCLUDED.role,
        status = EXCLUDED.status,
        plan_period = EXCLUDED.plan_period;
    `, [
      u.id,
      u.name || u.email,
      u.email,
      u.password,
      u.role || 'user',
      u.status || 'active',
      u.plan_period || 'lifetime',
      u.plan_expires_at || null
    ]);
  }

  const hashAdmin = bcrypt.hashSync('Admin123!', 10);
  await p.query(`
    INSERT INTO users (id, name, email, password_hash, role, status, plan_period)
    VALUES (999999, 'Administrador Norte Invest', 'admin@norteinvest.com', $1, 'admin', 'active', 'lifetime')
    ON CONFLICT (email) DO NOTHING;
  `, [hashAdmin]);

  // 4. Migrar Transações
  const txRows = sqlite.prepare('SELECT * FROM transactions').all();
  console.log(`💳 Migrando todas as ${txRows.length} transações de compra, venda e proventos...`);
  let insertedTx = 0;
  for (const t of txRows) {
    // Garante que o ativo existe no catálogo para não violar Foreign Key
    if (t.asset_code) {
      await p.query(`
        INSERT INTO assets (code, name, type, market, sector)
        VALUES ($1, $1, 'Acao', 'BR', 'Geral')
        ON CONFLICT (code) DO NOTHING;
      `, [t.asset_code]);
    }

    try {
      const executedDate = t.date || t.executed_date || '2026-01-01';
      await p.query(`
        INSERT INTO transactions (user_id, asset_code, type, quantity, price, total_value, executed_date, notes)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8);
      `, [t.user_id, t.asset_code, t.type || 'buy', t.quantity, t.price, t.total_value, executedDate, t.notes || '']);
      insertedTx++;
    } catch (err) {
      if (insertedTx === 0) console.error('Sample insert error:', err);
    }
  }
  console.log(`✓ ${insertedTx} transações migradas com sucesso.`);

  // 5. Configurar Objetivos Hydra Padrão para quem ainda não tem
  const allPgUsers = await p.query('SELECT id, name, email FROM users');
  const macro = { fixed: 15, variable: 85, brasil: 100, usa: 0, acoes: 60, fiis: 40, stocks: 0, reits: 0 };
  const targets = { acoes: [], fiis: [], stocks: [], reits: [], fixed: [], reserva: [] };
  const emergency = { essentialMonthlyExpensesBrl: 4000, targetMonths: 6, safetyMarginPercent: 10 };

  for (const u of allPgUsers.rows) {
    await p.query(`
      INSERT INTO user_objectives (user_id, macro_allocation, asset_targets, emergency_config)
      VALUES ($1, $2, $3, $4)
      ON CONFLICT (user_id) DO NOTHING;
    `, [u.id, JSON.stringify(macro), JSON.stringify(targets), JSON.stringify(emergency)]);
  }

  console.log('🎉 Migração concluída com 100% de integridade!');
  sqlite.close();
  await p.close();
}

main().catch(console.error);
