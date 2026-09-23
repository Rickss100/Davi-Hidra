/**
 * Turso Database Cloud Sync Service
 * Permite persistência definitiva de usuários e transações na nuvem (Turso / LibSQL).
 * Resolve o problema de perda de dados após novos deploys no Render (disco efêmero).
 */

import { createClient } from '@libsql/client';
import fs from 'fs';

// Carregar variáveis de ambiente do .env se existir (Node 20+)
if (fs.existsSync('.env') && typeof process.loadEnvFile === 'function') {
  try {
    process.loadEnvFile();
  } catch (e) {
    // Silently continue
  }
}

let tursoClient = null;
let isConfigured = false;

/**
 * Inicializa e obtém o cliente Turso se as variáveis de ambiente existirem
 */
export function getTursoClient() {
  const url = process.env.TURSO_DATABASE_URL;
  const authToken = process.env.TURSO_AUTH_TOKEN;

  if (!url || !authToken) {
    return null;
  }

  if (!tursoClient) {
    try {
      tursoClient = createClient({
        url,
        authToken
      });
      isConfigured = true;
    } catch (err) {
      console.error('❌ Erro ao instanciar cliente Turso:', err.message);
      return null;
    }
  }

  return tursoClient;
}

/**
 * Retorna o status de conexão com o Turso
 */
export async function getTursoStatus() {
  const client = getTursoClient();
  if (!client) {
    return {
      configured: false,
      connected: false,
      message: 'Variáveis TURSO_DATABASE_URL e TURSO_AUTH_TOKEN não configuradas.'
    };
  }

  try {
    const res = await client.execute('SELECT 1 as connected');
    return {
      configured: true,
      connected: res.rows.length > 0,
      url: process.env.TURSO_DATABASE_URL,
      message: 'Conectado ao Turso Cloud com sucesso.'
    };
  } catch (err) {
    return {
      configured: true,
      connected: false,
      error: err.message,
      message: 'Falha ao conectar ao Turso Cloud.'
    };
  }
}

/**
 * Cria as tabelas essenciais no Turso caso não existam
 */
async function ensureTursoSchema(client) {
  await client.execute(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT DEFAULT 'user',
      status TEXT DEFAULT 'active',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await client.execute(`
    CREATE TABLE IF NOT EXISTS transactions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      asset_code TEXT NOT NULL,
      type TEXT NOT NULL,
      quantity REAL NOT NULL,
      price REAL NOT NULL,
      total_value REAL NOT NULL,
      date DATE NOT NULL,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      user_id INTEGER DEFAULT 1
    );
  `);
}

/**
 * Sincronização executada no startup do servidor:
 * - Se o Turso estiver vazio: migra os dados do SQLite local para o Turso.
 * - Se o Turso já possuir dados: atualiza o banco local com os dados do Turso.
 */
export async function syncWithTursoOnStartup(localDb) {
  const client = getTursoClient();
  if (!client) {
    console.log('ℹ️ Turso Cloud não configurado. Rodando com banco local SQLite.');
    return;
  }

  try {
    console.log('☁️ Sincronizando com Turso Cloud...');
    await ensureTursoSchema(client);

    // 1. Verificar usuários no Turso
    const tursoUsers = await client.execute('SELECT * FROM users');
    const localUsers = localDb.prepare('SELECT * FROM users').all();

    if (tursoUsers.rows.length === 0 && localUsers.length > 0) {
      console.log(`☁️ Turso está vazio. Migrando ${localUsers.length} usuários locais para o Turso...`);
      for (const u of localUsers) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO users (id, email, password, name, role, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [u.id, u.email, u.password, u.name, u.role, u.status, u.created_at || new Date().toISOString(), u.updated_at || new Date().toISOString()]
        });
      }
    } else if (tursoUsers.rows.length > 0) {
      console.log(`☁️ Restaurando/Sincronizando ${tursoUsers.rows.length} usuários do Turso para a base local...`);
      const insertOrUpdate = localDb.prepare(`
        INSERT INTO users (id, email, password, name, role, status, created_at, updated_at)
        VALUES (@id, @email, @password, @name, @role, @status, @created_at, @updated_at)
        ON CONFLICT(id) DO UPDATE SET
          email = excluded.email,
          password = excluded.password,
          name = excluded.name,
          role = excluded.role,
          status = excluded.status,
          updated_at = excluded.updated_at
      `);

      for (const row of tursoUsers.rows) {
        try {
          insertOrUpdate.run({
            id: Number(row.id),
            email: String(row.email),
            password: String(row.password),
            name: String(row.name),
            role: String(row.role),
            status: String(row.status),
            created_at: String(row.created_at || new Date().toISOString()),
            updated_at: String(row.updated_at || new Date().toISOString())
          });
        } catch (uErr) {
          console.warn('⚠️ Erro ao sincronizar usuário do Turso:', uErr.message);
        }
      }
    }

    // 2. Verificar transações no Turso
    const tursoTx = await client.execute('SELECT * FROM transactions');
    const localTx = localDb.prepare('SELECT * FROM transactions').all();

    if (tursoTx.rows.length === 0 && localTx.length > 0) {
      console.log(`☁️ Migrando ${localTx.length} transações locais para o Turso...`);
      for (const t of localTx) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO transactions (id, asset_code, type, quantity, price, total_value, date, notes, created_at, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [t.id, t.asset_code, t.type, t.quantity, t.price, t.total_value, t.date, t.notes, t.created_at || new Date().toISOString(), t.user_id || 1]
        });
      }
    } else if (tursoTx.rows.length > 0) {
      console.log(`☁️ Restaurando/Sincronizando ${tursoTx.rows.length} transações do Turso para a base local...`);
      const insertOrUpdateTx = localDb.prepare(`
        INSERT INTO transactions (id, asset_code, type, quantity, price, total_value, date, notes, created_at, user_id)
        VALUES (@id, @asset_code, @type, @quantity, @price, @total_value, @date, @notes, @created_at, @user_id)
        ON CONFLICT(id) DO UPDATE SET
          asset_code = excluded.asset_code,
          type = excluded.type,
          quantity = excluded.quantity,
          price = excluded.price,
          total_value = excluded.total_value,
          date = excluded.date,
          notes = excluded.notes,
          user_id = excluded.user_id
      `);

      for (const row of tursoTx.rows) {
        try {
          insertOrUpdateTx.run({
            id: Number(row.id),
            asset_code: String(row.asset_code),
            type: String(row.type),
            quantity: Number(row.quantity),
            price: Number(row.price),
            total_value: Number(row.total_value),
            date: String(row.date),
            notes: row.notes ? String(row.notes) : null,
            created_at: String(row.created_at || new Date().toISOString()),
            user_id: Number(row.user_id || 1)
          });
        } catch (tErr) {
          console.warn('⚠️ Erro ao sincronizar transação do Turso:', tErr.message);
        }
      }
    }

    console.log('✅ Sincronização inicial com Turso Cloud concluída com sucesso!');
  } catch (error) {
    console.error('⚠️ Falha ao sincronizar com Turso Cloud no startup:', error.message);
  }
}

/**
 * Grava ou atualiza um usuário no Turso em tempo de execução
 */
export async function syncUserToTurso(user) {
  const client = getTursoClient();
  if (!client || !user) return;

  try {
    await client.execute({
      sql: `INSERT OR REPLACE INTO users (id, email, password, name, role, status, created_at, updated_at)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        user.id,
        user.email,
        user.password,
        user.name,
        user.role || 'user',
        user.status || 'active',
        user.created_at || new Date().toISOString(),
        new Date().toISOString()
      ]
    });
    console.log(`☁️ Usuário #${user.id} (${user.name}) sincronizado no Turso.`);
  } catch (err) {
    console.error(`⚠️ Erro ao sincronizar usuário no Turso:`, err.message);
  }
}

/**
 * Remove um usuário no Turso
 */
export async function syncUserDeleteToTurso(userId) {
  const client = getTursoClient();
  if (!client) return;

  try {
    await client.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [userId]
    });
    // Remove também as transações associadas
    await client.execute({
      sql: 'DELETE FROM transactions WHERE user_id = ?',
      args: [userId]
    });
    console.log(`☁️ Usuário #${userId} removido do Turso.`);
  } catch (err) {
    console.error(`⚠️ Erro ao remover usuário no Turso:`, err.message);
  }
}

/**
 * Grava uma transação no Turso em tempo de execução
 */
export async function syncTransactionToTurso(tx) {
  const client = getTursoClient();
  if (!client || !tx) return;

  try {
    await client.execute({
      sql: `INSERT OR REPLACE INTO transactions (id, asset_code, type, quantity, price, total_value, date, notes, created_at, user_id)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      args: [
        tx.id,
        tx.asset_code,
        tx.type,
        tx.quantity,
        tx.price,
        tx.total_value,
        tx.date,
        tx.notes || null,
        tx.created_at || new Date().toISOString(),
        tx.user_id || 1
      ]
    });
    console.log(`☁️ Transação #${tx.id} sincronizada no Turso.`);
  } catch (err) {
    console.error(`⚠️ Erro ao sincronizar transação no Turso:`, err.message);
  }
}

/**
 * Remove uma transação no Turso
 */
export async function syncTransactionDeleteToTurso(txId) {
  const client = getTursoClient();
  if (!client) return;

  try {
    await client.execute({
      sql: 'DELETE FROM transactions WHERE id = ?',
      args: [txId]
    });
    console.log(`☁️ Transação #${txId} removida do Turso.`);
  } catch (err) {
    console.error(`⚠️ Erro ao remover transação no Turso:`, err.message);
  }
}
