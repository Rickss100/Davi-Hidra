import puppeteer from 'puppeteer-core';
import path from 'path';

const SCREENSHOT_DIR = 'C:\\Users\\ricks\\.gemini\\antigravity\\brain\\9cbf9a46-d361-46c0-b285-1126c4a67692\\scratch\\student_simulation';

async function main() {
  const browser = await puppeteer.launch({
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
    headless: false,
    defaultViewport: { width: 1400, height: 900 },
    args: ['--window-size=1400,900']
  });

  const [page] = await browser.pages();

  try {
    console.log('Autenticando...');
    await page.goto('http://localhost:3000/login', { waitUntil: 'networkidle2' });
    await page.waitForSelector('#auth-email');
    await page.type('#auth-email', 'ia@norteinvest.com', { delay: 20 });
    await page.type('#auth-password', 'IA123456', { delay: 20 });
    await page.click('button[type="submit"]');
    await page.waitForNavigation({ waitUntil: 'networkidle2', timeout: 10000 }).catch(() => {});

    console.log('Navegando para /admin/docs...');
    await page.goto('http://localhost:3000/admin/docs', { waitUntil: 'networkidle2' });
    await new Promise(r => setTimeout(r, 4000));

    const shotPath = path.join(SCREENSHOT_DIR, 'swagger_docs_screen.png');
    await page.screenshot({ path: shotPath, fullPage: false });
    console.log('Screenshot salvo em:', shotPath);
  } finally {
    await browser.close();
  }
}

main().catch(console.error);
