import crypto from 'crypto';
import express from 'express';
import bcrypt from 'bcryptjs';
import {
  getDatabase,
  getUserByEmail,
  getUserById,
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
  getUserTransactions,
  insertAuditLog
} from '../services/database.service.js';
import { syncUserToTurso, syncUserDeleteToTurso } from '../services/turso.service.js';
import {
  signAuthToken,
  requireAuth,
  requireAdminOrCollab,
  resolveAuthorizedUserId,
  createRateLimiter
} from '../middleware/security.middleware.js';

const router = express.Router();

// Rate limiters dedicados contra força bruta e enumeração
const loginLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 10,
  keyPrefix: 'login',
  message: 'Muitas tentativas de login falharam. Por segurança, aguarde 15 minutos antes de tentar novamente.'
});

const authActionLimiter = createRateLimiter({
  windowMs: 15 * 60 * 1000,
  max: 8,
  keyPrefix: 'auth-action',
  message: 'Limite de solicitações atingido. Aguarde alguns minutos antes de tentar novamente.'
});

function sanitizeUser(user) {
  if (!user) return null;
  const { password, reset_token, reset_expires, ...safe } = user;
  return safe;
}

// GET /api/users/me - Valida o token atual e retorna dados seguros do usuário autenticado
router.get('/me', requireAuth, (req, res) => {
  res.json({ user: sanitizeUser(req.authUser) });
});

// POST /api/users/audit - Registrar log de auditoria (Impersonação)
router.post('/audit', requireAdminOrCollab, async (req, res) => {
  try {
    const { action, targetUserId, reason } = req.body;
    insertAuditLog(
      req.authUser.id,
      targetUserId,
      action || 'IMPERSONATE',
      reason || 'Sem motivo detalhado'
    );
    res.json({ message: 'Audit log salvo com sucesso.' });
  } catch (err) {
    console.error('Erro ao salvar audit log:', err);
    res.status(500).json({ error: 'Erro interno.' });
  }
});

// POST /api/users/login - Authenticate user & issue signed JWT
router.post('/login', loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: 'E-mail/login e senha são obrigatórios.' });
    }

    const user = getUserByEmail(String(email).trim());
    if (!user) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu login e senha.' });
    }

    const isHashed =
      user.password && (user.password.startsWith('$2a$') || user.password.startsWith('$2b$'));

    let isMatch = false;
    if (isHashed) {
      isMatch = bcrypt.compareSync(String(password), user.password);
    } else {
      isMatch = user.password === String(password);
    }

    if (!isMatch) {
      return res.status(401).json({ error: 'Credenciais inválidas. Verifique seu login e senha.' });
    }

    // Login válido -> zera contador de falhas do IP no Rate Limiter
    loginLimiter.resetKey(req);

    // Migração silenciosa defensiva caso senha ainda não estivesse em bcrypt ou sem uuid
    let activeUser = user;
    if (!isHashed || !user.uuid) {
      const newHash = isHashed ? user.password : bcrypt.hashSync(String(password), 10);
      activeUser = updateUser(user.id, { password: newHash }) || user;
      try {
        await syncUserToTurso(activeUser);
      } catch (e) {
        console.warn('⚠️ Falha ao migrar credenciais para Turso:', e.message);
      }
    }

    if (activeUser.status === 'inactive') {
      return res.status(403).json({
        error: 'ACCOUNT_INACTIVE',
        message:
          'Sua conta está inativa por motivos técnicos ou desfiliação do programa. Por favor, entre em contato com nosso suporte técnico.'
      });
    }

    const isSuspended =
      activeUser.status === 'suspended' ||
      (activeUser.role === 'user' && activeUser.isPlanExpired);

    const token = signAuthToken(activeUser);
    const userSafe = sanitizeUser(activeUser);

    res.json({
      message: 'Login realizado com sucesso',
      token,
      user: {
        ...userSafe,
        status: isSuspended ? 'suspended' : activeUser.status,
        isSuspended: !!isSuspended
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Erro interno ao processar autenticação.' });
  }
});

// POST /api/users/register - Cadastro público de novo investidor
router.post('/register', authActionLimiter, async (req, res) => {
  try {
    const { email, password, name } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Nome, login/e-mail e senha são obrigatórios.' });
    }

    if (String(password).trim().length < 6) {
      return res.status(400).json({ error: 'A senha deve ter pelo menos 6 caracteres.' });
    }

    const existing = getUserByEmail(String(email).trim());
    if (existing) {
      return res.status(409).json({ error: 'Já existe um usuário cadastrado com este login/e-mail.' });
    }

    const hashedPassword = bcrypt.hashSync(String(password).trim(), 10);

    const newUser = createUser({
      email: String(email).trim(),
      password: hashedPassword,
      name: String(name).trim(),
      role: 'user',
      status: 'active',
      plan_period: 'lifetime',
      plan_expires_at: null
    });

    try {
      await syncUserToTurso({ ...newUser, password: hashedPassword });
    } catch (tursoErr) {
      console.error('⚠️ Falha ao sincronizar novo usuário no Turso:', tursoErr.message);
    }

    const token = signAuthToken(newUser);
    res.status(201).json({
      message: 'Conta criada com sucesso!',
      token,
      user: sanitizeUser(newUser)
    });
  } catch (error) {
    console.error('Error registering user:', error);
    res.status(500).json({ error: 'Erro ao criar conta.' });
  }
});

// GET /api/users - List all users with statistics (Admin & Collaborator ONLY)
router.get('/', requireAdminOrCollab, (req, res) => {
  try {
    const users = getAllUsers();
    const safeUsers = users.map((u) => sanitizeUser(u));
    res.json(safeUsers);
  } catch (error) {
    console.error('Error fetching users:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users - Create new user (Admin & Collaborator ONLY)
router.post('/', requireAdminOrCollab, async (req, res) => {
  try {
    const requester = req.authUser;
    const { email, password, name, role, status, plan_period, plan_expires_at } = req.body;
    if (!email || !password || !name) {
      return res.status(400).json({ error: 'Nome, login/e-mail e senha são obrigatórios.' });
    }

    if (requester.role === 'collaborator' && role === 'admin') {
      return res.status(403).json({
        error: 'Colaboradores não têm permissão para criar usuários Administradores.'
      });
    }

    const existing = getUserByEmail(String(email).trim());
    if (existing) {
      return res.status(409).json({ error: 'Já existe um usuário cadastrado com este login/e-mail.' });
    }

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

    const hashedPassword = bcrypt.hashSync(String(password).trim(), 10);

    const newUser = createUser({
      email: String(email).trim(),
      password: hashedPassword,
      name: String(name).trim(),
      role: role || 'user',
      status: status || 'active',
      plan_period: finalPeriod,
      plan_expires_at: finalExpiresAt
    });

    try {
      await syncUserToTurso({ ...newUser, password: hashedPassword });
    } catch (tursoErr) {
      console.error('⚠️ Falha ao sincronizar novo usuário no Turso:', tursoErr.message);
    }

    res.status(201).json({
      message: 'Usuário criado com sucesso!',
      user: sanitizeUser(newUser)
    });
  } catch (error) {
    console.error('Error creating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/users/:id - Update user details
router.put('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.authUser;
    const targetUser = getUserById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const isPrivileged = requester.role === 'admin' || requester.role === 'collaborator';

    // Investidor comum só pode atualizar seus próprios dados básicos (sem escalar privilégio/plano)
    if (!isPrivileged) {
      if (Number(targetUser.id) !== Number(requester.id)) {
        return res.status(403).json({ error: 'Acesso negado.' });
      }
      if (
        req.body.role !== undefined ||
        req.body.status !== undefined ||
        req.body.plan_period !== undefined ||
        req.body.plan_expires_at !== undefined
      ) {
        return res.status(403).json({ error: 'Operação não permitida para este perfil.' });
      }
    }

    // Restrições de Colaborador
    if (requester.role === 'collaborator') {
      if (targetUser.role === 'admin' || Number(targetUser.id) === 1) {
        return res.status(403).json({
          error: 'Colaboradores não têm permissão para alterar contas de Administradores.'
        });
      }
      if (req.body.role === 'admin') {
        return res.status(403).json({
          error: 'Colaboradores não têm permissão para promover usuários a Administrador.'
        });
      }
    }

    const { name, email, password, role, status, plan_period, plan_expires_at } = req.body;

    if (email) {
      const existing = getUserByEmail(String(email).trim());
      if (existing && Number(existing.id) !== Number(targetUser.id)) {
        return res.status(409).json({
          error: 'Este e-mail/login já está sendo utilizado por outro usuário.'
        });
      }
    }

    let finalExpiresAt = isPrivileged ? plan_expires_at : targetUser.plan_expires_at;
    const finalPeriod =
      isPrivileged && plan_period !== undefined
        ? plan_period
        : targetUser.plan_period || 'lifetime';

    if (isPrivileged && plan_period !== undefined && plan_expires_at === undefined) {
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

    let finalPassword = undefined;
    if (password && String(password).trim() !== '') {
      finalPassword = bcrypt.hashSync(String(password).trim(), 10);
    }

    const updated = updateUser(targetUser.id, {
      name,
      email,
      password: finalPassword,
      role: isPrivileged ? role : targetUser.role,
      status: isPrivileged ? status : targetUser.status,
      plan_period: finalPeriod,
      plan_expires_at: finalExpiresAt
    });

    if (!updated) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    try {
      await syncUserToTurso(updated);
    } catch (tursoErr) {
      console.warn('⚠️ Falha ao atualizar usuário no Turso:', tursoErr.message);
    }

    res.json({
      message: 'Usuário atualizado com sucesso!',
      user: sanitizeUser(updated)
    });
  } catch (error) {
    console.error('Error updating user:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/users/:id - Delete user (Admin & Collaborator ONLY)
router.delete('/:id', requireAdminOrCollab, async (req, res) => {
  try {
    const { id } = req.params;
    const requester = req.authUser;
    const targetUser = getUserById(id);
    if (!targetUser) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    if (Number(targetUser.id) === 1) {
      return res.status(400).json({ error: 'Não é permitido excluir o Administrador principal.' });
    }

    if (requester.role === 'collaborator' && targetUser.role === 'admin') {
      return res.status(403).json({
        error: 'Colaboradores não têm permissão para excluir Administradores.'
      });
    }

    try {
      await syncUserDeleteToTurso(targetUser.id);
    } catch (tursoErr) {
      console.warn('⚠️ Falha ao remover usuário no Turso:', tursoErr.message);
    }

    deleteUser(targetUser.id);
    res.json({ message: 'Usuário excluído com sucesso.' });
  } catch (error) {
    console.error('Error deleting user:', error);
    res.status(400).json({ error: error.message });
  }
});

// GET /api/users/:id/portfolio - Inspect specific user's transactions and portfolio
router.get('/:id/portfolio', requireAuth, (req, res) => {
  try {
    const authCheck = resolveAuthorizedUserId(req, req.params.id);
    if (!authCheck.userId) {
      return res.status(authCheck.status).json({ error: authCheck.message });
    }

    const user = getUserById(authCheck.userId);
    if (!user) {
      return res.status(404).json({ error: 'Usuário não encontrado.' });
    }

    const transactions = getUserTransactions(authCheck.userId);
    const totalInvested = transactions
      .filter((t) => t.type === 'buy')
      .reduce((sum, t) => sum + (t.total_value || t.quantity * t.price), 0);

    res.json({
      user: sanitizeUser(user),
      totalTransactions: transactions.length,
      totalInvested,
      transactions
    });
  } catch (error) {
    console.error('Error fetching user portfolio:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/users/forgot-password (Blindado: nunca expõe token de reset na resposta HTTP)
router.post('/forgot-password', authActionLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) {
      return res.status(400).json({ error: 'Informe seu e-mail.' });
    }

    const db = getDatabase();
    const user = db
      .prepare('SELECT id FROM users WHERE LOWER(email) = LOWER(?)')
      .get(String(email).trim());

    if (user) {
      const resetToken = crypto.randomBytes(32).toString('hex');
      const expires = new Date(Date.now() + 3600000).toISOString();
      db.prepare('UPDATE users SET reset_token = ?, reset_expires = ? WHERE id = ?').run(
        resetToken,
        expires,
        user.id
      );

      if (process.env.NODE_ENV !== 'production') {
        console.log(`[DEV Password Reset] Para ${email}: /redefinir-senha?token=${resetToken}`);
      }
    }

    // Resposta uniforme anti-enumeração e sem vazamento de token
    res.json({
      message: 'Se o e-mail existir, as instruções de recuperação foram registradas.'
    });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao processar solicitação.' });
  }
});

// POST /api/users/reset-password
router.post('/reset-password', authActionLimiter, async (req, res) => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword || String(newPassword).trim().length < 6) {
      return res.status(400).json({
        error: 'Token válido e nova senha (mínimo 6 caracteres) são obrigatórios.'
      });
    }

    const db = getDatabase();
    const user = db
      .prepare('SELECT id, reset_expires FROM users WHERE reset_token = ?')
      .get(String(token).trim());

    if (!user) {
      return res.status(400).json({ error: 'Token inválido ou expirado.' });
    }

    if (new Date() > new Date(user.reset_expires)) {
      return res.status(400).json({ error: 'Token expirado.' });
    }

    const hash = bcrypt.hashSync(String(newPassword).trim(), 10);
    db.prepare(
      'UPDATE users SET password = ?, reset_token = NULL, reset_expires = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?'
    ).run(hash, user.id);

    const updatedUser = getUserById(user.id);
    try {
      await syncUserToTurso(updatedUser);
    } catch (e) {
      console.warn('⚠️ Falha ao sincronizar senha redefinida no Turso:', e.message);
    }

    res.json({ message: 'Senha redefinida com sucesso.' });
  } catch (error) {
    res.status(500).json({ error: 'Erro ao redefinir senha.' });
  }
});

export default router;
