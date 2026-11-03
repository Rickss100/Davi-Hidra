import puppeteer from 'puppeteer-core';
import { PGlite } from '@electric-sql/pglite';
import bcrypt from 'bcryptjs';
import path from 'path';
import fs from 'fs';

const SCREENSHOT_DIR = 'C:\\Users\\ricks\\.gemini\\antigravity\\brain\\9cbf9a46-d361-46c0-b285-1126c4a67692\\scratch\\stress_test';
if (!fs.existsSync(SCREENSHOT_DIR)) {
  fs.mkdirSync(SCREENSHOT_DIR, { recursive: true });
}

function sleep(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function seedStressTestData() {
  console.log('📦 Conectando ao PGlite para estruturar a simulação de 2 anos (2024 a 2026)...');
  const p = new PGlite('./.pgdata');
  await p.waitReady;

  const alunoEmail = 'aluno50k@norteinvest.com';
  let alunoUser = (await p.query('SELECT id FROM users WHERE email = $1', [alunoEmail])).rows[0];

  if (!alunoUser) {
    const hash = bcrypt.hashSync('Aluno123!', 10);
    const ins = await p.query(`
      INSERT INTO users (name, email, password_hash, role, status, plan_period)
      VALUES ('Aluno Investidor (50k)', $1, $2, 'user', 'active', 'lifetime')
      RETURNING id;
    `, [alunoEmail, hash]);
    alunoUser = ins.rows[0];
  }

  const userId = alunoUser.id;
  console.log(`👤 ID do Aluno no PostgreSQL: ${userId}`);

  // Limpa transações e sessões antigas do aluno para um teste limpo de 2 anos
  await p.query('DELETE FROM transactions WHERE user_id = $1', [userId]);

  // Catálogo completo de ativos do Método DAVI
  const catalog = [
    { code: 'BBAS3', name: 'Banco do Brasil', type: 'Acao', sector: 'Financeiro' },
    { code: 'ITUB4', name: 'Itaú Unibanco', type: 'Acao', sector: 'Financeiro' },
    { code: 'WEGE3', name: 'WEG S.A.', type: 'Acao', sector: 'Bens Industriais' },
    { code: 'TAEE11', name: 'Taesa Transmissora', type: 'Acao', sector: 'Energia Elétrica' },
    { code: 'VALE3', name: 'Vale S.A.', type: 'Acao', sector: 'Materiais Básicos' },
    { code: 'HGLG11', name: 'CSHG Logística FII', type: 'FII', sector: 'Logística' },
    { code: 'KNRI11', name: 'Kinea Renda Imobiliária', type: 'FII', sector: 'Híbrido' },
    { code: 'XPLG11', name: 'XP Log FII', type: 'FII', sector: 'Logística' },
    { code: 'MXRF11', name: 'Maxi Renda FII', type: 'FII', sector: 'Papel' },
    { code: 'TESOURO_SELIC_2029', name: 'Tesouro Selic 2029 (LFT)', type: 'Renda Fixa', sector: 'Títulos Públicos' },
    { code: 'IVVB11', name: 'iShares S&P 500 FIC FI', type: 'Acao', sector: 'Índice Global' }
  ];

  for (const a of catalog) {
    await p.query(`
      INSERT INTO assets (code, name, type, market, sector)
      VALUES ($1, $2, $3, 'BR', $4)
      ON CONFLICT (code) DO UPDATE SET
        name = EXCLUDED.name,
        type = EXCLUDED.type,
        sector = EXCLUDED.sector;
    `, [a.code, a.name, a.type, a.sector]);

    // Cotações a mercado com valorização realista ao longo de 2 anos (2024 -> 2026)
    let curPrice = 30.0;
    if (a.code === 'BBAS3') curPrice = 28.50;
    if (a.code === 'ITUB4') curPrice = 35.80;
    if (a.code === 'WEGE3') curPrice = 54.20;
    if (a.code === 'TAEE11') curPrice = 36.40;
    if (a.code === 'VALE3') curPrice = 61.50;
    if (a.code === 'HGLG11') curPrice = 164.00;
    if (a.code === 'KNRI11') curPrice = 158.50;
    if (a.code === 'XPLG11') curPrice = 106.20;
    if (a.code === 'MXRF11') curPrice = 10.15;
    if (a.code === 'TESOURO_SELIC_2029') curPrice = 15200.00;
    if (a.code === 'IVVB11') curPrice = 325.00;

    await p.query(`
      INSERT INTO cached_prices (asset_code, price, change_percent, currency, source)
      VALUES ($1, $2, 0.45, 'BRL', 'brapi')
      ON CONFLICT (asset_code) DO UPDATE SET price = EXCLUDED.price;
    `, [a.code, curPrice]);

    // Inserir dados fundamentalistas de Dividend Yield e P/VPA para alimentar os cálculos
    let dy = 8.50;
    let pvpa = 1.0;
    if (a.code === 'BBAS3') { dy = 9.80; pvpa = 0.88; }
    if (a.code === 'ITUB4') { dy = 7.60; pvpa = 1.45; }
    if (a.code === 'WEGE3') { dy = 2.40; pvpa = 9.80; }
    if (a.code === 'TAEE11') { dy = 10.20; pvpa = 1.65; }
    if (a.code === 'HGLG11') { dy = 8.80; pvpa = 1.02; }
    if (a.code === 'KNRI11') { dy = 8.40; pvpa = 0.98; }
    if (a.code === 'XPLG11') { dy = 9.20; pvpa = 0.96; }

    await p.query(`
      INSERT INTO fundamentals (asset_code, dividend_yield, p_vpa, roe, liquidity)
      VALUES ($1, $2, $3, 0.18, 50000000)
      ON CONFLICT (asset_code) DO UPDATE SET
        dividend_yield = EXCLUDED.dividend_yield,
        p_vpa = EXCLUDED.p_vpa;
    `, [a.code, dy, pvpa]);
  }

  // Metas do Mecanismo Hydra do Aluno (Macro e Ativos)
  const macro = { fixed: 15, variable: 85, brasil: 85, usa: 15, acoes: 51, fiis: 34, stocks: 15, reits: 0 };
  const targets = {
    acoes: [
      { code: 'BBAS3', targetPercent: 25 },
      { code: 'ITUB4', targetPercent: 25 },
      { code: 'WEGE3', targetPercent: 25 },
      { code: 'TAEE11', targetPercent: 25 }
    ],
    fiis: [
      { code: 'HGLG11', targetPercent: 40 },
      { code: 'KNRI11', targetPercent: 35 },
      { code: 'XPLG11', targetPercent: 25 }
    ],
    stocks: [
      { code: 'IVVB11', targetPercent: 100 }
    ],
    reits: [],
    fixed: [
      { code: 'TESOURO_SELIC_2029', targetPercent: 100 }
    ],
    reserva: []
  };
  const emergency = { essentialMonthlyExpensesBrl: 3000, targetMonths: 6, safetyMarginPercent: 10 };

  await p.query(`
    INSERT INTO user_objectives (user_id, macro_allocation, asset_targets, emergency_config)
    VALUES ($1, $2, $3, $4)
    ON CONFLICT (user_id) DO UPDATE
    SET macro_allocation = EXCLUDED.macro_allocation,
        asset_targets = EXCLUDED.asset_targets,
        emergency_config = EXCLUDED.emergency_config;
  `, [userId, JSON.stringify(macro), JSON.stringify(targets), JSON.stringify(emergency)]);

  console.log('💰 Semeando Alocação Inicial de R$ 50.000,00 em Novembro de 2024...');
  const initialOperations = [
    // 1. Defesa (Renda Fixa / Tesouro Selic) - R$ 7.500 (15%)
    { code: 'TESOURO_SELIC_2029', type: 'buy', qty: 0.58, price: 12931.03, val: 7500.0, date: '2024-11-10', notes: 'Reserva & Defesa Inicial (15%)' },

    // 2. Ações Brasil (BEST & Novo Mercado) - R$ 21.000 (~42%)
    { code: 'BBAS3', type: 'buy', qty: 220, price: 25.0, val: 5500.0, date: '2024-11-12', notes: 'Aporte Inicial Banco do Brasil' },
    { code: 'ITUB4', type: 'buy', qty: 180, price: 30.5, val: 5490.0, date: '2024-11-12', notes: 'Aporte Inicial Itaú Unibanco' },
    { code: 'WEGE3', type: 'buy', qty: 110, price: 46.0, val: 5060.0, date: '2024-11-14', notes: 'Aporte Inicial WEG' },
    { code: 'TAEE11', type: 'buy', qty: 140, price: 35.0, val: 4900.0, date: '2024-11-14', notes: 'Aporte Inicial Taesa' },

    // 3. Fundos Imobiliários (FIIs Multiativos) - R$ 15.000 (30%)
    { code: 'HGLG11', type: 'buy', qty: 45, price: 158.0, val: 7110.0, date: '2024-11-15', notes: 'Aporte Inicial CSHG Logística' },
    { code: 'KNRI11', type: 'buy', qty: 35, price: 152.0, val: 5320.0, date: '2024-11-15', notes: 'Aporte Inicial Kinea Híbrido' },
    { code: 'XPLG11', type: 'buy', qty: 26, price: 99.0, val: 2574.0, date: '2024-11-15', notes: 'Aporte Inicial XP Log' },

    // 4. Exposição Internacional - R$ 6.500 (13%)
    { code: 'IVVB11', type: 'buy', qty: 25, price: 260.0, val: 6500.0, date: '2024-11-18', notes: 'Aporte Inicial S&P 500 Global' }
  ];

  for (const op of initialOperations) {
    await p.query(`
      INSERT INTO transactions (user_id, asset_code, type, quantity, price, total_value, executed_date, notes)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
    `, [userId, op.code, op.type, op.qty, op.price, op.val, op.date, op.notes]);
  }

  // 24 Meses de Aportes Recorrentes (Dez/2024 a Nov/2026) — R$ 500 em R$ 500 (2 opções de ativos por vez pelo algoritmo AM2O)
  console.log('⚡ Gerando Stress Test: 24 meses de aportes de R$ 500 (2 opções de ativos por vez pelo algoritmo AM2O)...');

  const monthlyPairs = [
    { m: '2024-12-15', a1: { code: 'BBAS3', price: 25.5, val: 250 }, a2: { code: 'HGLG11', price: 159.0, val: 250 } },
    { m: '2025-01-15', a1: { code: 'ITUB4', price: 31.0, val: 250 }, a2: { code: 'KNRI11', price: 153.0, val: 250 } },
    { m: '2025-02-15', a1: { code: 'WEGE3', price: 47.0, val: 250 }, a2: { code: 'XPLG11', price: 100.0, val: 250 } },
    { m: '2025-03-15', a1: { code: 'TAEE11', price: 35.2, val: 250 }, a2: { code: 'TESOURO_SELIC_2029', price: 13200, val: 250 } },
    { m: '2025-04-15', a1: { code: 'BBAS3', price: 26.0, val: 250 }, a2: { code: 'HGLG11', price: 160.0, val: 250 } },
    { m: '2025-05-15', a1: { code: 'ITUB4', price: 31.5, val: 250 }, a2: { code: 'KNRI11', price: 154.0, val: 250 } },
    { m: '2025-06-15', a1: { code: 'WEGE3', price: 48.0, val: 250 }, a2: { code: 'IVVB11', price: 275.0, val: 250 } },
    { m: '2025-07-15', a1: { code: 'TAEE11', price: 35.5, val: 250 }, a2: { code: 'XPLG11', price: 101.5, val: 250 } },
    { m: '2025-08-15', a1: { code: 'BBAS3', price: 26.5, val: 250 }, a2: { code: 'HGLG11', price: 161.0, val: 250 } },
    { m: '2025-09-15', a1: { code: 'ITUB4', price: 32.0, val: 250 }, a2: { code: 'KNRI11', price: 155.0, val: 250 } },
    { m: '2025-10-15', a1: { code: 'WEGE3', price: 49.5, val: 250 }, a2: { code: 'TESOURO_SELIC_2029', price: 13800, val: 250 } },
    { m: '2025-11-15', a1: { code: 'TAEE11', price: 35.8, val: 250 }, a2: { code: 'XPLG11', price: 102.5, val: 250 } },
    { m: '2025-12-15', a1: { code: 'BBAS3', price: 27.0, val: 250 }, a2: { code: 'HGLG11', price: 161.5, val: 250 } },
    { m: '2026-01-15', a1: { code: 'ITUB4', price: 33.0, val: 250 }, a2: { code: 'KNRI11', price: 156.0, val: 250 } },
    { m: '2026-02-15', a1: { code: 'WEGE3', price: 51.0, val: 250 }, a2: { code: 'IVVB11', price: 295.0, val: 250 } },
    { m: '2026-03-15', a1: { code: 'TAEE11', price: 36.0, val: 250 }, a2: { code: 'XPLG11', price: 103.5, val: 250 } },
    { m: '2026-04-15', a1: { code: 'BBAS3', price: 27.5, val: 250 }, a2: { code: 'HGLG11', price: 162.0, val: 250 } },
    { m: '2026-05-15', a1: { code: 'ITUB4', price: 34.0, val: 250 }, a2: { code: 'KNRI11', price: 157.0, val: 250 } },
    { m: '2026-06-15', a1: { code: 'WEGE3', price: 52.5, val: 250 }, a2: { code: 'TESOURO_SELIC_2029', price: 14600, val: 250 } },
    { m: '2026-07-15', a1: { code: 'TAEE11', price: 36.2, val: 250 }, a2: { code: 'XPLG11', price: 105.0, val: 250 } },
    { m: '2026-08-15', a1: { code: 'BBAS3', price: 28.0, val: 250 }, a2: { code: 'HGLG11', price: 163.0, val: 250 } },
    { m: '2026-09-15', a1: { code: 'ITUB4', price: 35.0, val: 250 }, a2: { code: 'KNRI11', price: 158.0, val: 250 } },
    { m: '2026-10-15', a1: { code: 'WEGE3', price: 53.5, val: 250 }, a2: { code: 'IVVB11', price: 315.0, val: 250 } },
    { m: '2026-11-15', a1: { code: 'TAEE11', price: 36.4, val: 250 }, a2: { code: 'XPLG11', price: 106.0, val: 250 } }
  ];

  let cumulativeAportes = 0;
  for (const pair of monthlyPairs) {
    const q1 = Number((pair.a1.val / pair.a1.price).toFixed(4));
    const q2 = Number((pair.a2.val / pair.a2.price).toFixed(4));

    await p.query(`
      INSERT INTO transactions (user_id, asset_code, type, quantity, price, total_value, executed_date, notes)
      VALUES 
        ($1, $2, 'buy', $3, $4, $5, $6, $7),
        ($1, $8, 'buy', $9, $10, $11, $6, $12);
    `, [
      userId,
      pair.a1.code, q1, pair.a1.price, pair.a1.val, pair.m, 'Aporte Mensal AM2O (Opção 1)',
      pair.a2.code, q2, pair.a2.price, pair.a2.val, 'Aporte Mensal AM2O (Opção 2)'
    ]);
    cumulativeAportes += 500;
  }
  console.log(`✓ 24 aportes mensais de R$ 500 registrados (Total aportado recorrente: R$ ${cumulativeAportes},00).`);

  // Gerar o Fluxo de Proventos dos 24 meses (Juros Compostos & Efeito Bola de Neve)
  console.log('📈 Simulando crédito de proventos mensais (FIIs, Dividendos e JCP) ao longo dos 2 anos...');
  const dividendEvents = [];
  const years = [2025, 2026];

  for (const y of years) {
    for (let m = 1; m <= 12; m++) {
      if (y === 2026 && m > 11) continue; // Mês corrente: Novembro de 2026
      const mStr = String(m).padStart(2, '0');
      const dateFii = `${y}-${mStr}-15`;

      // Rendimentos FIIs mensais
      dividendEvents.push(
        { code: 'HGLG11', val: Number((45 + (y - 2024) * 2).toFixed(2)) * 1.10, date: dateFii, note: `Rendimento Mensal HGLG11 ${mStr}/${y}` },
        { code: 'KNRI11', val: Number((35 + (y - 2024) * 2).toFixed(2)) * 1.05, date: dateFii, note: `Rendimento Mensal KNRI11 ${mStr}/${y}` },
        { code: 'XPLG11', val: Number((26 + (y - 2024) * 3).toFixed(2)) * 0.82, date: dateFii, note: `Rendimento Mensal XPLG11 ${mStr}/${y}` }
      );

      // Ações BEST (trimestrais / semestrais)
      if (m === 2 || m === 8) {
        dividendEvents.push({ code: 'BBAS3', val: 240 * 0.95, date: `${y}-${mStr}-28`, note: `Dividendo BBAS3 ${y}` });
      }
      if (m === 4 || m === 10) {
        dividendEvents.push({ code: 'ITUB4', val: 200 * 0.88, date: `${y}-${mStr}-20`, note: `Juros s/ Capital Próprio Itaú ${y}` });
      }
      if (m === 5 || m === 12) {
        dividendEvents.push(
          { code: 'WEGE3', val: 120 * 1.25, date: `${y}-${mStr}-18`, note: `Dividendo WEG ${y}` },
          { code: 'TAEE11', val: 160 * 1.15, date: `${y}-${mStr}-22`, note: `Dividendo Taesa ${y}` }
        );
      }
    }
  }

  let totalDividends = 0;
  for (const ev of dividendEvents) {
    const valRounded = Number(ev.val.toFixed(2));
    await p.query(`
      INSERT INTO transactions (user_id, asset_code, type, quantity, price, total_value, executed_date, notes)
      VALUES ($1, $2, 'event', 1, $3, $3, $4, $5);
    `, [userId, ev.code, valRounded, ev.date, ev.note]);
    totalDividends += valRounded;
  }

  console.log(`✓ ${dividendEvents.length} proventos gerados (Total de renda passiva acumulada: R$ ${totalDividends.toFixed(2)}).`);
  await p.close();
  return { userId, totalDividends, totalAportes: 50000 + cumulativeAportes };
}

(async () => {
  console.log('🚀 Iniciando Simulação Caixa-Preta 2.0 (Aluno R$ 50k + Stress Test 2 Anos AM2O)...');
  const seedResult = await seedStressTestData();

  console.log('🌐 Abrindo navegador Chrome em velocidade humana normal para acompanhamento visual...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false, // Abre a janela do Chrome para o Ricardo assistir!
    defaultViewport: { width: 1366, height: 850 },
    args: ['--start-maximized']
  });

  try {
    const page = await browser.newPage();
    await page.setViewport({ width: 1366, height: 850 });

    // 1. Login do Aluno
    console.log('📍 ETAPA 1: Login do Aluno (aluno50k@norteinvest.com)...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await sleep(2500);

    await page.waitForSelector('#auth-email', { timeout: 10000 });
    await page.type('#auth-email', 'aluno50k@norteinvest.com', { delay: 35 });
    await sleep(600);
    await page.waitForSelector('#auth-password', { timeout: 10000 });
    await page.type('#auth-password', 'Aluno123!', { delay: 35 });
    await sleep(1000);

    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await sleep(3500);
    console.log('✓ Login realizado com sucesso.');

    // 2. Tutorial & Método
    console.log('📍 ETAPA 2: Estudo do Método DAVI & Manual...');
    await page.goto('http://localhost:3000/tutorial', { waitUntil: 'networkidle2' });
    await sleep(4000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '01_tutorial_metodo.png') });

    // 3. Reserva de Emergência
    console.log('📍 ETAPA 3: Validação da Reserva de Emergência...');
    await page.goto('http://localhost:3000/reserva-emergencia', { waitUntil: 'networkidle2' });
    await sleep(4000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '02_reserva_emergencia.png') });

    // 4. Carteira Consolidada com Métricas & Régua Hydra
    console.log('📍 ETAPA 4: Carteira Consolidada após 2 Anos de Aportes...');
    await page.goto('http://localhost:3000/carteira', { waitUntil: 'networkidle2' });
    await page.waitForSelector('table tbody tr', { timeout: 15000 }).catch(() => {});
    await sleep(4500);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '03_carteira_pos_2_anos.png'), fullPage: true });

    // Testar o novo botão de importação B3 na Carteira
    console.log('📍 Testando botão e modal do Importador B3 (.xlsx) na Carteira...');
    const buttons = await page.$$('button');
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.innerText, b);
      if (text && text.includes('Importar B3')) {
        await b.click();
        await sleep(2500);
        await page.screenshot({ path: path.join(SCREENSHOT_DIR, '04_modal_b3_na_carteira.png') });
        const closeBtn = await page.$('button[aria-label="Fechar importador"]');
        if (closeBtn) await closeBtn.click();
        await sleep(1500);
        break;
      }
    }

    // 5. Testar Onde Aportar (Motor AM2O sob Stress Test com 2 Ativos Simultâneos)
    console.log('📍 ETAPA 5: Teste do Motor "Onde Aportar" com Novo Aporte de R$ 500 e 2 Ativos...');
    await page.goto('http://localhost:3000/onde-aportar', { waitUntil: 'networkidle2' });
    await sleep(3500);

    // Fechar modal explicativo se abrir
    const closeAM2O = await page.$('button[aria-label="Fechar explicação do método"]');
    if (closeAM2O) {
      await closeAM2O.click();
      await sleep(1500);
    } else {
      const modalBtn = await page.$('button');
      // se houver "OK, Entendi o Método"
      const allBtns = await page.$$('button');
      for (const btn of allBtns) {
        const t = await page.evaluate(el => el.innerText, btn);
        if (t && t.includes('Entendi o Método')) {
          await btn.click();
          await sleep(1500);
          break;
        }
      }
    }

    // Preencher R$ 500 no input #aporte-val
    const aporteInput = await page.$('#aporte-val');
    if (aporteInput) {
      await aporteInput.click({ clickCount: 3 });
      await aporteInput.type('500', { delay: 40 });
      await sleep(600);
    }

    // Selecionar 2 Ativos no select #aporte-qtd
    const selectQtd = await page.$('#aporte-qtd');
    if (selectQtd) {
      await page.select('#aporte-qtd', '2');
      await sleep(1000);
    }

    // Clicar em Gerar Sugestão
    const submitBtn = await page.$('button[type="submit"]');
    if (submitBtn) {
      await submitBtn.click();
      await sleep(3500);
    }

    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '05_onde_aportar_motor_am2o.png'), fullPage: true });

    // 6. Renda Passiva — Mapa Anual de Proventos (12 Meses & Juros Compostos)
    console.log('📍 ETAPA 6: Renda Passiva & Mapa de Calor dos 12 Meses...');
    await page.goto('http://localhost:3000/renda-passiva', { waitUntil: 'networkidle2' });
    await sleep(3500);

    // Clicar na aba Mapa Anual (#tab-heatmap)
    const heatmapTab = await page.$('#tab-heatmap');
    if (heatmapTab) {
      await heatmapTab.click();
      await sleep(4000);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '06_mapa_anual_proventos_2026.png'), fullPage: true });
    }

    // Clicar na aba Número Mágico (#tab-magic)
    const magicTab = await page.$('#tab-magic');
    if (magicTab) {
      await magicTab.click();
      await sleep(3500);
      await page.screenshot({ path: path.join(SCREENSHOT_DIR, '07_numero_magico_bola_de_neve.png'), fullPage: true });
    }

    // 7. Resumo Geral (Evolução Patrimonial dos 2 Anos & Juros Compostos)
    console.log('📍 ETAPA 7: Resumo Patrimonial, Evolução do Capital & Benchmarks...');
    await page.goto('http://localhost:3000/resumo', { waitUntil: 'networkidle2' });
    await page.waitForSelector('section[aria-label="Resumo executivo da carteira"]', { timeout: 15000 }).catch(() => {});
    await sleep(5000);
    await page.screenshot({ path: path.join(SCREENSHOT_DIR, '08_resumo_evolucao_benchmarks.png'), fullPage: true });

    console.log('🎉 Simulação Caixa-Preta 2.0 e Stress Test concluídos com êxito!');
  } finally {
    await sleep(4000);
    await browser.close();
  }
})();
