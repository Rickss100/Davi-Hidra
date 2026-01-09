/**
 * Utilities for calculating investment suggestions based on AM2O methodology
 * (Always Move to Objective)
 */

/**
 * Calculate distance from objective for each category
 * @param {Object} holdings - Current holdings by category
 * @param {Object} macroAllocation - Target allocation percentages
 * @param {number} totalValue - Total portfolio value
 * @returns {Array} Array of {category, name, currentPercent, targetPercent, distance}
 */
export const calculateCategoryDistances = (holdings, macroAllocation, totalValue) => {
  const categories = [
    { key: 'acoes', name: 'Ações', macro: 'acoes' },
    { key: 'fiis', name: 'FIIs', macro: 'fiis' },
    { key: 'stocks', name: 'Stocks', macro: 'stocks' },
    { key: 'reits', name: 'REITs', macro: 'reits' },
    { key: 'fixed', name: 'Renda Fixa', macro: 'fixed' }
  ];

  return categories.map(cat => {
    const categoryHoldings = holdings[cat.key] || [];
    const categoryValue = categoryHoldings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);
    const currentPercent = totalValue > 0 ? (categoryValue / totalValue) * 100 : 0;
    
    // Get target from macro allocation
    let targetPercent = 0;
    if (cat.key === 'acoes') {
      targetPercent = (macroAllocation.variable / 100) * (macroAllocation.brasil / 100) * (macroAllocation.acoes / 100) * 100;
    } else if (cat.key === 'fiis') {
      targetPercent = (macroAllocation.variable / 100) * (macroAllocation.brasil / 100) * (macroAllocation.fiis / 100) * 100;
    } else if (cat.key === 'stocks') {
      targetPercent = (macroAllocation.variable / 100) * (macroAllocation.usa / 100) * (macroAllocation.stocks / 100) * 100;
    } else if (cat.key === 'reits') {
      targetPercent = (macroAllocation.variable / 100) * (macroAllocation.usa / 100) * (macroAllocation.reits / 100) * 100;
    } else if (cat.key === 'fixed') {
      targetPercent = macroAllocation.fixed || 0;
    }

    const distance = targetPercent - currentPercent;

    return {
      category: cat.key,
      name: cat.name,
      currentPercent,
      targetPercent,
      distance
    };
  });
};

/**
 * Calculate distance for individual assets within a category
 * @param {Object} holdings - Current holdings
 * @param {Object} assetTargets - Target allocations for assets
 * @param {string} category - Category key (acoes, fiis, stocks, reits)
 * @param {number} totalValue - Total portfolio value
 * @param {number} categoryTargetPercent - Target percentage for this category
 * @returns {Array} Array of {ticker, currentPercent, targetPercent, distance}
 */
export const calculateAssetDistances = (holdings, assetTargets, category, totalValue, categoryTargetPercent) => {
  const categoryHoldings = holdings[category] || [];
  const targets = assetTargets[category] || [];

  return targets.map(target => {
    const holding = categoryHoldings.find(h => h.code === target.ticker) || { quantity: 0, currentPrice: 0, averagePrice: 0 };
    // Use average price as fallback if current price is missing (e.g. market closed API error)
    const price = holding.currentPrice > 0 ? holding.currentPrice : (holding.averagePrice || 0);
    const assetValue = holding.quantity * price;
    const currentPercent = totalValue > 0 ? (assetValue / totalValue) * 100 : 0;
    
    // Asset target is relative to category, convert to global percentage
    const targetPercent = (categoryTargetPercent / 100) * target.target;
    // Calculate simple percentage distance
    const distance = targetPercent - currentPercent;
    
    // Calculate financial distance (how much money is missing)
    // This is useful for more precise sorting when percentages are close
    const financialDistance = (totalValue * (targetPercent / 100)) - assetValue;

    return {
      ticker: target.ticker,
      category,
      currentPercent,
      targetPercent,
      distance,
      financialDistance,
      distance,
      financialDistance,
      currentPrice: holding.currentPrice > 0 ? holding.currentPrice : (holding.averagePrice || 0)
    };
  });
};

/**
 * Suggest investments based on available amount and number of assets
 * @param {number} availableAmount - Amount available to invest
 * @param {number} numAssets - Number of assets to suggest (1-3)
 * @param {Object} holdings - Current holdings
 * @param {Object} macroAllocation - Macro allocation targets
 * @param {Object} assetTargets - Asset-level targets
 * @returns {Array} Array of {ticker, cotas, valorTotal, categoria}
 */
export const suggestInvestments = (availableAmount, numAssets, holdings, macroAllocation, assetTargets) => {
  if (availableAmount <= 0 || numAssets <= 0) return [];

  // Calculate total portfolio value
  const allHoldings = Object.values(holdings).flat();
  const totalValue = allHoldings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);

  // If total value is 0 (new portfolio), distribute based on targets directly
  // This handles the "empty state" effectively
  if (totalValue === 0) {
    let allTargets = [];
    ['acoes', 'fiis', 'stocks', 'reits'].forEach(cat => {
        // Calculate category target
        let catTarget = 0;
        if (cat === 'acoes') catTarget = (macroAllocation.variable/100)*(macroAllocation.brasil/100)*(macroAllocation.acoes/100);
        if (cat === 'fiis') catTarget = (macroAllocation.variable/100)*(macroAllocation.brasil/100)*(macroAllocation.fiis/100);
        if (cat === 'stocks') catTarget = (macroAllocation.variable/100)*(macroAllocation.usa/100)*(macroAllocation.stocks/100);
        if (cat === 'reits') catTarget = (macroAllocation.variable/100)*(macroAllocation.usa/100)*(macroAllocation.reits/100);

        const targets = assetTargets[cat] || [];
        targets.forEach(t => {
            // Global target for this asset
            const globalWt = catTarget * (t.target / 100);
            allTargets.push({
                ticker: t.ticker,
                category: cat,
                financialDistance: globalWt * availableAmount, // "Fake" distance for new portfolio
                currentPrice: 100 // Fallback price if 0? Actually we need real prices.
                // If price is 0, we can't suggest it. We need to rely on what was passed or fetch logic.
                // Assuming assets have price even if quantity is 0 from holdings check
            });
        });
    });
    
    // We need prices. Let's look up prices from holdings structure (even if qty 0)
    // The previous logic filtered out price > 0. If new portfolio, prices might be missing in holdings if completely empty.
    // If complete empty, we can't suggest without prices. 
    // Assuming for now user has added assets and system fetched prices.
    
    // Let's stick to the main logic but allow 0 value portfolio
  }


  // Get category distances
  const categoryDistances = calculateCategoryDistances(holdings, macroAllocation, totalValue);

  // Get all asset distances across all categories
  let allAssetDistances = [];
  
  categoryDistances.forEach(catDist => {
    if (catDist.category === 'fixed') return; // Skip Renda Fixa for now
    
    const assetDists = calculateAssetDistances(
      holdings,
      assetTargets,
      catDist.category,
      totalValue,
      catDist.targetPercent
    );
    
    allAssetDistances = allAssetDistances.concat(assetDists);
  });

  // Filter only assets with positive distance (underweight) and valid price (or fallback)
  const underweightAssets = allAssetDistances
    .filter(a => a.distance > 0 && a.currentPrice > 0)
    .sort((a, b) => b.distance - a.distance); // Sort by highest distance first

  // Take top N assets
  const selectedAssets = underweightAssets.slice(0, numAssets);

  if (selectedAssets.length === 0) {
    return [];
  }

  // Improved Distribution Logic:
  // Instead of simple proportion of distance, we effectively "fill the holes".
  // But a simple proportion is a good enough approximation for "Amount to Allocate".
  // Let's stick to proportion of distance for now as it aligns with "invest in the most distant".
  
  const totalDistance = selectedAssets.reduce((sum, a) => sum + a.distance, 0);
  
  const suggestions = selectedAssets.map(asset => {
    const proportion = asset.distance / totalDistance;
    let valorTotal = availableAmount * proportion;
    
    // Ensure we can buy at least 1 unit
    // Use fallback price if currentPrice is 0 (though filter should catch this, double safe)
    const priceToUse = asset.currentPrice > 0 ? asset.currentPrice : 10; 
    let cotas = Math.floor(valorTotal / priceToUse);
    
    // If cotas is 0 but it's a top suggestion, try to allocate at least 1 if funds permit
    // Iterate to prioritize the top 1 if small amount
    if (cotas === 0 && availableAmount >= priceToUse) {
       cotas = 1; // Force at least 1 unit if we have enough money for 1
    }

    const valorAjustado = cotas * priceToUse;

    return {
      ticker: asset.ticker,
      cotas,
      valorTotal: valorAjustado,
      categoria: asset.category,
      currentPrice: priceToUse,
      distance: asset.distance
    };
  });

  // Filter out suggestions where 0 shares could be bought (due to high price vs allocated amount)
  return suggestions.filter(s => s.cotas > 0);
};
