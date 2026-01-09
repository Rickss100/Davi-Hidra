import { createContext, useState, useEffect, useContext } from 'react';
import { transactionService } from '../services/transactionService';
// REMOVIDO: import { updateAllPrices, getUpdateStatus } from '../services/priceUpdater.service';
// Esse serviço usa Node.js fs e deve rodar apenas no backend
// TODO: Criar chamada à API /api/prices para atualizar preços

const PortfolioContext = createContext();

export const usePortfolio = () => {
  return useContext(PortfolioContext);
};

export const PortfolioProvider = ({ children }) => {
  // --- 1. Objectives State (Kept in LocalStorage for now, as per plan only transactions go to DB) ---
  const [macroAllocation, setMacroAllocation] = useState(() => {
    const saved = localStorage.getItem('macroAllocation');
    return saved ? JSON.parse(saved) : {
      fixed: 10, variable: 90,
      brasil: 65, usa: 35,
      acoes: 50, fiis: 50,
      stocks: 70, reits: 30
    };
  });

  const [assetTargets, setAssetTargets] = useState(() => {
    const saved = localStorage.getItem('assetTargets');
    return saved ? JSON.parse(saved) : {
      acoes: [], fiis: [], stocks: [], reits: []
    };
  });

  // --- 2. Transactions State (From API) ---
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // --- 3. Prices State ---
  const [currentPrices, setCurrentPrices] = useState({});
  const [isUpdatingPrices, setIsUpdatingPrices] = useState(false);

  // --- 4. Holdings (Derived State) ---
  const [holdings, setHoldings] = useState({
    acoes: [], fiis: [], stocks: [], reits: []
  });

  // Load Transactions from API
  useEffect(() => {
    const loadTransactions = async () => {
        try {
            setIsLoading(true);
            const data = await transactionService.getAll();
            setTransactions(data);
        } catch (err) {
            console.error("Failed to load transactions", err);
            setError("Falha ao carregar transações.");
        } finally {
            setIsLoading(false);
        }
    };
    loadTransactions();
  }, []);

  // Persist Objectives Data
  useEffect(() => {
    localStorage.setItem('macroAllocation', JSON.stringify(macroAllocation));
    localStorage.setItem('assetTargets', JSON.stringify(assetTargets));
  }, [macroAllocation, assetTargets]);

  // Calculate Holdings whenever transactions or prices change
  useEffect(() => {
    const newHoldings = { acoes: [], fiis: [], stocks: [], reits: [] };
    
    // Helper to find or create asset in holdings
    const getAsset = (category, code) => {
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
       if (tx.category && newHoldings[tx.category]) {
         const asset = getAsset(tx.category, tx.code);
         const txQty = Number(tx.quantity);
         const txPrice = Number(tx.price);
         const txTotal = Number(tx.totalValue);

         if (tx.type === 'buy') {
           asset.quantity += txQty;
           asset.totalInvested += txTotal;
         } else if (tx.type === 'sell') {
           asset.quantity -= txQty;
           // Average price removal logic
           asset.totalInvested -= (txQty * asset.averagePrice); 
         }
         
         if (asset.quantity > 0) {
            asset.averagePrice = asset.totalInvested / asset.quantity;
            // Default current price to average if we don't have a live update yet
            // OR use the last buy price. Let's use last buy price as fallback.
            if (tx.type === 'buy' && !currentPrices[tx.code]) {
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

  const addTransaction = async (transaction) => {
    try {
        // Use logic defined in service (ID generation handled by server or omitted)
        const newTx = await transactionService.create(transaction);
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
