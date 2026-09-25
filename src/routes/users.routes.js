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

    if (user.status !== 'active') {
      return res.status(403).json({ error: 'Este usuário está inativo/bloqueado. Contate o administrador.' });
    }

    // Não retornar a senha no payload de resposta
    const { password: _, ...userSafe } = user;
    res.json({
      message: 'Login realizado com sucesso',
      user: userSafe
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
      status: 'active'
    });

    // ✅ Aguardar confirmação síncrona no Turso antes de retornar
    try {
      await syncUserToTurso(newUser);
    } catch (tursoErr) {
      console.error('⚠️ Falha ao sincronizar novo usuário no Turso:', tursoErr.message);
      // Não bloquear o cadastro — usuário existe no local; startup sync vai tentar de novo
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


// GET /api/users - List all users with statistics (Superuser Admin)
router.get('/', (req, res) => {
  try {
    const users = getAllUsers();
    // Ocultar hash/senha bruta ou fornecer apenas flag/senha mascarada se necessário
    res.json(users);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Create new user (Superuser Admin)
router.post('/', async (req, res) => {
  try {
    const { email, password, name, role, status } = req.body;
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
      role: role || 'user',
      status: status || 'active'
    });

    // ✅ Aguardar confirmação síncrona no Turso antes de retornar
    try {
      await syncUserToTurso(newUser);
    } catch (tursoErr) {
      console.error('⚠️ Falha ao sincronizar novo usuário (admin) no Turso:', tursoErr.message);
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

// PUT /api/users/:id - Update user details, login, password, status (Superuser Admin)
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, password, role, status } = req.body;

    // Verificar se novo email já está em uso por outro usuário
    if (email) {
      const existing = getUserByEmail(email.trim());
      if (existing && existing.id !== Number(id)) {
        return res.status(409).json({ error: 'Este e-mail/login já está sendo utilizado por outro usuário.' });
      }
    }

    const updated = updateUser(id, { name, email, password, role, status });
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

// DELETE /api/users/:id - Delete user (Superuser Admin)
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // Não permitir deletar o id 1 (Super Admin inicial)
    if (Number(id) === 1) {
      return res.status(400).json({ error: 'Não é permitido excluir o Administrador principal.' });
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
