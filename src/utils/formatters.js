// Format number as Brazilian currency
export const formatCurrency = (value) => {
  if (value === null || value === undefined || isNaN(value)) return 'R$ 0,00';
  
  return new Intl.NumberFormat('pt-BR', {
    style: 'currency',
    currency: 'BRL'
  }).format(value);
};

// Format percentage
export const formatPercent = (value) => {
  if (value === null || value === undefined || isNaN(value)) return '0%';
  return `${value.toFixed(2)}%`;
};

// Calculate total portfolio value from holdings
export const calculateTotalValue = (holdings) => {
  if (!holdings) return 0;
  
  return Object.values(holdings)
    .flat()
    .reduce((sum, asset) => {
      const qty = Number(asset.quantity) || 0;
      const price = Number(asset.currentPrice) || 0;
      return sum + (qty * price);
    }, 0);
};

// Calculate passive income from event transactions
export const calculatePassiveIncome = (transactions) => {
  if (!transactions) return 0;
  
  return transactions
    .filter(tx => tx.type === 'event')
    .reduce((sum, tx) => sum + (Number(tx.totalValue) || 0), 0);
};

// Group holdings by category with totals
export const getHoldingsSummary = (holdings) => {
  if (!holdings) return [];
  
  const categories = {
    acoes: 'Ações',
    fiis: 'FIIs',
    stocks: 'Stocks',
    reits: 'REITs'
  };
  
  return Object.entries(categories).map(([key, label]) => {
    const assets = holdings[key] || [];
    const total = assets.reduce((sum, asset) => {
      const qty = Number(asset.quantity) || 0;
      const price = Number(asset.currentPrice) || 0;
      return sum + (qty * price);
    }, 0);
    
    return {
      category: key,
      label,
      count: assets.length,
      total
    };
  }).filter(item => item.count > 0);
};
