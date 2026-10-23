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

// Calculate passive income from event transactions with optional period filter
export const calculatePassiveIncome = (transactions, period = 'all') => {
  if (!transactions) return 0;

  const events = transactions.filter(tx => tx.type === 'event');
  if (events.length === 0) return 0;

  // Reference date: latest transaction date or today
  const now = new Date();

  return events
    .filter(tx => {
      if (! period || period === 'all') return true;
      if (!tx.date) return true;
      const txDate = new Date(tx.date + 'T12:00:00');
      if (isNaN(txDate.getTime())) return true;

      if (period === 'month') {
        return txDate.getMonth() === now.getMonth() && txDate.getFullYear() === now.getFullYear();
      }
      if (period === '90d') {
        const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);
        return diffDays >= -5 && diffDays <= 92;
      }
      if (period === '12m') {
        const diffDays = (now - txDate) / (1000 * 60 * 60 * 24);
        return diffDays >= -5 && diffDays <= 366;
      }
      return true;
    })
    .reduce((sum, tx) => sum + (Number(tx.total_value) || Number(tx.totalValue) || (Number(tx.quantity || 0) * Number(tx.price || 0)) || 0), 0);
};

// Group holdings by category with totals
export const getHoldingsSummary = (holdings, usdRate = 1) => {
  if (!holdings) return [];
  
  const categories = {
    acoes: 'Ações',
    fiis: 'FIIs',
    fixed: 'Renda Fixa',
    stocks: 'Stocks',
    reits: 'REITs'
  };
  
  return Object.entries(categories).map(([key, label]) => {
    const assets = (holdings[key] || []).filter(a => Number(a.quantity) > 0);
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
