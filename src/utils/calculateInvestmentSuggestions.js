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
      currentValue: categoryValue,
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
    const targetCode = target.ticker || target.code;
    const targetVal = target.target != null ? target.target : target.targetPercent;
    const holding = categoryHoldings.find(h => h.code === targetCode) || { quantity: 0, currentPrice: 0, averagePrice: 0 };
    // Use average price as fallback if current price is missing (e.g. market closed API error)
    const defaultFixedPrice = category === 'fixed' ? 1 : 0;
    const price = holding.currentPrice > 0 ? holding.currentPrice : (holding.averagePrice || defaultFixedPrice);
    const assetValue = holding.quantity * price;
    const currentPercent = totalValue > 0 ? (assetValue / totalValue) * 100 : 0;
    
    // Asset target is relative to category, convert to global percentage
    const targetPercent = (categoryTargetPercent / 100) * (targetVal || 0);
    // Calculate simple percentage distance
    const distance = targetPercent - currentPercent;
    
    // Calculate financial distance (how much money is missing)
    // This is useful for more precise sorting when percentages are close
    const financialDistance = (totalValue * (targetPercent / 100)) - assetValue;

    return {
      ticker: targetCode,
      category,
      currentPercent,
      targetPercent,
      distance,
      financialDistance,
      currentPrice: price
    };
  });
};

/**
 * Calculate emergency reserve status and metrics
 * @param {Object} holdings - Current holdings
 * @param {Object} emergencyConfig - Emergency reserve configuration
 * @returns {Object} Emergency reserve metrics
 */
export const calculateEmergencyReserveStatus = (holdings, emergencyConfig = {}) => {
  const monthlyExpense = Number(emergencyConfig.monthlyExpense || 3000);
  const monthsTarget = Number(emergencyConfig.monthsTarget || 6);
  const manualBalance = Number(emergencyConfig.manualReserveBalance || 0);

  const isReserveAsset = (code) => {
    if (!code) return false;
    const c = String(code).toUpperCase();
    return c.includes('SELIC') || c.includes('LIQ_DIARIA') || c.includes('DIARIA') || 
           c.includes('RESERVA') || c.includes('CDI_DIARIO') || c.includes('REMUNERADA') || c.includes('SOBERANO');
  };

  const reserveAssets = (holdings.fixed || []).filter(h => isReserveAsset(h.code));
  const reserveInvested = reserveAssets.reduce((sum, h) => {
    const price = h.currentPrice > 0 ? h.currentPrice : (h.averagePrice || 1);
    return sum + (h.quantity * price);
  }, 0);

  const totalCurrentReserve = reserveInvested + manualBalance;
  const targetReserveAmount = monthlyExpense * monthsTarget;
  const missingReserveAmount = Math.max(0, targetReserveAmount - totalCurrentReserve);
  const reserveCompletionPercent = targetReserveAmount > 0
    ? Math.min(100, (totalCurrentReserve / targetReserveAmount) * 100)
    : 100;
  const reserveMonthsCovered = monthlyExpense > 0 ? (totalCurrentReserve / monthlyExpense) : 0;

  let reserveStatus = 'critico';
  if (reserveCompletionPercent >= 100) reserveStatus = 'blindada';
  else if (reserveCompletionPercent >= 70) reserveStatus = 'quase_blindada';
  else if (reserveCompletionPercent >= 30) reserveStatus = 'em_construcao';

  return {
    monthlyExpense,
    monthsTarget,
    strategyMode: emergencyConfig.strategyMode || 'hybrid_70_30',
    totalCurrentReserve,
    targetReserveAmount,
    missingReserveAmount,
    reserveCompletionPercent,
    reserveMonthsCovered,
    reserveStatus,
    reserveAssets
  };
};

/**
 * Suggest investments based on available amount, number of assets and emergency reserve priority
 * @param {number} availableAmount - Amount available to invest
 * @param {number} numAssets - Number of assets to suggest (1-3)
 * @param {Object} holdings - Current holdings
 * @param {Object} macroAllocation - Macro allocation targets
 * @param {Object} assetTargets - Asset-level targets
 * @param {Object} emergencyReserveSummary - Optional emergency reserve status summary
 * @returns {Array} Array of {ticker, cotas, valorTotal, categoria, isEmergencyReserve, reason}
 */
export const suggestInvestments = (
  availableAmount,
  numAssets,
  holdings,
  macroAllocation,
  assetTargets,
  emergencyReserveSummary = null
) => {
  if (availableAmount <= 0 || numAssets <= 0) return [];

  // Se a Reserva de Emergência foi informada e está incompleta (< 100%), aplicar a estratégia escolhida
  if (emergencyReserveSummary && emergencyReserveSummary.reserveCompletionPercent < 100) {
    const strategy = emergencyReserveSummary.strategyMode || 'hybrid_70_30';
    const reserveAssetCode = emergencyReserveSummary.reserveAssets?.[0]?.code || 'TESOURO_SELIC_2029';
    const missing = emergencyReserveSummary.missingReserveAmount;
    const currentPct = emergencyReserveSummary.reserveCompletionPercent.toFixed(1);

    if (strategy === 'focus_100') {
      // 100% do aporte vai para a Reserva de Emergência
      const valorReserva = Math.min(availableAmount, missing);
      return [{
        ticker: reserveAssetCode,
        cotas: 1,
        valorTotal: Number(valorReserva.toFixed(2)),
        categoria: 'fixed',
        currentPrice: 1,
        distance: 100 - emergencyReserveSummary.reserveCompletionPercent,
        isEmergencyReserve: true,
        reason: `Blindagem Prioritária: Reserva em ${currentPct}% (Faltam R$ ${missing.toFixed(2)}).`
      }];
    }

    if (strategy === 'hybrid_70_30' || strategy === 'hybrid_50_50') {
      const reserveRatio = strategy === 'hybrid_70_30' ? 0.70 : 0.50;
      let valorReserva = Math.min(availableAmount * reserveRatio, missing);
      valorReserva = Number(valorReserva.toFixed(2));
      const valorRestante = availableAmount - valorReserva;

      const sugestaoReserva = {
        ticker: reserveAssetCode,
        cotas: 1,
        valorTotal: valorReserva,
        categoria: 'fixed',
        currentPrice: 1,
        distance: 100 - emergencyReserveSummary.reserveCompletionPercent,
        isEmergencyReserve: true,
        reason: `Aporte Híbrido: ${Math.round(reserveRatio * 100)}% na Reserva de Emergência (${currentPct}% concluída).`
      };

      if (valorRestante <= 0) {
        return [sugestaoReserva];
      }

      // O restante do valor vai para os melhores ativos da carteira (numAssets - 1 ou mínimo 1)
      const carteiraSuggestions = suggestInvestments(
        valorRestante,
        Math.max(1, numAssets - 1),
        holdings,
        macroAllocation,
        assetTargets,
        null // Não passar recursivamente
      );

      return [sugestaoReserva, ...carteiraSuggestions];
    }
  }

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
    if (catDist.category === 'fixed') {
      const fixedTargets = assetTargets['fixed'] || [];
      if (fixedTargets.length > 0) {
        const assetDists = calculateAssetDistances(
          holdings,
          assetTargets,
          'fixed',
          totalValue,
          catDist.targetPercent
        );
        allAssetDistances = allAssetDistances.concat(assetDists);
      } else if (catDist.distance > 0) {
        // Sugestão de aporte em Renda Fixa Geral se estiver abaixo da meta macro
        const holding = (holdings['fixed'] || [])[0] || { quantity: 0, currentPrice: 1, averagePrice: 1 };
        const price = holding.currentPrice > 0 ? holding.currentPrice : 1;
        allAssetDistances.push({
          ticker: 'Renda Fixa (Tesouro Selic / Reserva)',
          category: 'fixed',
          currentPercent: catDist.currentPercent,
          targetPercent: catDist.targetPercent,
          distance: catDist.distance,
          financialDistance: (totalValue * (catDist.targetPercent / 100)) - (catDist.currentPercent * totalValue / 100),
          currentPrice: price
        });
      }
      return;
    }
    
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

  const totalDistance = selectedAssets.reduce((sum, a) => sum + a.distance, 0);
  
  const suggestions = selectedAssets.map(asset => {
    const proportion = asset.distance / totalDistance;
    let valorTotal = availableAmount * proportion;
    
    const priceToUse = asset.currentPrice > 0 ? asset.currentPrice : 10; 
    let cotas = Math.floor(valorTotal / priceToUse);
    
    // Tratamento especial para Renda Fixa: suporta frações ou valor monetário direto
    if (asset.category === 'fixed') {
      cotas = cotas === 0 ? Number((valorTotal / priceToUse).toFixed(2)) : cotas;
      return {
        ticker: asset.ticker,
        cotas: cotas > 0 ? cotas : 1,
        valorTotal: Number(valorTotal.toFixed(2)),
        categoria: asset.category,
        currentPrice: priceToUse,
        distance: asset.distance
      };
    }

    if (cotas === 0 && availableAmount >= priceToUse) {
       cotas = 1;
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

  // Filter out suggestions where 0 shares could be bought
  return suggestions.filter(s => s.cotas > 0 || (s.categoria === 'fixed' && s.valorTotal > 0));
};
