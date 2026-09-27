import { GoogleGenerativeAI } from '@google/generative-ai';

// Initialize Gemini
// We will expect GEMINI_API_KEY in the .env file
const getGenAI = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return null;
  return new GoogleGenerativeAI(apiKey);
};

export async function generateChatResponse(db, userId, userMessage, currentRoute) {
  const genAI = getGenAI();
  if (!genAI) {
    return "A chave da API do Gemini (GEMINI_API_KEY) não foi encontrada no servidor. Por favor, adicione-a no arquivo .env.";
  }

  // Obter dados do usuário para o contexto
  let userDataContext = '';
  
  try {
    // 1. Tentar pegar os objetivos do usuário
    const objRow = db.prepare('SELECT macro_allocation FROM user_objectives WHERE user_id = ?').get(userId);
    if (objRow && objRow.macro_allocation) {
      const macro = JSON.parse(objRow.macro_allocation);
      userDataContext += `\n- Objetivos Macro (Padrão Ouro): Renda Fixa ${macro.fixed}%, Variável ${macro.variable}%. Dentro de Variável: Brasil ${macro.brasil}%, EUA ${macro.usa}%. Ações ${macro.acoes}%, FIIs ${macro.fiis}%. Stocks ${macro.stocks}%, REITs ${macro.reits}%.`;
    }

    // 2. Tentar pegar a carteira atual (transações)
    const txRows = db.prepare('SELECT asset_code, type, quantity, price FROM transactions WHERE user_id = ?').all(userId);
    if (txRows && txRows.length > 0) {
      // Agrupar por ativo
      const holdings = {};
      txRows.forEach(tx => {
        if (!holdings[tx.asset_code]) holdings[tx.asset_code] = 0;
        holdings[tx.asset_code] += (tx.type === 'buy' ? tx.quantity : -tx.quantity);
      });
      const activeHoldings = Object.entries(holdings)
        .filter(([_, qty]) => qty > 0)
        .map(([code, qty]) => `${code} (Qtd: ${qty})`);
      
      if (activeHoldings.length > 0) {
        userDataContext += `\n- Carteira Atual: ${activeHoldings.join(', ')}.`;
      }
    }
  } catch (err) {
    console.error('Erro ao buscar contexto para IA:', err);
  }

  const systemPrompt = `Você é o "Assessor DAVI", o assistente oficial de Inteligência Artificial do aplicativo financeiro Davi & Hydra.
Sua missão é ajudar o usuário com seus investimentos, focando exclusivamente em Buy and Hold e na filosofia do Método DAVI (Padrão Ouro).
Regras do método:
1. Rebalanceamento é rei. Compre o que ficou para trás da meta.
2. Não faça day trade, não sugira giros de carteira.
3. Responda de forma amigável, concisa e sempre em Português Brasileiro (PT-BR).
4. Se o usuário estiver na tela de "Onde Aportar", ele provavelmente quer saber como distribuir o dinheiro ou validar uma matemática.
5. Se ele estiver na tela "Auditoria", quer saber de riscos da carteira.

Informações contextuais do momento:
- O usuário está atualmente na tela: "${currentRoute}" do aplicativo.
${userDataContext ? `- Dados Reais do Banco de Dados do Usuário: ${userDataContext}` : '- O usuário ainda não possui ativos ou objetivos cadastrados.'}

Responda diretamente a pergunta do usuário de forma útil e direta, considerando os dados acima. Se os dados forem úteis para a resposta, mencione-os sutilmente. Formate a resposta usando Markdown limpo (negritos, listas) para facilitar a leitura no chat.`;

  try {
    const model = genAI.getGenerativeModel({ model: "gemini-3.5-flash" });
    const chat = model.startChat({
      history: [
        {
          role: "user",
          parts: [{ text: systemPrompt }]
        },
        {
          role: "model",
          parts: [{ text: "Compreendido! Estou pronto para atuar como o Assessor DAVI e guiar o usuário na tela atual." }]
        }
      ],
    });

    const result = await chat.sendMessage(userMessage);
    const response = await result.response;
    return response.text();
  } catch (error) {
    console.error('Gemini API Error:', error);
    return "Desculpe, enfrentei um problema técnico ao consultar a IA. Tente novamente mais tarde.";
  }
}
