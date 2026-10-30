import express from 'express';
import { generateChatResponse } from '../services/ai.service.js';
import { getDatabase } from '../services/database.service.js';
import { requireAuth, resolveAuthorizedUserId } from '../middleware/security.middleware.js';

const router = express.Router();

router.post('/', requireAuth, async (req, res) => {
  try {
    const { message, currentRoute, userId } = req.body;

    if (!message) {
      return res.status(400).json({ error: 'A mensagem é obrigatória' });
    }

    const authCheck = resolveAuthorizedUserId(req, userId);
    if (!authCheck.userId) {
      return res.status(authCheck.status).json({ error: authCheck.message });
    }

    const db = getDatabase();
    const reply = await generateChatResponse(db, authCheck.userId, message, currentRoute || 'Home');

    res.json({ reply });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Erro interno no servidor de chat' });
  }
});

export default router;
