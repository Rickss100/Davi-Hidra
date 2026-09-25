import http from 'http';
import { 
  initDatabase, 
  createUser, 
  deleteUser, 
  getUserById 
} from './src/services/database.service.js';

function request(options, data) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        try {
          const parsed = JSON.parse(body);
          resolve({ status: res.statusCode, data: parsed });
        } catch {
          resolve({ status: res.statusCode, data: body });
        }
      });
    });
    req.on('error', reject);
    if (data) {
      req.write(JSON.stringify(data));
    }
    req.end();
  });
}

async function testApi() {
  console.log('🚀 Iniciando Testes de Permissões HTTP & Regras de Negócio...');
  initDatabase();

  const timestamp = Date.now();
  const testCollab = createUser({
    email: `collab_http_${timestamp}@davi.com`,
    password: '123',
    name: 'Colaborador HTTP',
    role: 'collaborator',
    status: 'active'
  });

  const testInactive = createUser({
    email: `inactive_http_${timestamp}@davi.com`,
    password: '123',
    name: 'Inativo HTTP',
    role: 'user',
    status: 'inactive'
  });

  const testSuspended = createUser({
    email: `suspended_http_${timestamp}@davi.com`,
    password: '123',
    name: 'Suspenso HTTP',
    role: 'user',
    status: 'suspended'
  });

  const testActive = createUser({
    email: `active_http_${timestamp}@davi.com`,
    password: '123',
    name: 'Ativo HTTP',
    role: 'user',
    status: 'active'
  });

  const port = 3002;

  try {
    // 1. Login com Conta Inativa
    console.log('\n--- 1. Login com Conta Inativa ---');
    const loginInactiveRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/users/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: testInactive.email, password: '123' });

    console.log('Status Login Inativo:', loginInactiveRes.status);
    console.log('Resposta:', loginInactiveRes.data);
    if (loginInactiveRes.status !== 403 || loginInactiveRes.data.error !== 'ACCOUNT_INACTIVE') {
      throw new Error('Falha: login de conta inativa não retornou 403 ACCOUNT_INACTIVE!');
    }
    console.log('✅ Bloqueio de login para conta inativa validado com sucesso.');

    // 2. Login com Conta Suspensa
    console.log('\n--- 2. Login com Conta Suspensa ---');
    const loginSuspendedRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/users/login',
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    }, { email: testSuspended.email, password: '123' });

    console.log('Status Login Suspenso:', loginSuspendedRes.status);
    console.log('User status:', loginSuspendedRes.data.user?.status, 'isSuspended:', loginSuspendedRes.data.user?.isSuspended);
    if (loginSuspendedRes.status !== 200 || !loginSuspendedRes.data.user?.isSuspended) {
      throw new Error('Falha: usuário suspenso deveria logar com isSuspended: true!');
    }
    console.log('✅ Login de conta suspensa validado com sucesso.');

    // 3. Colaborador tentando criar Administrador
    console.log('\n--- 3. Restrição de Colaborador Criar Admin ---');
    const collabCreateAdminRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/users',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': String(testCollab.id)
      }
    }, {
      name: 'Tentativa Admin',
      email: `fake_admin_${timestamp}@davi.com`,
      password: '123',
      role: 'admin'
    });

    console.log('Status Colaborador Criando Admin:', collabCreateAdminRes.status);
    console.log('Resposta:', collabCreateAdminRes.data);
    if (collabCreateAdminRes.status !== 403) {
      throw new Error('Falha: colaborador NÃO pode criar usuário com perfil admin!');
    }
    console.log('✅ Bloqueio de colaborador criar admin validado.');

    // 4. Colaborador tentando alterar Admin ID 1
    console.log('\n--- 4. Restrição de Colaborador Alterar Super Admin ID 1 ---');
    const collabEditRootRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/users/1',
      method: 'PUT',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': String(testCollab.id)
      }
    }, {
      name: 'Tentativa Hacker'
    });

    console.log('Status Colaborador Alterando ID 1:', collabEditRootRes.status);
    console.log('Resposta:', collabEditRootRes.data);
    if (collabEditRootRes.status !== 403) {
      throw new Error('Falha: colaborador NÃO pode alterar Super Admin ID 1!');
    }
    console.log('✅ Bloqueio de colaborador alterar ID 1 validado.');

    // 5. Usuário Suspenso tentando adicionar transação
    console.log('\n--- 5. Restrição de Usuário Suspenso Criar Transação ---');
    const suspendedTxRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/transactions',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': String(testSuspended.id)
      }
    }, {
      code: 'PETR4',
      type: 'buy',
      quantity: 10,
      price: 35.5,
      date: '2026-09-25'
    });

    console.log('Status Suspenso Criando Transação:', suspendedTxRes.status);
    console.log('Resposta:', suspendedTxRes.data);
    if (suspendedTxRes.status !== 403 || suspendedTxRes.data.error !== 'ACCOUNT_SUSPENDED') {
      throw new Error('Falha: usuário suspenso não foi bloqueado de registrar transações!');
    }
    console.log('✅ Bloqueio de transações para conta suspensa validado.');

    // 6. Usuário Ativo criando transação normalmente
    console.log('\n--- 6. Usuário Ativo Criando Transação Normalmente ---');
    const activeTxRes = await request({
      hostname: 'localhost',
      port,
      path: '/api/transactions',
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'X-User-Id': String(testActive.id)
      }
    }, {
      code: 'PETR4',
      type: 'buy',
      quantity: 10,
      price: 35.5,
      date: '2026-09-25'
    });

    console.log('Status Ativo Criando Transação:', activeTxRes.status);
    if (activeTxRes.status !== 201) {
      throw new Error('Falha: usuário ativo deveria registrar transações normalmente!');
    }
    const createdTxId = activeTxRes.data.id;
    console.log('✅ Transação criada com ID:', createdTxId);

    // 7. Usuário Ativo deletando sua transação
    const deleteTxRes = await request({
      hostname: 'localhost',
      port,
      path: `/api/transactions/${createdTxId}`,
      method: 'DELETE',
      headers: {
        'X-User-Id': String(testActive.id)
      }
    });
    console.log('Status Ativo Deletando Transação:', deleteTxRes.status);
    if (deleteTxRes.status !== 200) {
      throw new Error('Falha ao deletar transação de usuário ativo!');
    }
    console.log('✅ Transação excluída com sucesso.');

    console.log('\n🎉 TODOS OS TESTES DE PERMISSÕES E STATUS PASSARAM COM SUCESSO 100%!');
  } finally {
    deleteUser(testCollab.id);
    deleteUser(testInactive.id);
    deleteUser(testSuspended.id);
    deleteUser(testActive.id);
  }
}

testApi().catch(err => {
  console.error('❌ Falha nos testes de API:', err);
  process.exit(1);
});
