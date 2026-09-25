/**
 * Users Routes (Authentication and Superuser Admin Management)
 */
import express from 'express';
import { 
  getUserByEmail, 
  getUserById, 
  getAllUsers, 
  createUser, 
  updateUser, 
  deleteUser, 
  getUserTransactions 
} from '../services/database.service.js';
import { syncUserToTurso, syncUserDeleteToTurso } from '../services/turso.service.js';

const router = express.Router();

function getRequester(req) {
  const callerId = req.headers['x-user-id'];
  if (!callerId) return null;
  return getUserById(callerId);
}

// POST /api/users/login - Authenticate user
router.post('/login', (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail/login e senha são obrigatórios.' });
    }

    const user = getUserByEmail(email.trim());
    if (!user || user.password !== password) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu login e senha.' });
    }

    if (user.status === 'inactive') {
      return res.status(403).json({ 
        error: 'ACCOUNT_INACTIVE', 
        message: 'Sua conta está inativa por motivos técnicos ou desfiliação do programa. Por favor, entre em contato com nosso suporte técnico.' 
      });
    }

    // Se o plano expirou ou status for suspenso
    const isSuspended = user.status === 'suspended' || (user.role === 'user' && user.isPlanExpired);

    // Não retornar a senha no payload de resposta
    const { password: _, ...userSafe } = user;
    res.json({
      message: 'Login realizado com sucesso',
      user: {
        ...userSafe,
        status: isSuspended ? 'suspended' : user.status,
        isSuspended: !!isSuspended
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/register - Cadastro público de novo investidor
router.post('/register', async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Nome, login/e-mail e senha são obrigatórios.' });
    }

    const existing = getUserByEmail(email.trim());
    if (existing) {
      return res.status(409).json({ error: 'Já existe um usuário cadastrado com este login/e-mail.' });
    }

    const newUser = createUser({
      email: email.trim(),
      password: password.trim(),
      name: name.trim(),
      role: 'user',
      status: 'active',
      plan_period: 'lifetime',
      plan_expires_at: null
    });

    // ✅ Aguardar confirmação síncrona no Turso antes de retornar
    try {
      await syncUserToTurso({ ...newUser, password: password.trim() });
    } catch (tursoErr) {
      console.error('⚠️ Falha ao sincronizar novo usuário no Turso:', tursoErr.message);
    }

    const { password: _, ...userSafe } = newUser;
    res.status(201).json({
      message: 'Conta criada com sucesso!',
      user: userSafe
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: error.message });
  }
});


// GET /api/users - List all users with statistics (Superuser Admin & Collaborator)
router.get('/', (req, res) => {
  try {
    const requester = getRequester(req);
    if (requester && requester.role !== 'admin' && requester.role !== 'collaborator') {
      return res.status(403).json({ error: 'Acesso negado. Apenas administradores e colaboradores têm acesso a este painel.' });
    }

    const users = getAllUsers();
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Create new user (Superuser Admin & Collaborator)
router.post('/', async (req, res) => {
  try {
    const requester = getRequester(req);
    if (requester && requester.role !== 'admin' && requester.role !== 'collaborator') {
      return res.status(403).json({ error: 'Acesso negado.' });
    }

    const { email, password, name, role, status, plan_period, plan_expires_at } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Nome, login/e-mail e senha são obrigatórios.' });
    }

    // Restrição estrita de Colaborador: NÃO pode criar administrador
    if (requester && requester.role === 'collaborator' && role === 'admin') {
      return res.status(403).json({ error: 'Colaboradores não têm permissão para criar usuários Administradores.' });
    }

    const existing = getUserByEmail(email.trim());
    if (existing) {
      return res.status(409).json({ error: 'Já existe um usuário cadastrado com este login/e-mail.' });
    }

    // Calcular data de expiração caso não venha informada e seja plano com período
    let finalExpiresAt = plan_expires_at || null;
    const finalPeriod = plan_period || 'lifetime';
    if (!finalExpiresAt && finalPeriod !== 'lifetime') {
      const d = new Date();
      if (finalPeriod === '1_month') d.setMonth(d.getMonth() + 1);
      else if (finalPeriod === '3_months') d.setMonth(d.getMonth() + 3);
      else if (finalPeriod === '6_months') d.setMonth(d.getMonth() + 6);
      else if (finalPeriod === '1_year') d.setFullYear(d.getFullYear() + 1);
      finalExpiresAt = d.toISOString();
    } else if (finalPeriod === 'lifetime') {
      finalExpiresAt = null;
    }

    const newUser = createUser({
      email: email.trim(),
      password: password.trim(),
      name: name.trim(),
      role: role || 'user',
      status: status || 'active',
      plan_period: finalPeriod,
      plan_expires_at: finalExpiresAt
    });

    // ✅ Aguardar confirmação síncrona no Turso antes de retornar
    try {
      await syncUserToTurso({ ...newUser, password: password.trim() });
    } catch (tursoErr) {
      console.error('⚠️ Falha ao sincronizar novo usuário no Turso:', tursoErr.message);
    }

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      user: newUser
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Update user details, login, password, status, plan (Admin & Collaborator)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requester = getRequester(req);
    const targetUser = getUserById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // Restrições de Colaborador:
    if (requester && requester.role === 'collaborator') {
      // Não pode modificar a conta principal (ID 1) nem nenhum administrador
      if (targetUser.role === 'admin' || Number(id) === 1) {
        return res.status(403).json({ error: 'Colaboradores não têm permissão para alterar contas de Administradores.' });
      }
      // Não pode promover ninguém para admin
      if (req.body.role === 'admin') {
        return res.status(403).json({ error: 'Colaboradores não têm permissão para promover usuários a Administrador.' });
      }
    }

    const { name, email, password, role, status, plan_period, plan_expires_at } = req.body;

    // Verificar se novo email já está em uso por outro usuário
    if (email) {
      const existing = getUserByEmail(email.trim());
      if (existing && existing.id !== Number(id)) {
        return res.status(409).json({ error: 'Este e-mail/login já está sendo utilizado por outro usuário.' });
      }
    }

    let finalExpiresAt = plan_expires_at;
    const finalPeriod = plan_period !== undefined ? plan_period : (targetUser.plan_period || 'lifetime');
    if (plan_period !== undefined && plan_expires_at === undefined) {
      if (finalPeriod === 'lifetime') {
        finalExpiresAt = null;
      } else {
        const d = new Date();
        if (finalPeriod === '1_month') d.setMonth(d.getMonth() + 1);
        else if (finalPeriod === '3_months') d.setMonth(d.getMonth() + 3);
        else if (finalPeriod === '6_months') d.setMonth(d.getMonth() + 6);
        else if (finalPeriod === '1_year') d.setFullYear(d.getFullYear() + 1);
        finalExpiresAt = d.toISOString();
      }
    }

    const updated = updateUser(id, { 
      name, 
      email, 
      password, 
      role, 
      status, 
      plan_period: finalPeriod, 
      plan_expires_at: finalExpiresAt 
    });

    if (!updated) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    // ✅ Aguardar confirmação de atualização no Turso
    try {
      await syncUserToTurso(updated);
    } catch (tursoErr) {
      console.warn('⚠️ Falha ao atualizar usuário no Turso:', tursoErr.message);
    }

    res.json({
      message: 'Usuário atualizado com sucesso!',
      user: updated
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Delete user (Superuser Admin & Collaborator com restrições)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const requester = getRequester(req);
    const targetUser = getUserById(id);

    // Não permitir deletar o id 1 (Super Admin inicial)
    if (Number(id) === 1) {
      return res.status(400).json({ error: 'Não é permitido excluir o Administrador principal.' });
    }

    // Colaborador não pode excluir nenhum admin
    if (requester && requester.role === 'collaborator') {
      if (targetUser && targetUser.role === 'admin') {
        return res.status(403).json({ error: 'Colaboradores não têm permissão para excluir Administradores.' });
      }
    }

    // 1. Deletar do Turso primeiro para garantir persistência na nuvem
    try {
      await syncUserDeleteToTurso(id);
    } catch (tursoErr) {
      console.warn('⚠️ Falha ao remover usuário no Turso:', tursoErr.message);
    }

    // 2. Deletar do SQLite local
    deleteUser(id);

    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/users/:id/portfolio - Inspect specific user's transactions and portfolio
router.get('/:id/portfolio', (req, res) => {
  try {
    const { id } = req.params;
    const user = getUserById(id);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const transactions = getUserTransactions(id);
    
    // Calcular resumo consolidado
    const totalInvested = transactions
      .filter(t => t.type === 'buy')
      .reduce((sum, t) => sum + (t.total_value || (t.quantity * t.price)), 0);

    res.json({
      user,
      totalTransactions: transactions.length,
      totalInvested,
      transactions
    });
  } catch (error) {
    console.error('Error fetching user portfolio:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
