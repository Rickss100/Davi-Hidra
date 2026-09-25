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

function cleanEnv(val) {
  if (!val) return null;
  let clean = String(val).trim();
  if ((clean.startsWith('"') && clean.endsWith('"')) || (clean.startsWith("'") && clean.endsWith("'"))) {
    clean = clean.slice(1, -1).trim();
  }
  return clean;
}

let tursoClient = null;
let isConfigured = false;

/**
 * Inicializa e obtém o cliente Turso se as variáveis de ambiente existirem
 */
export function getTursoClient() {
  const url = cleanEnv(process.env.TURSO_DATABASE_URL);
  const authToken = cleanEnv(process.env.TURSO_AUTH_TOKEN);

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
 * Retorna o status de conexão com o Turso, incluindo contagem real de usuários na nuvem
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
    const usersCount = await client.execute('SELECT COUNT(*) as total FROM users');
    const txCount = await client.execute('SELECT COUNT(*) as total FROM transactions');
    return {
      configured: true,
      connected: res.rows.length > 0,
      url: process.env.TURSO_DATABASE_URL ? process.env.TURSO_DATABASE_URL.split('@').pop() : '',
      tursoUsersCount: Number(usersCount.rows[0]?.total || 0),
      tursoTxCount: Number(txCount.rows[0]?.total || 0),
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
 * 
 * Regra de Ouro (Single Source of Truth):
 * - Se o Turso já possuir usuários: o Turso é a autoridade central!
 *   1. Todos os usuários/transações do Turso são restaurados/atualizados no banco local.
 *   2. Usuários/transações do banco local que NÃO existem no Turso são removidos do local
 *      (evita que usuários excluídos pelo admin ressurjam a partir do seed-investment-data.db).
 * - Se o Turso estiver completamente vazio:
 *   1. Migra os dados iniciais do banco local para o Turso (apenas primeira inicialização).
 */
export async function syncWithTursoOnStartup(localDb) {
  const client = getTursoClient();
  if (!client) {
    console.log('ℹ️ Turso Cloud não configurado. Rodando com banco local SQLite.');
    return;
  }

  try {
    console.log('☁️ Sincronizando com Turso Cloud (Autoridade Central)...');
    await ensureTursoSchema(client);

    // ────────────────────────────────────────
    // USUÁRIOS
    // ────────────────────────────────────────
    const tursoUsersResult = await client.execute('SELECT * FROM users ORDER BY id');
    const tursoUsers = tursoUsersResult.rows;
    const localUsers = localDb.prepare('SELECT * FROM users').all();

    if (tursoUsers.length === 0 && localUsers.length > 0) {
      // Primeira inicialização: Nuvem vazia → Migra local para Turso
      console.log(`☁️ Nuvem vazia. Migrando ${localUsers.length} usuários locais para o Turso...`);
      for (const u of localUsers) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO users (id, email, password, name, role, status, created_at, updated_at)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [u.id, u.email, u.password, u.name, u.role, u.status,
                 u.created_at || new Date().toISOString(), u.updated_at || new Date().toISOString()]
        });
      }
    } else if (tursoUsers.length > 0) {
      // Nuvem tem dados: Turso manda!
      console.log(`☁️ Restaurando ${tursoUsers.length} usuários do Turso para o banco local...`);
      const tursoUserIds = new Set(tursoUsers.map(u => Number(u.id)));

      // 1. Remover do banco local os usuários excluídos (fantasmas do seed)
      for (const lu of localUsers) {
        if (!tursoUserIds.has(Number(lu.id))) {
          console.log(`   🗑️ Removendo usuário residual #${lu.id} (${lu.name}) do banco local...`);
          localDb.prepare('DELETE FROM users WHERE id = ?').run(lu.id);
        }
      }

      // 2. Inserir/Atualizar no banco local todos os usuários da nuvem
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

    // ────────────────────────────────────────
    // TRANSAÇÕES
    // ────────────────────────────────────────
    const tursoTxResult = await client.execute('SELECT * FROM transactions ORDER BY id');
    const tursoTx = tursoTxResult.rows;
    const localTx = localDb.prepare('SELECT * FROM transactions').all();

    if (tursoTx.length === 0 && localTx.length > 0) {
      // Primeira inicialização: Nuvem vazia → Migra local para Turso
      console.log(`☁️ Nuvem vazia. Migrando ${localTx.length} transações locais para o Turso...`);
      for (const t of localTx) {
        await client.execute({
          sql: `INSERT OR REPLACE INTO transactions (id, asset_code, type, quantity, price, total_value, date, notes, created_at, user_id)
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          args: [t.id, t.asset_code, t.type, t.quantity, t.price, t.total_value,
                 t.date, t.notes || null, t.created_at || new Date().toISOString(), t.user_id || 1]
        });
      }
    } else if (tursoTx.length > 0) {
      console.log(`☁️ Restaurando ${tursoTx.length} transações do Turso para o banco local...`);
      const tursoTxIds = new Set(tursoTx.map(t => Number(t.id)));

      // 1. Remover do banco local transações que não existem na nuvem
      for (const lt of localTx) {
        if (!tursoTxIds.has(Number(lt.id))) {
          localDb.prepare('DELETE FROM transactions WHERE id = ?').run(lt.id);
        }
      }

      // 2. Inserir/Atualizar do Turso para o local
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

    console.log(`✅ Sincronização com Turso concluída com sucesso! (Nuvem: ${tursoUsers.length} usuários, ${tursoTx.length} transações)`);
  } catch (error) {
    console.error('⚠️ Falha ao sincronizar com Turso Cloud no startup:', error.message);
  }
}


/**
 * Grava ou atualiza um usuário no Turso em tempo de execução
 */
export async function syncUserToTurso(user) {
  const client = getTursoClient();
  if (!client || !user) {
    console.warn('⚠️ syncUserToTurso ignorado: cliente Turso ou usuário ausente.');
    return;
  }

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
    console.log(`☁️ Usuário #${user.id} (${user.name}) sincronizado com sucesso no Turso.`);
  } catch (err) {
    console.error(`❌ Erro ao sincronizar usuário #${user?.id} no Turso:`, err.message);
    throw err;
  }
}

/**
 * Remove um usuário no Turso
 */
export async function syncUserDeleteToTurso(userId) {
  const client = getTursoClient();
  if (!client) return;

  try {
    // Remove as transações do usuário primeiro
    await client.execute({
      sql: 'DELETE FROM transactions WHERE user_id = ?',
      args: [userId]
    });
    // Remove o usuário
    await client.execute({
      sql: 'DELETE FROM users WHERE id = ?',
      args: [userId]
    });
    console.log(`☁️ Usuário #${userId} removido com sucesso do Turso.`);
  } catch (err) {
    console.error(`❌ Erro ao remover usuário #${userId} no Turso:`, err.message);
    throw err;
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
    console.log(`☁️ Transação #${tx.id} sincronizada com sucesso no Turso.`);
  } catch (err) {
    console.error(`❌ Erro ao sincronizar transação #${tx?.id} no Turso:`, err.message);
    throw err;
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
    console.log(`☁️ Transação #${txId} removida com sucesso do Turso.`);
  } catch (err) {
    console.error(`❌ Erro ao remover transação #${txId} no Turso:`, err.message);
    throw err;
  }
}

/**
 * Diagnóstico completo para conferência administrativa
 */
export async function getTursoDiagnostics(localDb) {
  const client = getTursoClient();
  if (!client) {
    return {
      configured: false,
      message: 'Turso não configurado'
    };
  }

  try {
    const tursoUsers = await client.execute('SELECT id, email, name, role, status FROM users ORDER BY id');
    const localUsers = localDb.prepare('SELECT id, email, name, role, status FROM users ORDER BY id').all();

    // Teste de escrita temporária para certificar permissão total
    let writeOk = false;
    let writeError = null;
    const testId = 999999;
    try {
      await client.execute({
        sql: 'INSERT OR REPLACE INTO users (id, email, password, name, role, status) VALUES (?, ?, ?, ?, ?, ?)',
        args: [testId, '__diag_test@davi.local', '123', 'Diag Test', 'user', 'active']
      });
      await client.execute({
        sql: 'DELETE FROM users WHERE id = ?',
        args: [testId]
      });
      writeOk = true;
    } catch (wErr) {
      writeError = wErr.message;
    }

    return {
      configured: true,
      writePermission: writeOk,
      writeError,
      tursoUsersCount: tursoUsers.rows.length,
      localUsersCount: localUsers.length,
      tursoUsers: tursoUsers.rows,
      localUsers: localUsers
    };
  } catch (err) {
    return {
      configured: true,
      error: err.message
    };
  }
}
