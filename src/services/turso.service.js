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
 * Sincronização executada no startup do servidor.
 * Realiza MERGE BIDIRECIONAL:
 *  - Usuários/transações que estão no Turso mas não no local → criados no local
 *  - Usuários/transações que estão no local mas não no Turso → empurrados para o Turso
 * Isso garante que novos cadastros que não chegaram ao Turso sejam recuperados
 * via seed na próxima inicialização, e que dados do Turso sejam restaurados localmente.
 */
export async function syncWithTursoOnStartup(localDb) {
  const client = getTursoClient();
  if (!client) {
    console.log('ℹ️ Turso Cloud não configurado. Rodando com banco local SQLite.');
    return;
  }

  try {
    console.log('☁️ Sincronizando com Turso Cloud (merge bidirecional)...');
    await ensureTursoSchema(client);

    // ────────────────────────────────────────
    // USUÁRIOS — Merge bidirecional
    // ────────────────────────────────────────
    const tursoUsersResult = await client.execute('SELECT * FROM users');
    const tursoUsers = tursoUsersResult.rows;
    const localUsers = localDb.prepare('SELECT * FROM users').all();

    const tursoUserIds = new Set(tursoUsers.map(u => Number(u.id)));
    const localUserIds = new Set(localUsers.map(u => Number(u.id)));

    // 1a. Usuários do Turso → restaurar/atualizar no local
    if (tursoUsers.length > 0) {
      console.log(`☁️ Restaurando ${tursoUsers.length} usuários do Turso para o banco local...`);
      const upsertLocal = localDb.prepare(`
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

      for (const row of tursoUsers) {
        try {
          upsertLocal.run({
            id: Number(row.id),
            email: String(row.email),
            password: String(row.password),
            name: String(row.name),
            role: String(row.role || 'user'),
            status: String(row.status || 'active'),
            created_at: String(row.created_at || new Date().toISOString()),
            updated_at: String(row.updated_at || new Date().toISOString())
          });
        } catch (uErr) {
          console.warn('⚠️ Erro ao restaurar usuário do Turso:', uErr.message);
        }
      }
    }

    // 1b. Usuários do local que NÃO estão no Turso → empurrar para o Turso
    const usersOnlyLocal = localUsers.filter(u => !tursoUserIds.has(Number(u.id)));
    if (usersOnlyLocal.length > 0) {
      console.log(`☁️ Enviando ${usersOnlyLocal.length} usuário(s) local(is) para o Turso...`);
      for (const u of usersOnlyLocal) {
        try {
          await client.execute({
            sql: `INSERT OR REPLACE INTO users (id, email, password, name, role, status, created_at, updated_at)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [u.id, u.email, u.password, u.name, u.role, u.status,
                   u.created_at || new Date().toISOString(), u.updated_at || new Date().toISOString()]
          });
          console.log(`   ✅ Usuário #${u.id} (${u.name}) enviado para o Turso.`);
        } catch (tErr) {
          console.warn(`   ⚠️ Falha ao enviar usuário #${u.id} para o Turso:`, tErr.message);
        }
      }
    }

    // ────────────────────────────────────────
    // TRANSAÇÕES — Merge bidirecional
    // ────────────────────────────────────────
    const tursoTxResult = await client.execute('SELECT * FROM transactions');
    const tursoTx = tursoTxResult.rows;
    const localTx = localDb.prepare('SELECT * FROM transactions').all();

    const tursoTxIds = new Set(tursoTx.map(t => Number(t.id)));

    // 2a. Transações do Turso → restaurar/atualizar no local
    if (tursoTx.length > 0) {
      console.log(`☁️ Restaurando ${tursoTx.length} transações do Turso para o banco local...`);
      const upsertLocalTx = localDb.prepare(`
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

      for (const row of tursoTx) {
        try {
          upsertLocalTx.run({
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
          console.warn('⚠️ Erro ao restaurar transação do Turso:', tErr.message);
        }
      }
    }

    // 2b. Transações do local que NÃO estão no Turso → empurrar para o Turso
    const txOnlyLocal = localTx.filter(t => !tursoTxIds.has(Number(t.id)));
    if (txOnlyLocal.length > 0) {
      console.log(`☁️ Enviando ${txOnlyLocal.length} transação(ões) local(is) para o Turso...`);
      for (const t of txOnlyLocal) {
        try {
          await client.execute({
            sql: `INSERT OR REPLACE INTO transactions (id, asset_code, type, quantity, price, total_value, date, notes, created_at, user_id)
                  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
            args: [t.id, t.asset_code, t.type, t.quantity, t.price, t.total_value,
                   t.date, t.notes || null, t.created_at || new Date().toISOString(), t.user_id || 1]
          });
        } catch (tErr) {
          console.warn(`   ⚠️ Falha ao enviar transação #${t.id} para o Turso:`, tErr.message);
        }
      }
    }

    const totalTursoUsers = tursoUsers.length + usersOnlyLocal.length;
    console.log(`✅ Sync concluído! Turso: ${tursoUsers.length} usuários | Local: ${localUsers.length} | Enviados ao Turso: ${usersOnlyLocal.length}`);
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
