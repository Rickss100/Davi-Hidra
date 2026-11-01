import puppeteer from 'puppeteer-core';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\ricks\\.gemini\\antigravity\\brain\\9cbf9a46-d361-46c0-b285-1126c4a67692\\scratch\\student_simulation';
const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function runStudentSimulation() {
  console.log('================================================================');
  console.log('🚀 INICIANDO SIMULADOR DE ALUNO NORTE INVEST (R$ 50 MIL)');
  console.log('   Modo: Janela Visível | Velocidade Humana Normal');
  console.log('================================================================\n');

  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false, // Abre o navegador na tela para o usuário acompanhar
    defaultViewport: null,
    args: ['--start-maximized', '--window-size=1400,900', '--disable-infobars']
  });

  const [page] = await browser.pages();
  await page.setViewport({ width: 1400, height: 900 });

  try {
    // -------------------------------------------------------------
    // ETAPA 1: Login do Aluno
    // -------------------------------------------------------------
    console.log('📍 ETAPA 1: Acessando http://localhost:3000/login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await sleep(2500);

    const shot1 = path.join(SCREENSHOT_DIR, '01_login_screen.png');
    await page.screenshot({ path: shot1 });
    console.log('📸 Screenshot salvo: 01_login_screen.png');

    console.log('⌨️ Preenchendo credenciais do Aluno (ia@norteinvest.com)...');
    await page.waitForSelector('#auth-email', { timeout: 10000 });
    await page.type('#auth-email', 'ia@norteinvest.com', { delay: 40 });
    await sleep(800);
    await page.waitForSelector('#auth-password', { timeout: 10000 });
    await page.type('#auth-password', 'IA123456', { delay: 40 });
    await sleep(1200);

    console.log('👉 Clicando em Entrar na Conta...');
    await page.click('button[type="submit"]');
    
    // Aguarda a barra lateral ou a Home carregar
    console.log('⏳ Aguardando autenticação e carregamento do Dashboard...');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {});
    await sleep(3500);

    const shot2 = path.join(SCREENSHOT_DIR, '02_home_after_login.png');
    await page.screenshot({ path: shot2 });
    console.log('📸 Screenshot salvo: 02_home_after_login.png');

    // -------------------------------------------------------------
    // ETAPA 2: Estudo das Aulas em Tutorial & Método
    // -------------------------------------------------------------
    console.log('\n📍 ETAPA 2: Navegando para Tutorial & Método (/tutorial)...');
    await page.goto('http://localhost:3000/tutorial', { waitUntil: 'networkidle2' });
    await sleep(3000);

    // Rola suavemente para inspecionar os pilares D-A-V-I
    await page.evaluate(() => window.scrollBy({ top: 400, behavior: 'smooth' }));
    await sleep(2500);

    const shot3 = path.join(SCREENSHOT_DIR, '03_tutorial_methodology.png');
    await page.screenshot({ path: shot3 });
    console.log('📸 Screenshot salvo: 03_tutorial_methodology.png');

    // Clica na aba da Academia de Aulas se houver
    const tabs = await page.$$('button');
    for (const tab of tabs) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.includes('Academia')) {
        console.log('👉 Clicando na aba da Academia Norte Invest...');
        await tab.click();
        await sleep(2500);
        break;
      }
    }
    const shot4 = path.join(SCREENSHOT_DIR, '04_academy_curriculum.png');
    await page.screenshot({ path: shot4 });
    console.log('📸 Screenshot salvo: 04_academy_curriculum.png');

    // -------------------------------------------------------------
    // ETAPA 3: Defesa — Reserva de Emergência
    // -------------------------------------------------------------
    console.log('\n📍 ETAPA 3: Navegando para Reserva de Emergência (/reserva-emergencia)...');
    await page.goto('http://localhost:3000/reserva-emergencia', { waitUntil: 'networkidle2' });
    await sleep(3000);

    const shot5 = path.join(SCREENSHOT_DIR, '05_reserva_emergencia.png');
    await page.screenshot({ path: shot5 });
    console.log('📸 Screenshot salvo: 05_reserva_emergencia.png');

    // Preenche custo de vida (R$ 3.000) e meses (6 meses)
    console.log('⚙️ Configurando Reserva de Emergência (R$ 3.000/mês × 6 meses = R$ 18.000)...');
    const inputs = await page.$$('input[type="number"], input[type="text"]');
    if (inputs.length >= 2) {
      await inputs[0].click({ clickCount: 3 });
      await inputs[0].type('3000', { delay: 50 });
      await sleep(1000);
    }

    // Salva a configuração
    const saveButtons = await page.$$('button');
    for (const btn of saveButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('Salvar') || text.includes('Confirmar') || text.includes('Atualizar'))) {
        console.log('👉 Salvando parâmetros da Reserva de Emergência...');
        await btn.click();
        await sleep(2500);
        break;
      }
    }

    const shot6 = path.join(SCREENSHOT_DIR, '06_reserva_saved.png');
    await page.screenshot({ path: shot6 });
    console.log('📸 Screenshot salvo: 06_reserva_saved.png');

    // -------------------------------------------------------------
    // ETAPA 4: Planejamento Macro — Definir Objetivos
    // -------------------------------------------------------------
    console.log('\n📍 ETAPA 4: Navegando para Definir Objetivos (/definir-objetivos)...');
    await page.goto('http://localhost:3000/definir-objetivos', { waitUntil: 'networkidle2' });
    await sleep(3000);

    const shot7 = path.join(SCREENSHOT_DIR, '07_definir_objetivos.png');
    await page.screenshot({ path: shot7 });
    console.log('📸 Screenshot salvo: 07_definir_objetivos.png');

    // Clica no modelo Brasil + EUA ou salva a distribuição
    const objButtons = await page.$$('button');
    for (const btn of objButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('Global') || text.includes('Brasil + EUA') || text.includes('Modelo'))) {
        console.log('👉 Selecionando modelo de alocação macro Global...');
        await btn.click();
        await sleep(2000);
        break;
      }
    }

    for (const btn of objButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && text.includes('Salvar Metas')) {
        console.log('👉 Salvando Metas Macro...');
        await btn.click();
        await sleep(2500);
        break;
      }
    }

    const shot8 = path.join(SCREENSHOT_DIR, '08_objetivos_salvos.png');
    await page.screenshot({ path: shot8 });
    console.log('📸 Screenshot salvo: 08_objetivos_salvos.png');

    // -------------------------------------------------------------
    // ETAPA 5: Radar de Ativos com Filtros do Método DAVI
    // -------------------------------------------------------------
    console.log('\n📍 ETAPA 5: Navegando para o Radar de Ativos (/radar)...');
    await page.goto('http://localhost:3000/radar?type=acoes', { waitUntil: 'networkidle2' });
    await sleep(3500);

    const shot9 = path.join(SCREENSHOT_DIR, '09_radar_initial.png');
    await page.screenshot({ path: shot9 });
    console.log('📸 Screenshot salvo: 09_radar_initial.png');

    // Clica no chip Setores Perenes (BEST)
    console.log('👉 Ativando Chip: ⚡ Setores Perenes (BEST)...');
    const chipButtons = await page.$$('button');
    for (const chip of chipButtons) {
      const text = await page.evaluate(el => el.textContent, chip);
      if (text && text.includes('BEST')) {
        await chip.click();
        await sleep(2500);
        break;
      }
    }

    // Clica no chip Novo Mercado
    console.log('👉 Ativando Chip: 🛡️ Novo Mercado...');
    for (const chip of chipButtons) {
      const text = await page.evaluate(el => el.textContent, chip);
      if (text && text.includes('Novo Mercado')) {
        await chip.click();
        await sleep(2500);
        break;
      }
    }

    const shot10 = path.join(SCREENSHOT_DIR, '10_radar_best_filtered.png');
    await page.screenshot({ path: shot10 });
    console.log('📸 Screenshot salvo: 10_radar_best_filtered.png');

    // Alterna para aba FIIs BR
    console.log('👉 Alternando para aba FIIs BR...');
    for (const tab of chipButtons) {
      const text = await page.evaluate(el => el.textContent, tab);
      if (text && text.trim() === 'FIIs BR') {
        await tab.click();
        await sleep(3000);
        break;
      }
    }

    // Ativa chips de FIIs
    console.log('👉 Ativando Chips: 🏢 FIIs Multiativo (>5) e 🎯 P/VP Inteligente...');
    const fiiChips = await page.$$('button');
    for (const chip of fiiChips) {
      const text = await page.evaluate(el => el.textContent, chip);
      if (text && (text.includes('Multiativo') || text.includes('P/VP Inteligente'))) {
        await chip.click();
        await sleep(1500);
      }
    }
    await sleep(2000);

    const shot11 = path.join(SCREENSHOT_DIR, '11_radar_fiis_filtered.png');
    await page.screenshot({ path: shot11 });
    console.log('📸 Screenshot salvo: 11_radar_fiis_filtered.png');

    // -------------------------------------------------------------
    // ETAPA 6: Onde Aportar & Ponto Mágico
    // -------------------------------------------------------------
    console.log('\n📍 ETAPA 6: Navegando para Onde Aportar (/onde-aportar)...');
    await page.goto('http://localhost:3000/onde-aportar', { waitUntil: 'networkidle2' });
    await sleep(3500);

    // Fecha modal de aviso caso apareça
    const modalButtons = await page.$$('button');
    for (const btn of modalButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('Entendi') || text.includes('Prosseguir') || text.includes('Fechar'))) {
        await btn.click();
        await sleep(1500);
        break;
      }
    }

    // Informa valor de aporte: R$ 5.000,00
    console.log('💰 Informando aporte inicial de R$ 5.000,00...');
    const aporteInput = await page.$('input.money-value, input[type="text"]');
    if (aporteInput) {
      await aporteInput.click({ clickCount: 3 });
      await aporteInput.type('5000', { delay: 50 });
      await sleep(1000);
    }

    // Clica em Gerar Sugestão
    const simButtons = await page.$$('button');
    for (const btn of simButtons) {
      const text = await page.evaluate(el => el.textContent, btn);
      if (text && (text.includes('Gerar Sugestão') || text.includes('Calcular'))) {
        console.log('👉 Clicando em Gerar Sugestão de Aporte...');
        await btn.click();
        await sleep(4000);
        break;
      }
    }

    // Rola para a tabela de ordens sugeridas
    await page.evaluate(() => window.scrollBy({ top: 350, behavior: 'smooth' }));
    await sleep(3500);

    const shot12 = path.join(SCREENSHOT_DIR, '12_onde_aportar_suggestions.png');
    await page.screenshot({ path: shot12 });
    console.log('📸 Screenshot salvo: 12_onde_aportar_suggestions.png');

    console.log('\n✨ Simulação visual concluída com sucesso!');
    console.log('Aguardando 5 segundos na tela final para acompanhamento...');
    await sleep(5000);

  } catch (err) {
    console.error('❌ Erro durante a simulação:', err);
  } finally {
    console.log('🔒 Encerrando sessão do navegador...');
    await browser.close();
    console.log('✅ Navegador fechado.');
  }
}

runStudentSimulation();
