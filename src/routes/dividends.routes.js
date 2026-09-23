import express from 'express';
import { 
  getUserDividendsCalendar, 
  seedDividendsData 
} from '../services/dividends.service.js';
import { getDatabase } from '../services/database.service.js';

const router = express.Router();

/**
 * GET /api/dividends/calendar
 * Retorna os proventos do mês agrupados por dia para o usuário
 */
router.get('/calendar', (req, res) => {
  try {
    const userId = parseInt(req.query.userId || req.headers['x-user-id'] || '1', 10);
    const now = new Date();
    const year = parseInt(req.query.year || now.getFullYear(), 10);
    const month = parseInt(req.query.month || (now.getMonth() + 1), 10);

    const calendar = getUserDividendsCalendar(userId, year, month);
    res.json(calendar);
  } catch (err) {
    console.error('Erro ao buscar calendário de proventos:', err);
    res.status(500).json({ error: 'Erro ao buscar calendário de proventos', message: err.message });
  }
});

/**
 * POST /api/dividends/seed
 * Popula proventos realistas para testes e simulações
 */
router.post('/seed', (req, res) => {
  try {
    const result = seedDividendsData();
    res.json(result);
  } catch (err) {
    console.error('Erro ao popular proventos:', err);
    res.status(500).json({ error: 'Erro ao popular proventos', message: err.message });
  }
});

/**
 * GET /api/dividends/magic-number
 * Retorna o cálculo do "Número Mágico" (Efeito Bola de Neve) para os ativos em custódia do usuário
 */
router.get('/magic-number', (req, res) => {
  try {
    const userId = parseInt(req.query.userId || req.headers['x-user-id'] || '1', 10);
    const db = getDatabase();

    // 1. Obter ativos do usuário com quantidade > 0
    const holdings = db.prepare(`
      SELECT 
        t.asset_code,
        SUM(CASE WHEN t.type = 'buy' THEN t.quantity ELSE -t.quantity END) as quantity,
        AVG(t.price) as avg_price,
        a.name,
        a.type as category
      FROM transactions t
      JOIN assets a ON a.code = t.asset_code
      WHERE t.user_id = ?
      GROUP BY t.asset_code
      HAVING quantity > 0
    `).all(userId);

    // 2. Para cada ativo, buscar o último dividendo e a cotação
    const magicNumbers = holdings.map(h => {
      // Buscar cotação atual ou recente
      const priceRow = db.prepare(`
        SELECT close FROM prices 
        WHERE asset_code = ? 
        ORDER BY date DESC LIMIT 1
      `).get(h.asset_code);

      const currentPrice = priceRow?.close || h.avg_price || 10;

      // Buscar média dos últimos 3 proventos
      const lastDividends = db.prepare(`
        SELECT amount FROM dividends 
        WHERE asset_code = ? 
        ORDER BY payment_date DESC LIMIT 3
      `).all(h.asset_code);

      const avgDividend = lastDividends.length > 0
        ? lastDividends.reduce((acc, d) => acc + d.amount, 0) / lastDividends.length
        : (currentPrice * 0.008); // Fallback: 0.8% ao mês (~9.6% a.a.)

      // Número de cotas necessárias para que o dividendo pague 1 cota: Cota / Dividendo_Unitário
      const magicNumber = avgDividend > 0 ? Math.ceil(currentPrice / avgDividend) : 0;
      const progressPercent = magicNumber > 0 ? Math.min(100, (h.quantity / magicNumber) * 100) : 0;
      const monthlyIncome = h.quantity * avgDividend;
      const sharesPerMonth = avgDividend > 0 ? (monthlyIncome / currentPrice) : 0;

      return {
        assetCode: h.asset_code,
        assetName: h.name,
        category: h.category,
        quantity: h.quantity,
        currentPrice: Number(currentPrice.toFixed(2)),
        avgDividend: Number(avgDividend.toFixed(3)),
        magicNumber,
        progressPercent: Number(progressPercent.toFixed(1)),
        isMagicReached: h.quantity >= magicNumber,
        monthlyIncome: Number(monthlyIncome.toFixed(2)),
        sharesPerMonth: Number(sharesPerMonth.toFixed(2))
      };
    });

    res.json(magicNumbers);
  } catch (err) {
    console.error('Erro ao calcular Número Mágico:', err);
    res.status(500).json({ error: 'Erro ao calcular Número Mágico', message: err.message });
  }
});

/**
 * GET /api/dividends/forecast
 * Simulação de Renda Passiva Futura (Projeção com Aporte e Bola de Neve)
 */
router.get('/forecast', (req, res) => {
  try {
    const currentEquity = parseFloat(req.query.currentEquity || '50000');
    const monthlyContribution = parseFloat(req.query.monthlyContribution || '1500');
    const targetMonths = parseInt(req.query.months || '36', 10); // Ex: 36 meses = 3 anos
    const dividendYieldAnnual = parseFloat(req.query.dividendYield || '8.5') / 100;
    const capitalAppreciationAnnual = parseFloat(req.query.appreciation || '4.0') / 100; // Valorização da cota acima da inflação
    const reinvestDividends = req.query.reinvest !== 'false';

    const monthlyDY = dividendYieldAnnual / 12;
    const monthlyAppreciation = capitalAppreciationAnnual / 12;

    let equity = currentEquity;
    let totalDividendsReceived = 0;
    const timeline = [];

    for (let m = 1; m <= targetMonths; m++) {
      // Rendimento de proventos deste mês
      const monthlyIncome = equity * monthlyDY;
      totalDividendsReceived += monthlyIncome;

      // Valorização do patrimônio existente
      equity = equity * (1 + monthlyAppreciation);

      // Novo aporte mensal
      equity += monthlyContribution;

      // Reinvestimento dos proventos (Efeito Bola de Neve)
      if (reinvestDividends) {
        equity += monthlyIncome;
      }

      // Salvar pontos chave para o gráfico (a cada 6 meses e no último)
      if (m % 6 === 0 || m === targetMonths || m === 1) {
        timeline.push({
          month: m,
          year: Number((m / 12).toFixed(1)),
          equity: Number(equity.toFixed(2)),
          monthlyIncome: Number((equity * monthlyDY).toFixed(2)),
          annualIncome: Number((equity * dividendYieldAnnual).toFixed(2))
        });
      }
    }

    const finalMonthlyIncome = equity * monthlyDY;
    const finalAnnualIncome = equity * dividendYieldAnnual;

    res.json({
      targetMonths,
      targetYears: Number((targetMonths / 12).toFixed(1)),
      finalEquity: Number(equity.toFixed(2)),
      finalMonthlyIncome: Number(finalMonthlyIncome.toFixed(2)),
      finalAnnualIncome: Number(finalAnnualIncome.toFixed(2)),
      totalDividendsReceived: Number(totalDividendsReceived.toFixed(2)),
      reinvestDividends,
      timeline
    });
  } catch (err) {
    console.error('Erro na projeção de renda passiva:', err);
    res.status(500).json({ error: 'Erro na projeção', message: err.message });
  }
});

export default router;
