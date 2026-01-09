import { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { DollarSign, Copy } from 'lucide-react';
import MethodExplanationModal from '../components/OndeAportar/MethodExplanationModal';
import DistancePanel from '../components/OndeAportar/DistancePanel';
import { suggestInvestments } from '../utils/calculateInvestmentSuggestions';
import './OndeAportar.css';

const OndeAportar = () => {
  const { holdings, macroAllocation, assetTargets } = usePortfolio();
  const [showModal, setShowModal] = useState(false);
  const [availableAmount, setAvailableAmount] = useState('');
  const [numAssets, setNumAssets] = useState(1);
  const [suggestions, setSuggestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');

  // Check if modal should be shown on first visit
  useEffect(() => {
    const hideWarning = localStorage.getItem('hideAM2OWarning');
    if (!hideWarning) {
      setShowModal(true);
    }
  }, []);

  // Calculate total portfolio value
  const allHoldings = Object.values(holdings).flat();
  const totalValue = allHoldings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);

  const handleGenerateSuggestions = () => {
    const amount = parseFloat(availableAmount) || 0;
    
    if (amount <= 0) {
      alert("Por favor, insira um valor maior que zero.");
      return;
    }

    const newSuggestions = suggestInvestments(
      amount,
      numAssets,
      holdings,
      macroAllocation,
      assetTargets
    );
    
    setSuggestions(newSuggestions);
    setErrorMessage(''); // Clear previous errors
    
    // Check for potential issues if no suggestions returned
    if (newSuggestions.length === 0 && amount > 0) {
       // Check if we have valid prices (using strictly currentPrice here for warning)
       const allHoldings = Object.values(holdings).flat();
       const hasPrices = allHoldings.some(h => h.currentPrice > 0);
       
       if (!hasPrices) {
         // Even with fallback, it's good to warn
         // But if fallback worked, suggestions would be length > 0.
         // If length is still 0, it means really no data or no distance.
         
         const hasFallback = allHoldings.some(h => h.averagePrice > 0);
         if (!hasFallback) {
            setErrorMessage("Não foi possível gerar sugestões. Verifique se você possui ativos cadastrados em 'Definir Objetivos' e se as cotações estão atualizadas.");
         } else {
             setErrorMessage("Nenhum ativo encontrado que necessite de aporte segundo sua estratégia (todos estão acima ou na meta).");
         }
       } else {
           setErrorMessage("Nenhum ativo encontrado abaixo da meta definida.");
       }
    }
  };

  // Auto-calculate passed, keeping button for explicit action + force recalc
  useEffect(() => {
     // Optional: Keep auto-calc or rely solely on button. 
     // Let's keep auto-calc for responsiveness but Button is the main actor for user confidence.
     if (availableAmount && numAssets) {
         // handleGenerateSuggestions(); // Avoid auto-triggering alert loop
     }
  }, [availableAmount, numAssets]);

  const totalSuggested = suggestions.reduce((sum, s) => sum + s.valorTotal, 0);

  const handleCopyTicker = (ticker) => {
    navigator.clipboard.writeText(ticker);
  };

  return (
    <div className="onde-aportar-page">
      {showModal && <MethodExplanationModal onClose={() => setShowModal(false)} />}

      <div className="onde-aportar-container">
        {/* Left Panel - Investment Suggestions */}
        <div className="suggestions-panel">
          <div className="panel-header">
            <span className="icon-edit">✏️</span>
            <h2>Onde aportar</h2>
          </div>

          <div className="suggestions-content">
            {errorMessage && (
              <div className="error-message">
                <p>{errorMessage}</p>
              </div>
            )}

            {suggestions.length === 0 && !errorMessage ? (
              <div className="empty-state">
                <DollarSign size={48} className="empty-icon" />
                <p>Informe o valor disponível para aportar.</p>
              </div>
            ) : suggestions.length > 0 ? (
              <div className="suggestion-message">
                <p>Na sua carteira esse mês é aconselhável investir em:</p>
                <ul className="suggested-tickers">
                  {suggestions.map(s => (
                    <li key={s.ticker}>{s.ticker}</li>
                  ))}
                </ul>
              </div>
            ) : null}

            {/* Input Section */}
            <div className="input-section">
              <div className="input-group">
                <label>Disponível para Aportar</label>
                <div className="input-wrapper">
                  <span className="currency">R$</span>
                  <input
                    type="number"
                    placeholder="0,00"
                    value={availableAmount}
                    onChange={(e) => setAvailableAmount(e.target.value)}
                    min="0"
                    step="0.01"
                  />
                </div>
              </div>

              <div className="input-group">
                <label>Qtd de Ativos para Aportar</label>
                <select
                  value={numAssets}
                  onChange={(e) => setNumAssets(parseInt(e.target.value))}
                >
                  <option value={1}>1</option>
                  <option value={2}>2</option>
                  <option value={3}>3</option>
                </select>
              </div>

              <div className="input-group" style={{ display: 'flex', alignItems: 'flex-end' }}>
                <button 
                  className="btn-generate"
                  onClick={handleGenerateSuggestions}
                >
                  Gerar Sugestão
                </button>
              </div>
            </div>

            {/* Suggestions Table */}
            {suggestions.length > 0 && (
              <div className="suggestions-table-wrapper">
                <table className="suggestions-table">
                  <thead>
                    <tr>
                      <th>CÓDIGO</th>
                      <th>COTAS</th>
                      <th>VALOR TOTAL</th>
                      <th>APORTAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map(suggestion => (
                      <tr key={suggestion.ticker}>
                        <td className="ticker-cell">{suggestion.ticker}</td>
                        <td>{suggestion.cotas || '-'}</td>
                        <td>R$ {suggestion.valorTotal.toFixed(2)}</td>
                        <td>
                          <button
                            className="btn-copy"
                            onClick={() => handleCopyTicker(suggestion.ticker)}
                            title="Copiar código"
                          >
                            <Copy size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>

                <div className="total-aporte">
                  <span>Total do Aporte</span>
                  <span className="total-value">R$ {totalSuggested.toFixed(2)}</span>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Panel - Distance to Objective */}
        <DistancePanel
          holdings={holdings}
          macroAllocation={macroAllocation}
          assetTargets={assetTargets}
          totalValue={totalValue}
        />
      </div>
    </div>
  );
};

export default OndeAportar;
