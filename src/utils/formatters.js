// Format number as Brazilian currency
export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

export const formatUSD = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'US$ 0,00';
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD'
  }).format(value);
};

// Format percentage
export const formatPercent = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return value.toFixed(2) + '%';
};

// Calculate total portfolio value from holdings
export const calculateTotalValue = (holdings, usdRate = 1) => {
  if (!holdings) return 0;
  
  let total = 0;
  Object.keys(holdings).forEach(cat => {
    const isUs = cat === 'stocks' || cat === 'reits';
    holdings[cat].forEach(asset => {
      const qty = Number(asset.quantity) || 0;
      const price = Number(asset.currentPrice) || 0;
      const val = qty * price;
      total += isUs ? val * usdRate : val;
    });
  });
  return total;
};

// Calculate passive income from event transactions
export const calculatePassiveIncome = (transactions) => {
  if (!transactions) return 0;
  
  return transactions
    .filter(tx => tx.type === 'event')
    .reduce((sum, tx) => sum + (Number(tx.totalValue) || 0), 0);
};

// Group holdings by category with totals
export const getHoldingsSummary = (holdings, usdRate = 1) => {
  if (!holdings) return [];
  
  const categories = {
    acoes: 'Ações',
    fiis: 'FIIs',
    stocks: 'Stocks',
    reits: 'REITs'
  };
  
  return Object.entries(categories).map(([key, label]) => {
    const assets = holdings[key] || [];
    const isUs = key === 'stocks' || key === 'reits';
    const total = assets.reduce((sum, asset) => {
      const qty = Number(asset.quantity) || 0;
      const price = Number(asset.currentPrice) || 0;
      const val = qty * price;
      return sum + (isUs ? val * usdRate : val);
    }, 0);
    
    return {
      category: key,
      label,
      count: assets.length,
      total
    };
  }).filter(item => item.count > 0);
};
