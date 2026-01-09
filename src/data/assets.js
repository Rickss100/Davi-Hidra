// Import CSV content as raw strings (Vite feature)
import acoesRaw from './acoes.csv?raw';
import fiisRaw from './fiis.csv?raw';
import ASSETS_JSON from './assets.json'; // Keep json as fallback or for Stocks/Reits

// Parser Utility
const parseCSV = (csvContent, type) => {
    if (!csvContent) return [];
    
    const lines = csvContent.split(/\r?\n/);
    // Find header line index (sometimes first line is empty or meta)
    // We assume header contains "Papel" or "Ticker" or "Ativo"
    // Or we just skip first line if it looks like a header
    
    // First line usually header
    // Detect delimiter: count commas vs semicolons in first non-empty line
    const firstLine = lines.find(l => l.trim().length > 0);
    if (!firstLine) return [];
    
    const delimiter = (firstLine.match(/;/g) || []).length > (firstLine.match(/,/g) || []).length ? ';' : ',';

    return lines.slice(1) // Skip header
        .filter(line => line.trim().length > 0)
        .map(line => {
            const cols = line.split(delimiter);
            const ticker = cols[0]?.trim().toUpperCase();
            
            // Basic Ticker Validation (4+ chars)
            if (!ticker || ticker.length < 4) return null;

            // Name is usually in col 1, Price in col 2 (fundamentus standard)
            // Cleanup name (remove quotes if any)
            let name = cols[1]?.replace(/['"]/g, '').trim() || ticker;

            return {
                ticker,
                name,
                type // Assign specific type
            };
        })
        .filter(Boolean); // Remove nulls
};

// Parse Lists
const AC_LIST_CSV = parseCSV(acoesRaw, 'ACAO');
const FII_LIST_CSV = parseCSV(fiisRaw, 'FII');

// Merge with JSON for other categories if needed (Stocks/Reits currently in JSON)
const ST_LIST = (ASSETS_JSON.stocks || []).map(a => ({ ...a, type: 'STOCK' }));
const RE_LIST = (ASSETS_JSON.reits || []).map(a => ({ ...a, type: 'REIT' }));

export const ASSETS_DB = [
    ...AC_LIST_CSV,
    ...FII_LIST_CSV,
    ...ST_LIST,
    ...RE_LIST
].sort((a, b) => a.ticker.localeCompare(b.ticker));

export const getAssetsByCategory = (category) => {
    if (category === 'acoes') return AC_LIST_CSV;
    if (category === 'fiis') return FII_LIST_CSV;
    if (category === 'stocks') return ST_LIST;
    if (category === 'reits') return RE_LIST;
    
    return ASSETS_DB;
};
