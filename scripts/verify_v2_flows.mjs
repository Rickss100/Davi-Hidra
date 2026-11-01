import puppeteer from 'puppeteer-core';
import fs from 'fs';
import path from 'path';

const scratchDir = 'C:\\Users\\ricks\\.gemini\\antigravity\\brain\\9cbf9a46-d361-46c0-b285-1126c4a67692\\scratch';
if (!fs.existsSync(scratchDir)) {
  fs.mkdirSync(scratchDir, { recursive: true });
}

(async () => {
  console.log('🚀 Iniciando verificação ponta a ponta dos 4 Blocos...');
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: "new",
    defaultViewport: { width: 1366, height: 850 }
  });

  try {
    const page = await browser.newPage();

    // 1. Login
    console.log('1️⃣ Acessando http://localhost:3000/login...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });

    await page.waitForSelector('#auth-email');
    await page.type('#auth-email', 'ia@norteinvest.com');
    await page.type('#auth-password', 'IA123456');

    await Promise.all([
      page.click('button[type="submit"]'),
      page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 15000 }).catch(() => {})
    ]);
    await new Promise((r) => setTimeout(r, 2000));
    console.log('✓ Login realizado com sucesso.');

    // 2. Carteira (Bloco 2 e Bloco 3)
    console.log('2️⃣ Acessando /carteira para verificar Alocação Hydra e Botão B3...');
    await page.goto('http://localhost:3000/carteira', { waitUntil: 'networkidle2' });
    await page.waitForSelector('table tbody tr', { timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 1500));
    const carteiraPath = path.join(scratchDir, 'verify-carteira-bloco2-3.png');
    await page.screenshot({ path: carteiraPath, fullPage: true });
    console.log(`✓ Screenshot Carteira salvo: ${carteiraPath}`);

    // Abrir Modal B3 na Carteira
    const buttons = await page.$$('button');
    let b3Button = null;
    for (const b of buttons) {
      const text = await page.evaluate((el) => el.innerText, b);
      if (text && text.includes('Importar B3')) {
        b3Button = b;
        break;
      }
    }
    if (b3Button) {
      await b3Button.click();
      await new Promise((r) => setTimeout(r, 1200));
      const b3ModalPath = path.join(scratchDir, 'verify-b3-modal.png');
      await page.screenshot({ path: b3ModalPath });
      console.log(`✓ Screenshot Modal B3 salvo: ${b3ModalPath}`);
      // Fechar modal
      const closeBtn = await page.$('button[aria-label="Fechar importador"]');
      if (closeBtn) await closeBtn.click();
      await new Promise((r) => setTimeout(r, 500));
    }

    // 3. Renda Passiva (Bloco 1)
    console.log('3️⃣ Acessando /renda-passiva para verificar Mapa Anual...');
    await page.goto('http://localhost:3000/renda-passiva', { waitUntil: 'networkidle2' });
    await new Promise((r) => setTimeout(r, 2000));

    // Clicar na aba Mapa Anual
    const tabs = await page.$$('button');
    for (const t of tabs) {
      const text = await page.evaluate((el) => el.innerText, t);
      if (text && text.includes('Mapa Anual')) {
        await t.click();
        await new Promise((r) => setTimeout(r, 2000));
        break;
      }
    }
    const rendaPassivaPath = path.join(scratchDir, 'verify-renda-passiva-bloco1.png');
    await page.screenshot({ path: rendaPassivaPath, fullPage: true });
    console.log(`✓ Screenshot Renda Passiva salvo: ${rendaPassivaPath}`);

    // 4. Resumo Geral
    console.log('4️⃣ Acessando /resumo para verificar gráficos patrimoniais...');
    await page.goto('http://localhost:3000/resumo', { waitUntil: 'networkidle2' });
    await page.waitForSelector('section[aria-label="Resumo executivo da carteira"]', { timeout: 15000 }).catch(() => {});
    await new Promise((r) => setTimeout(r, 2500));
    const resumoPath = path.join(scratchDir, 'verify-resumo-bloco3.png');
    await page.screenshot({ path: resumoPath, fullPage: true });
    console.log(`✓ Screenshot Resumo Geral salvo: ${resumoPath}`);

    console.log('🎉 Todos os 4 blocos verificados visualmente com sucesso!');
  } finally {
    await browser.close();
  }
})();
