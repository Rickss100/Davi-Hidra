import express from 'express';
import { generateChatResponse } from '../services/ai.service.js';
import { getDatabase } from '../services/database.service.js';

const router = express.Router();

router.post('/', async (req, res) => {
  try {
    const { message, currentRoute, userId } = req.body;
    
    if (!message) {
      return res.status(400).json({ error: 'A mensagem é obrigatória' });
    }

    // Se o usuário não estiver logado, usamos um ID padrão ou 1 para testes
    const uId = userId || 1;
    const db = getDatabase();

    const reply = await generateChatResponse(db, uId, message, currentRoute || 'Home');
    
    res.json({ reply });
  } catch (error) {
    console.error('Chat endpoint error:', error);
    res.status(500).json({ error: 'Erro interno no servidor de chat' });
  }
});

export default router;
