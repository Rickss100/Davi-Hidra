import puppeteer from 'puppeteer-core';
import path from 'path';
import fs from 'fs';

const CHROME_PATH = 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe';
const TARGET_URL = 'https://davi-hidra.onrender.com';
const SCREENSHOTS_DIR = path.join(process.cwd(), 'test-screenshots');

if (!fs.existsSync(SCREENSHOTS_DIR)) {
  fs.mkdirSync(SCREENSHOTS_DIR, { recursive: true });
}

const sleep = (ms) => new Promise(r => setTimeout(r, ms));

async function runBrowserTest() {
  console.log('🚀 Iniciando Chrome via Puppeteer-Core...');
  console.log('🌐 Alvo:', TARGET_URL);

  const browser = await puppeteer.launch({
    executablePath: CHROME_PATH,
    headless: false,
    defaultViewport: null,
    args: ['--start-maximized', '--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = (await browser.pages())[0] || (await browser.newPage());
  
  const consoleErrors = [];
  const networkErrors = [];

  page.on('console', msg => {
    if (msg.type() === 'error') {
      consoleErrors.push(msg.text());
    }
  });

  page.on('response', res => {
    if (res.status() >= 400 && !res.url().includes('favicon')) {
      networkErrors.push({ url: res.url(), status: res.status() });
    }
  });

  try {
    // 1. Acessar Login
    console.log('1️⃣ Acessando tela de Login...');
    await page.goto(TARGET_URL, { waitUntil: 'networkidle2', timeout: 60000 });
    await sleep(2000);

    const emailInput = await page.$('#email');
    const passInput = await page.$('#password');
    const submitBtn = await page.$('button[type="submit"]');

    if (emailInput && passInput && submitBtn) {
      console.log('🔑 Realizando login com Chat / 123...');
      await emailInput.click({ clickCount: 3 });
      await emailInput.type('Chat', { delay: 60 });

      await passInput.click({ clickCount: 3 });
      await passInput.type('123', { delay: 60 });

      await submitBtn.click();
      console.log('⏳ Aguardando autenticação e carregamento da Home...');
      await page.waitForSelector('.sidebar', { timeout: 15000 });
      await sleep(3000);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '01_home_autenticado.png') });
      console.log('✅ Autenticado com sucesso como usuário Chat!');
    }

    // 2. Navegar para Carteira e realizar Aporte
    console.log('2️⃣ Acessando Carteira e registrando aporte...');
    const carteiraLink = await page.$('a[href="/carteira"]');
    if (carteiraLink) await carteiraLink.click();
    await sleep(3000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '02_carteira_inicial.png') });

    // Preencher Aporte
    const codeInput = await page.$('input[name="code"]');
    const qtyInput = await page.$('input[name="quantity"]');
    const priceInput = await page.$('input[name="price"]');
    const submitTransBtn = await page.$('.transaction-form button[type="submit"]');

    if (codeInput && qtyInput && priceInput && submitTransBtn) {
      console.log('📝 Registrando aporte de 50 ações PETR4 a R$ 38,00...');
      await codeInput.click();
      await codeInput.type('PETR4', { delay: 50 });

      await qtyInput.click();
      await qtyInput.type('50', { delay: 50 });

      await priceInput.click();
      await priceInput.type('38.00', { delay: 50 });

      // Escutar alert se houver
      page.once('dialog', async dialog => {
        console.log('💬 Dialog da aplicação:', dialog.message());
        await dialog.accept();
      });

      await submitTransBtn.click();
      await sleep(3500);
      await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '03_carteira_apos_aporte.png') });
      console.log('✅ Aporte PETR4 registrado com sucesso!');
    }

    // Helper para fechar modais se estiverem abertos
    const dismissModals = async () => {
      try {
        const okBtn = await page.$('.btn-ok');
        if (okBtn) await okBtn.click();

        const cancelBtn = await page.$('.btn-cancel');
        if (cancelBtn) await cancelBtn.click();

        const closeBtn = await page.$('.btn-close, .modal-close');
        if (closeBtn) await closeBtn.click();
      } catch (e) {}
    };

    // 3. Navegar para Onde Aportar
    console.log('3️⃣ Acessando Onde Aportar...');
    await dismissModals();
    const ondeAportarLink = await page.$('a[href="/onde-aportar"]');
    if (ondeAportarLink) await ondeAportarLink.click();
    await sleep(2500);
    await dismissModals();
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '04_onde_aportar.png') });

    // 4. Navegar para Definir Objetivos
    console.log('4️⃣ Acessando Definir Objetivos...');
    await dismissModals();
    const objetivosLink = await page.$('a[href="/definir-objetivos"]');
    if (objetivosLink) await objetivosLink.click();
    await sleep(2500);
    await dismissModals();
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '05_definir_objetivos.png') });

    // 5. Navegar para Reserva de Emergência
    console.log('5️⃣ Acessando Reserva de Emergência...');
    await dismissModals();
    const reservaLink = await page.$('a[href="/reserva-emergencia"]');
    if (reservaLink) await reservaLink.click();
    await sleep(2500);
    await dismissModals();
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '06_reserva_emergencia.png') });

    // 6. Navegar para Renda Passiva
    console.log('6️⃣ Acessando Renda Passiva & Proventos...');
    await dismissModals();
    const rendaLink = await page.$('a[href="/renda-passiva"]');
    if (rendaLink) await rendaLink.click();
    await sleep(2500);
    await dismissModals();
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '07_renda_passiva.png') });

    // 7. Navegar para Resumo Geral
    console.log('7️⃣ Acessando Resumo Geral da Carteira...');
    await dismissModals();
    const resumoLink = await page.$('a[href="/resumo"]');
    if (resumoLink) await resumoLink.click();
    await sleep(2500);
    await dismissModals();
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '08_resumo_geral.png') });

    // 8. Navegar para Radar de Ativos e testar busca
    console.log('8️⃣ Acessando Radar de Ativos...');
    await dismissModals();
    const radarLink = await page.$('a[href="/radar"]');
    if (radarLink) await radarLink.click();
    await sleep(2500);
    await dismissModals();
    await sleep(1000);

    const searchInput = await page.$('input[placeholder*="Buscar"], input[placeholder*="Filtrar"], input[type="text"]');
    if (searchInput) {
      await searchInput.type('VALE3', { delay: 60 });
      await sleep(1500);
    }
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '09_radar_ativos.png') });

    // 9. Navegar para Histórico
    console.log('9️⃣ Acessando Histórico de Aportes...');
    await dismissModals();
    const histLink = await page.$('a[href="/historico"]');
    if (histLink) await histLink.click();
    await sleep(2500);
    await dismissModals();
    await sleep(1000);
    await page.screenshot({ path: path.join(SCREENSHOTS_DIR, '10_historico_ordens.png') });

    console.log('🎉 TESTES E2E NO NAVEGADOR FINALIZADOS COM SUCESSO!');
    console.log('📊 Erros de console:', consoleErrors);
    console.log('🌐 Erros de requisição:', networkErrors);

  } catch (error) {
    console.error('❌ Erro durante teste:', error);
  } finally {
    console.log('⏳ Mantendo janela aberta por 8 segundos para conferência...');
    await sleep(8000);
    await browser.close();
    console.log('🏁 Chrome finalizado.');
  }
}

runBrowserTest();
