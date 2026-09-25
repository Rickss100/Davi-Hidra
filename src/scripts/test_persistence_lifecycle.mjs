/**
 * Teste Automatizado de Integridade de Ciclo de Vida:
 * 1. Cria conta de teste A e conta de teste B via API de Produção
 * 2. Cria transação para conta A
 * 3. Apaga conta B
 * 4. Valida se conta A e transação existem no Turso e se conta B foi excluída do Turso
 * 5. Simula o reinício do servidor (disco efêmero zerado + restore do seed + sync do Turso)
 * 6. Verifica a integridade final: conta A e transação persistem, conta B NÃO ressuscita!
 */

import Database from 'better-sqlite3';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@libsql/client';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const TURSO_URL = 'libsql://davi-hidra-rickss100.aws-us-east-1.turso.io';
const TURSO_TOKEN = 'eyJhbGciOiJFZERTQSIsInR5cCI6IkpXVCJ9.eyJhIjoicnciLCJpYXQiOjE3OTAyMDU5MzYsImlkIjoiMDFhMGQwOTQtYjkwMS03MmNjLTg5NjEtMGY2OGM3MjM4NWUyIiwia2lkIjoiQTR2aEEtV2dqd1F1SGdOMzIxX0JDdUJfWU4yQ0xSTUtPYVhkYmtWSmNmOCIsInJpZCI6ImY5Y2I4NzZhLTNkY2EtNDMwMi1iNWRlLTNiMTYyZWM2Njk5NSJ9.GEnC6ElUr_asQ2C7I-Q3Hop4FLTpJcoGW9wQ6xhwPGjXcUByEaPcwKFO07EhxRcuGeaIE1qrU8K4fKXU6jKwCg';

const BASE_URL = 'https://davi-hidra.onrender.com';

const turso = createClient({
  url: TURSO_URL,
  authToken: TURSO_TOKEN
});

async function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function run() {
  console.log('🚀 INICIANDO TESTE DE INTEGRIDADE E PERSISTÊNCIA COMPLETA');
  console.log('========================================================\n');

  const rand = Math.floor(Math.random() * 90000) + 10000;
  const userA_email = `investidor_a_${rand}@davihidra.com`;
  const userB_email = `investidor_b_${rand}@davihidra.com`;

  // ----------------------------------------------------
  // PASSO 1: Criar Usuário A e Usuário B via API do Render
  // ----------------------------------------------------
  console.log(`1️⃣ [Criação] Criando Usuário A (${userA_email}) via API Render...`);
  const resA = await fetch(`${BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Investidor A ${rand}`,
      email: userA_email,
      password: 'senhaA123'
    })
  });
  const dataA = await resA.json();
  if (resA.status !== 201) throw new Error(`Falha ao criar Usuário A: ${JSON.stringify(dataA)}`);
  const userA = dataA.user;
  console.log(`   ✅ Usuário A criado com sucesso: ID #${userA.id}`);

  console.log(`1️⃣ [Criação] Criando Usuário B (${userB_email}) via API Render...`);
  const resB = await fetch(`${BASE_URL}/api/users/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      name: `Investidor B ${rand}`,
      email: userB_email,
      password: 'senhaB123'
    })
  });
  const dataB = await resB.json();
  if (resB.status !== 201) throw new Error(`Falha ao criar Usuário B: ${JSON.stringify(dataB)}`);
  const userB = dataB.user;
  console.log(`   ✅ Usuário B criado com sucesso: ID #${userB.id}`);

  // ----------------------------------------------------
  // PASSO 2: Criar Transação para o Usuário A
  // ----------------------------------------------------
  console.log(`\n2️⃣ [Transação] Criando aporte de 10 PETR4 para Usuário A (ID #${userA.id})...`);
  const resTx = await fetch(`${BASE_URL}/api/transactions`, {
    method: 'POST',
    headers: { 
      'Content-Type': 'application/json',
      'x-user-id': String(userA.id)
    },
    body: JSON.stringify({
      asset_code: 'PETR4',
      type: 'buy',
      quantity: 10,
      price: 38.50,
      date: new Date().toISOString().split('T')[0],
      notes: 'Aporte de teste integridade',
      user_id: userA.id
    })
  });
  const dataTx = await resTx.json();
  if (resTx.status !== 201) throw new Error(`Falha ao criar transação: ${JSON.stringify(dataTx)}`);
  console.log(`   ✅ Transação criada com ID #${dataTx.id}, total R$ ${dataTx.total_value}`);

  // ----------------------------------------------------
  // PASSO 3: Excluir Usuário B via API do Render
  // ----------------------------------------------------
  console.log(`\n3️⃣ [Exclusão] Excluindo Usuário B (ID #${userB.id}) via API Render...`);
  const resDel = await fetch(`${BASE_URL}/api/users/${userB.id}`, {
    method: 'DELETE'
  });
  const dataDel = await resDel.json();
  console.log(`   ✅ Resposta da exclusão:`, dataDel.message);

  // ----------------------------------------------------
  // PASSO 4: Conferir integridade direta no Turso Cloud
  // ----------------------------------------------------
  console.log('\n4️⃣ [Auditoria Turso Cloud] Verificando banco Turso diretamente...');
  const tursoA = await turso.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [userA.id] });
  const tursoB = await turso.execute({ sql: 'SELECT * FROM users WHERE id = ?', args: [userB.id] });
  const tursoTx = await turso.execute({ sql: 'SELECT * FROM transactions WHERE id = ?', args: [dataTx.id] });

  console.log(`   - Usuário A existe no Turso? ${tursoA.rows.length === 1 ? '✅ SIM' : '❌ NÃO'}`);
  console.log(`   - Usuário B foi removido do Turso? ${tursoB.rows.length === 0 ? '✅ SIM (removido)' : '❌ NÃO (ainda existe!)'}`);
  console.log(`   - Transação de Usuário A existe no Turso? ${tursoTx.rows.length === 1 ? '✅ SIM' : '❌ NÃO'}`);

  if (tursoA.rows.length !== 1 || tursoB.rows.length !== 0 || tursoTx.rows.length !== 1) {
    throw new Error('❌ Falha na auditoria direta do Turso antes do reinício!');
  }

  // ----------------------------------------------------
  // PASSO 5: Simulação do Reinício do Render (Clean boot a partir do seed)
  // ----------------------------------------------------
  console.log('\n5️⃣ [Simulação de Restart do Render] Criando ambiente limpo a partir do seed...');
  const testDbPath = path.join(__dirname, 'test-reboot.db');
  const seedPath = path.join(__dirname, '../db/seed-investment-data.db');

  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);
  fs.copyFileSync(seedPath, testDbPath);
  console.log('   - Seed copiado para test-reboot.db (simulando disco efêmero recriado)');

  const localDb = new Database(testDbPath);
  localDb.pragma('foreign_keys = ON');

  // Importar syncWithTursoOnStartup
  const { syncWithTursoOnStartup } = await import('../services/turso.service.js');
  
  // Garantir que as variáveis de ambiente apontem para o Turso
  process.env.TURSO_DATABASE_URL = TURSO_URL;
  process.env.TURSO_AUTH_TOKEN = TURSO_TOKEN;

  console.log('   - Executando syncWithTursoOnStartup() no servidor recém-reiniciado...');
  await syncWithTursoOnStartup(localDb);

  // ----------------------------------------------------
  // PASSO 6: Verificação Pós-Reinício
  // ----------------------------------------------------
  console.log('\n6️⃣ [Auditoria Pós-Reinício] Validando banco local restaurado...');
  const restoredA = localDb.prepare('SELECT * FROM users WHERE id = ?').get(userA.id);
  const restoredB = localDb.prepare('SELECT * FROM users WHERE id = ?').get(userB.id);
  const restoredTx = localDb.prepare('SELECT * FROM transactions WHERE id = ?').get(dataTx.id);

  console.log(`   - Usuário A persistiu após reinício? ${restoredA ? '✅ SIM (' + restoredA.name + ')' : '❌ NÃO'}`);
  console.log(`   - Usuário B ressuscitou do seed? ${restoredB ? '❌ SIM (BUG: ressuscitou!)' : '✅ NÃO (permanece excluído!)'}`);
  console.log(`   - Transação de Usuário A persistiu? ${restoredTx ? '✅ SIM (R$ ' + restoredTx.total_value + ')' : '❌ NÃO'}`);

  localDb.close();
  if (fs.existsSync(testDbPath)) fs.unlinkSync(testDbPath);

  // Limpeza do teste no Turso
  console.log('\n🧹 [Limpeza] Removendo dados do teste no Turso...');
  await turso.execute({ sql: 'DELETE FROM transactions WHERE id = ?', args: [dataTx.id] });
  await turso.execute({ sql: 'DELETE FROM users WHERE id = ?', args: [userA.id] });
  console.log('   ✅ Limpeza concluída.');

  if (restoredA && !restoredB && restoredTx) {
    console.log('\n========================================================');
    console.log('🎉 TESTE CONCLUÍDO COM 100% DE SUCESSO E INTEGRIDADE!');
    console.log('O ciclo de criação, exclusão, persistência e reinício');
    console.log('está completamente verificado e validado.');
    console.log('========================================================\n');
  } else {
    throw new Error('❌ Falha na validação pós-reinício!');
  }

  process.exit(0);
}

run().catch(err => {
  console.error('\n❌ ERRO NO TESTE:', err);
  process.exit(1);
});
