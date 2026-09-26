import Database from 'better-sqlite3';

const db = new Database('investment-data.db');

const testCodes = [
  'CDB_LIQ_DIARIA', 'TESOURO_SELIC_2027', 'TESOURO_IPCA_2035', 'LCI_DI_95',
  'ALZR11', 'BTLG11', 'CPTS11', 'BTCI11', 'AFHI11', 'BCIA11', 'TGAR11', 'XPML11',
  'GRND3', 'GMAT3', 'DEXP3', 'CEBR3', 'ALLD3', 'BBAS3', 'ALUP11', 'ABCB4', 'ABEV3', 'VALE3', 'ITUB4',
  'ACN', 'AFL', 'CINF', 'EOG', 'FIS', 'AAPL', 'MSFT', 'GOOGL', 'AMZN', 'NVDA', 'JNJ', 'PG',
  'O', 'AMH', 'ADC', 'AIV', 'VICI', 'STAG', 'PLD', 'DLR', 'AMT'
];

for (const code of testCodes) {
  const asset = db.prepare(`
    SELECT a.code, a.name, a.type, p.close 
    FROM assets a 
    LEFT JOIN prices p ON a.code = p.asset_code 
    WHERE a.code = ?
  `).get(code);

  if (asset) {
    console.log(`[OK] ${code.padEnd(18)} | Tipo: ${asset.type.padEnd(10)} | Preço: R$ ${asset.close}`);
  } else {
    console.log(`[MISSING] ${code}`);
  }
}

db.close();
