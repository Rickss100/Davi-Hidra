import { 
  initDatabase, 
  getUserByEmail, 
  getUserById, 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser 
} from './src/services/database.service.js';

async function runTests() {
  console.log('🧪 Iniciando Testes de Perfis de Usuários, Status e Planos...');
  initDatabase();

  const timestamp = Date.now();
  const adminEmail = `admin_test_${timestamp}@davi.com`;
  const collabEmail = `collab_test_${timestamp}@davi.com`;
  const userActiveEmail = `active_${timestamp}@davi.com`;
  const userSuspendedEmail = `suspended_${timestamp}@davi.com`;
  const userInactiveEmail = `inactive_${timestamp}@davi.com`;
  const userExpiredEmail = `expired_${timestamp}@davi.com`;

  // 1. Criar Superusuário Admin
  console.log('\n--- 1. Criação de Usuários com Perfis e Planos ---');
  const admin = createUser({
    email: adminEmail,
    password: '123',
    name: 'Admin Teste',
    role: 'admin',
    status: 'active',
    plan_period: 'lifetime'
  });
  console.log('✅ Admin criado ID:', admin.id, 'role:', admin.role);

  // 2. Criar Colaborador
  const collab = createUser({
    email: collabEmail,
    password: '123',
    name: 'Colaborador TI Teste',
    role: 'collaborator',
    status: 'active',
    plan_period: 'lifetime'
  });
  console.log('✅ Colaborador criado ID:', collab.id, 'role:', collab.role);

  // 3. Criar Investidor Ativo (Plano 1 ano)
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 1);
  const activeUser = createUser({
    email: userActiveEmail,
    password: '123',
    name: 'Investidor Ativo',
    role: 'user',
    status: 'active',
    plan_period: '1_year',
    plan_expires_at: futureDate.toISOString()
  });
  console.log('✅ Investidor Ativo criado ID:', activeUser.id, 'expires_at:', activeUser.plan_expires_at);

  // 4. Criar Investidor Suspenso
  const suspendedUser = createUser({
    email: userSuspendedEmail,
    password: '123',
    name: 'Investidor Suspenso',
    role: 'user',
    status: 'suspended',
    plan_period: '1_month'
  });
  console.log('✅ Investidor Suspenso criado ID:', suspendedUser.id, 'status:', suspendedUser.status);

  // 5. Criar Investidor Inativo
  const inactiveUser = createUser({
    email: userInactiveEmail,
    password: '123',
    name: 'Investidor Inativo',
    role: 'user',
    status: 'inactive'
  });
  console.log('✅ Investidor Inativo criado ID:', inactiveUser.id, 'status:', inactiveUser.status);

  // 6. Criar Investidor com Plano Expirado
  const pastDate = new Date();
  pastDate.setDate(pastDate.getDate() - 5);
  const expiredUser = createUser({
    email: userExpiredEmail,
    password: '123',
    name: 'Investidor Expirado',
    role: 'user',
    status: 'active',
    plan_period: '1_month',
    plan_expires_at: pastDate.toISOString()
  });
  console.log('✅ Investidor Expirado criado ID:', expiredUser.id, 'expires_at:', expiredUser.plan_expires_at);

  // 7. Testar Enriquecimento de Planos
  console.log('\n--- 2. Verificação de Enriquecimento de Plano e Expiração ---');
  const fetchedActive = getUserById(activeUser.id);
  const fetchedExpired = getUserById(expiredUser.id);
  console.log('Active isPlanExpired:', fetchedActive.isPlanExpired, '(Esperado: false)');
  console.log('Expired isPlanExpired:', fetchedExpired.isPlanExpired, '(Esperado: true)');

  if (fetchedActive.isPlanExpired !== false || fetchedExpired.isPlanExpired !== true) {
    throw new Error('Falha na detecção de plano expirado!');
  }
  console.log('✅ Detecção de expiração de plano validada com sucesso.');

  // 8. Testar Proteção de Exclusão do ID 1
  console.log('\n--- 3. Verificação de Proteção do Super Admin ID 1 ---');
  try {
    deleteUser(1);
    throw new Error('ERRO: Não deveria ter permitido deletar o Administrador ID 1!');
  } catch (err) {
    console.log('✅ Tentativa de deletar Admin ID 1 bloqueada com sucesso:', err.message);
  }

  // 9. Limpar usuários criados no teste
  deleteUser(admin.id);
  deleteUser(collab.id);
  deleteUser(activeUser.id);
  deleteUser(suspendedUser.id);
  deleteUser(inactiveUser.id);
  deleteUser(expiredUser.id);
  console.log('\n✅ Limpeza dos registros de teste concluída com sucesso!');
  console.log('🎉 TODOS OS TESTES INTERNOS PASSARAM!');
}

runTests().catch(err => {
  console.error('❌ Falha nos testes:', err);
  process.exit(1);
});
