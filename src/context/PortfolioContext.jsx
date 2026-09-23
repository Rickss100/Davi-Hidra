import { createContext, useState, useEffect, useContext } from 'react';
import { transactionService } from '../services/transactionService';
import { useAuth } from './AuthContext';

const PortfolioContext = createContext();

export const usePortfolio = () => {
  return useContext(PortfolioContext);
};

export const PortfolioProvider = ({ children }) => {
  const { user } = useAuth();
  const userId = user?.id || 1;

  // --- 1. Objectives State (Isolado por usuário) ---
  const [macroAllocation, setMacroAllocation] = useState(() => {
    const saved = localStorage.getItem(`macroAllocation_${userId}`) || localStorage.getItem('macroAllocation');
    return saved ? JSON.parse(saved) : {
      fixed: 10, variable: 90,
      brasil: 65, usa: 35,
      acoes: 50, fiis: 50,
      stocks: 70, reits: 30
    };
  });

  const [assetTargets, setAssetTargets] = useState(() => {
    const saved = localStorage.getItem(`assetTargets_${userId}`) || localStorage.getItem('assetTargets');
    return saved ? JSON.parse(saved) : {
      acoes: [], fiis: [], stocks: [], reits: [], fixed: []
    };
  });

  // --- 1.1 Emergency Reserve Config (Isolado por usuário) ---
  const [emergencyConfig, setEmergencyConfig] = useState(() => {
    const saved = localStorage.getItem(`emergencyConfig_${userId}`);
    return saved ? JSON.parse(saved) : {
      isConfigured: false,
      monthlyExpense: 0,
      monthsTarget: 6,
      profileType: 'clt', // 'clt', 'publico', 'autonomo', 'empresario', 'custom'
      strategyMode: 'hybrid_70_30', // 'focus_100', 'hybrid_70_30', 'hybrid_50_50', 'free'
      manualReserveBalance: 0
    };
  });

  // Atualizar objetivos e configuração de reserva ao trocar de usuário
  useEffect(() => {
    if (userId) {
      const savedMacro = localStorage.getItem(`macroAllocation_${userId}`);
      if (savedMacro) setMacroAllocation(JSON.parse(savedMacro));
      const savedTargets = localStorage.getItem(`assetTargets_${userId}`);
      if (savedTargets) setAssetTargets(JSON.parse(savedTargets));
      const savedEmergency = localStorage.getItem(`emergencyConfig_${userId}`);
      if (savedEmergency) setEmergencyConfig(JSON.parse(savedEmergency));
    }
  }, [userId]);

  // --- 2. Transactions State (From API filtrada por usuário) ---
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 3. Prices State ---
  const [currentPrices, setCurrentPrices] = useState({});
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  // --- 4. Holdings (Derived State) ---
  const [holdings, setHoldings] = useState({
    acoes: [], fiis: [], stocks: [], reits: [], fixed: []
  });

  // Helper para normalizar categorias de transações
  const normalizeCategory = (cat) => {
    if (!cat) return null;
    const c = String(cat).toLowerCase();
    if (c.includes('acao') || c.includes('ação')) return 'acoes';
    if (c.includes('fii')) return 'fiis';
    if (c.includes('stock')) return 'stocks';
    if (c.includes('reit')) return 'reits';
    if (c.includes('renda') || c.includes('fix')) return 'fixed';
    return c;
  };

  // Load Transactions from API filtrado por userId
  useEffect(() => {
    const loadTransactions = async () => {
        try {
            setIsLoading(true);
            const data = await transactionService.getAll(userId);
            setTransactions(data);
        } catch (err) {
            console.error("Failed to load transactions", err);
            setError("Falha ao carregar transações.");
        } finally {
            setIsLoading(false);
        }
    };
    loadTransactions();
  }, [userId]);

  // Persist Objectives Data e Emergency Config por usuário
  useEffect(() => {
    if (userId) {
      localStorage.setItem(`macroAllocation_${userId}`, JSON.stringify(macroAllocation));
      localStorage.setItem(`assetTargets_${userId}`, JSON.stringify(assetTargets));
      localStorage.setItem(`emergencyConfig_${userId}`, JSON.stringify(emergencyConfig));
    }
  }, [macroAllocation, assetTargets, emergencyConfig, userId]);

  // Calculate Holdings whenever transactions or prices change
  useEffect(() => {
    const newHoldings = { acoes: [], fiis: [], stocks: [], reits: [], fixed: [] };
    
    // Helper to find or create asset in holdings
    const getAsset = (category, code) => {
      if (!newHoldings[category]) newHoldings[category] = [];
      let asset = newHoldings[category].find(a => a.code === code);
      if (!asset) {
        asset = { 
            code, 
            quantity: 0, 
            totalInvested: 0, 
            averagePrice: 0, 
            currentPrice: 0 
        };
        newHoldings[category].push(asset);
      }
      return asset;
    };

    // Process transactions
    transactions.forEach(tx => {
       const cat = normalizeCategory(tx.category || tx.type || tx.asset_type);
       const targetCode = tx.asset_code || tx.code;
       if (cat && targetCode && newHoldings[cat]) {
         const asset = getAsset(cat, targetCode);
         const txQty = Number(tx.quantity);
         const txPrice = Number(tx.price);
         const txTotal = Number(tx.total_value || tx.totalValue || (txQty * txPrice));

         if (tx.type === 'buy') {
           asset.quantity += txQty;
           asset.totalInvested += txTotal;
         } else if (tx.type === 'sell') {
           asset.quantity -= txQty;
           asset.totalInvested -= (txQty * asset.averagePrice); 
         }
         
         if (asset.quantity > 0) {
            asset.averagePrice = asset.totalInvested / asset.quantity;
            if (tx.type === 'buy' && !currentPrices[targetCode]) {
                asset.currentPrice = txPrice;
            }
         } else {
            asset.averagePrice = 0;
            asset.totalInvested = 0;
            asset.currentPrice = 0;
         }
       }
    });

    // Apply updated prices
    Object.keys(newHoldings).forEach(cat => {
        newHoldings[cat].forEach(asset => {
            if (currentPrices[asset.code]) {
                asset.currentPrice = currentPrices[asset.code];
            }
        });
    });

    setHoldings(newHoldings);
  }, [transactions, currentPrices]);

  // --- Actions ---
  const updateMacro = (newMacro) => setMacroAllocation(newMacro);
  
  const updateAssetTargets = (category, newAssets) => {
    setAssetTargets(prev => ({ ...prev, [category]: newAssets }));
  };

  const updateEmergencyConfig = (newConfig) => {
    setEmergencyConfig(prev => {
      const updated = typeof newConfig === 'function' ? newConfig(prev) : { ...prev, ...newConfig };
      if (userId) {
        localStorage.setItem(`emergencyConfig_${userId}`, JSON.stringify(updated));
      }
      return updated;
    });
  };

  // Helper para identificar ativos destinados à Reserva de Emergência
  const isEmergencyReserveAsset = (code) => {
    if (!code) return false;
    const c = String(code).toUpperCase();
    return c.includes('SELIC') || 
           c.includes('LIQ_DIARIA') || 
           c.includes('DIARIA') || 
           c.includes('RESERVA') || 
           c.includes('CDI_DIARIO') || 
           c.includes('REMUNERADA') || 
           c.includes('SOBERANO');
  };

  // Cálculo do Resumo da Reserva de Emergência
  const emergencyReserveAssets = (holdings.fixed || []).filter(h => isEmergencyReserveAsset(h.code));
  const reserveInvestedFromAssets = emergencyReserveAssets.reduce((sum, h) => {
    const price = h.currentPrice > 0 ? h.currentPrice : (h.averagePrice || 1);
    return sum + (h.quantity * price);
  }, 0);

  const totalCurrentReserve = reserveInvestedFromAssets + Number(emergencyConfig.manualReserveBalance || 0);
  const isConfigured = Boolean(emergencyConfig.isConfigured || (Number(emergencyConfig.monthlyExpense || 0) > 0));
  const targetReserveAmount = isConfigured 
    ? Number(emergencyConfig.monthlyExpense || 0) * Number(emergencyConfig.monthsTarget || 6)
    : 0;
  const missingReserveAmount = isConfigured 
    ? Math.max(0, targetReserveAmount - totalCurrentReserve)
    : 0;
  const reserveCompletionPercent = targetReserveAmount > 0 
    ? Math.min(100, (totalCurrentReserve / targetReserveAmount) * 100) 
    : (totalCurrentReserve > 0 ? 100 : 0);
  const reserveMonthsCovered = (emergencyConfig.monthlyExpense && Number(emergencyConfig.monthlyExpense) > 0)
    ? (totalCurrentReserve / Number(emergencyConfig.monthlyExpense)) 
    : 0;

  let reserveStatus = 'nao_configurada';
  if (isConfigured) {
    if (reserveCompletionPercent >= 100) reserveStatus = 'blindada';
    else if (reserveCompletionPercent >= 70) reserveStatus = 'quase_blindada';
    else if (reserveCompletionPercent >= 30) reserveStatus = 'em_construcao';
    else reserveStatus = 'critico';
  }

  const emergencyReserveSummary = {
    isConfigured,
    monthlyExpense: Number(emergencyConfig.monthlyExpense || 0),
    monthsTarget: Number(emergencyConfig.monthsTarget || 6),
    profileType: emergencyConfig.profileType || 'clt',
    strategyMode: emergencyConfig.strategyMode || 'hybrid_70_30',
    manualReserveBalance: Number(emergencyConfig.manualReserveBalance || 0),
    totalCurrentReserve,
    reserveInvestedFromAssets,
    targetReserveAmount,
    missingReserveAmount,
    reserveCompletionPercent,
    reserveMonthsCovered,
    reserveStatus,
    reserveAssets: emergencyReserveAssets
  };

  const addTransaction = async (transaction) => {
    try {
        const payload = { ...transaction, user_id: userId };
        const newTx = await transactionService.create(payload);
        setTransactions(prev => [...prev, newTx]);
    } catch (err) {
        console.error("Failed to add transaction", err);
        alert("Erro ao salvar transação.");
    }
  };

  const removeTransaction = async (id) => {
      try {
        await transactionService.remove(id);
        setTransactions(prev => prev.filter(t => t.id !== id));
      } catch (err) {
          console.error("Failed to delete transaction", err);
          alert("Erro ao remover transação.");
      }
  };

  // --- 5. Reset Account Logic ---
  const resetAccount = async () => {
    setIsLoading(true);
    try {
      // 1. Delete all transactions one by one (json-server doesn't support bulk delete)
      const allTxs = await transactionService.getAll();
      for (const tx of allTxs) {
        await transactionService.remove(tx.id);
      }
      setTransactions([]);

      // 2. Reset Objectives
      const defaultMacro = {
        fixed: 10, variable: 90,
        brasil: 65, usa: 35,
        acoes: 50, fiis: 50,
        stocks: 70, reits: 30
      };
      const defaultTargets = { acoes: [], fiis: [], stocks: [], reits: [] };
      
      setMacroAllocation(defaultMacro);
      setAssetTargets(defaultTargets);
      
      // 3. Clear LocalStorage
      localStorage.removeItem('macroAllocation');
      localStorage.removeItem('assetTargets');

      // 4. Reset Holdings (will auto-update due to effect on transactions, but safe to clear)
      setHoldings({ acoes: [], fiis: [], stocks: [], reits: [] });
      
    } catch (err) {
      console.error("Failed to reset account", err);
      alert("Erro ao resetar conta. Tente novamente.");
    } finally {
      setIsLoading(false);
    }
  };

  const refreshPrices = async (options = {}) => {
      setIsUpdatingPrices(true);
      try {
          console.log('Starting price update for all holdings...');
          
          // Get API keys from localStorage (you can move to env later)
          const brapiToken = localStorage.getItem('brapiToken') || null;
          const alphaVantageKey = localStorage.getItem('alphaVantageKey') || 'demo';
          
          // Use new updateAllPrices service
          const updatedHoldings = await updateAllPrices(holdings, {
              brapiToken,
              alphaVantageKey,
              onProgress: options.onProgress
          });
          
          // Extract prices into currentPrices map
          const newPrices = {};
          Object.keys(updatedHoldings).forEach(category => {
              updatedHoldings[category].forEach(asset => {
                  newPrices[asset.code] = asset.currentPrice;
              });
          });
          
          setCurrentPrices(prev => ({ ...prev, ...newPrices }));
          
          // Show status summary
          const status = getUpdateStatus(updatedHoldings);
          console.log('Price update complete:', status);
          
          return { success: true, updatedCount: status.updatedAssets };
      } catch (err) {
          console.error("Failed to update prices", err);
          return { success: false, error: err.message };
      } finally {
          setIsUpdatingPrices(false);
      }
  };

  const value = {
    macroAllocation,
    updateMacro,
    assetTargets,
    updateAssetTargets,
    emergencyConfig,
    updateEmergencyConfig,
    emergencyReserveSummary,
    transactions,
    addTransaction,
    removeTransaction,
    holdings,
    isLoading,
    refreshPrices,
    isUpdatingPrices,
    resetAccount
  };

  return (
    <PortfolioContext.Provider value={value}>
      {children}
    </PortfolioContext.Provider>
  );
};
