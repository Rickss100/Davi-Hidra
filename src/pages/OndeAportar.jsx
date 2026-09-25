import { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { useAuth } from '../context/AuthContext';
import { DollarSign, Copy, ShieldAlert, ShieldCheck, ArrowRight, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import MethodExplanationModal from '../components/OndeAportar/MethodExplanationModal';
import DistancePanel from '../components/OndeAportar/DistancePanel';
import { suggestInvestments } from '../utils/calculateInvestmentSuggestions';
import './OndeAportar.css';

const OndeAportar = () => {
  const { holdings, macroAllocation, assetTargets, emergencyReserveSummary, updateEmergencyConfig } = usePortfolio();
  const { user } = useAuth();
  const isSuspended = user?.role === 'user' && (user?.status === 'suspended' || user?.isSuspended);

  const [showModal, setShowModal] = useState(false);
  const [availableAmount, setAvailableAmount] = useState('');
  const [numAssets, setNumAssets] = useState(2);
  const [suggestions, setSuggestions] = useState([]);
  const [errorMessage, setErrorMessage] = useState('');
  const [reserveStrategy, setReserveStrategy] = useState(emergencyReserveSummary?.strategyMode || 'hybrid_70_30');

  // Check if modal should be shown on first visit
  useEffect(() => {
    const hideWarning = localStorage.getItem('hideAM2OWarning');
    if (!hideWarning) {
      setShowModal(true);
    }
  }, []);

  // Sincronizar estratégia local com o contexto
  useEffect(() => {
    if (emergencyReserveSummary?.strategyMode) {
      setReserveStrategy(emergencyReserveSummary.strategyMode);
    }
  }, [emergencyReserveSummary?.strategyMode]);

  // Calculate total portfolio value
  const allHoldings = Object.values(holdings).flat();
  const totalValue = allHoldings.reduce((sum, h) => sum + (h.quantity * h.currentPrice), 0);

  const handleGenerateSuggestions = () => {
    const amount = parseFloat(availableAmount) || 0;
    
    if (amount <= 0) {
      alert("Por favor, insira um valor maior que zero.");
      return;
    }

    // Configurar o resumo da reserva para a chamada com a estratégia selecionada na tela
    const reserveSummaryForCalc = emergencyReserveSummary && reserveStrategy !== 'free'
      ? { ...emergencyReserveSummary, strategyMode: reserveStrategy }
      : null;

    const newSuggestions = suggestInvestments(
      amount,
      numAssets,
      holdings,
      macroAllocation,
      assetTargets,
      reserveSummaryForCalc
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
            {isSuspended ? (
              <div style={{
                background: 'rgba(245, 158, 11, 0.1)',
                border: '1px solid rgba(245, 158, 11, 0.3)',
                borderRadius: '12px',
                padding: '36px 24px',
                textAlign: 'center',
                margin: '10px 0 20px 0'
              }}>
                <div style={{
                  width: '56px',
                  height: '56px',
                  borderRadius: '50%',
                  background: 'rgba(245, 158, 11, 0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 16px',
                  color: '#fbbf24'
                }}>
                  <ShieldAlert size={32} />
                </div>
                <h3 style={{ color: '#fbbf24', fontSize: '1.25rem', marginBottom: '10px' }}>
                  Recomendações Bloqueadas (Conta Suspensa)
                </h3>
                <p style={{ color: '#cbd5e1', fontSize: '0.95rem', lineHeight: '1.6', maxWidth: '560px', margin: '0 auto 24px' }}>
                  Sua conta está no status <strong>Suspenso</strong> (inadimplência ou renovação de plano pendente).
                  O cálculo automático de onde aportar da metodologia DAVI & HYDRA está temporariamente desativado para o seu usuário.
                  Sua carteira e seu histórico permanecem disponíveis para consulta básica.
                </p>
                <a 
                  href="https://api.whatsapp.com/send?text=Olá, preciso de suporte para regularizar a assinatura da minha conta no sistema Davi-Hidra."
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn-primary"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 24px',
                    borderRadius: '8px',
                    background: '#22c55e',
                    color: '#fff',
                    textDecoration: 'none',
                    fontWeight: 600,
                    fontSize: '0.9rem'
                  }}
                >
                  <MessageCircle size={18} /> Regularizar Acesso com Suporte
                </a>
              </div>
            ) : (
              <>
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

            {/* Banner Inteligente de Reserva de Emergência */}
            {emergencyReserveSummary && (
              <div className={`emergency-banner ${emergencyReserveSummary.reserveStatus}`}>
                <div className="emergency-banner-left">
                  {emergencyReserveSummary.reserveStatus === 'blindada' ? (
                    <ShieldCheck className="shield-icon success" size={28} />
                  ) : (
                    <ShieldAlert className="shield-icon warning" size={28} />
                  )}
                  <div>
                    <div className="banner-title-row">
                      <span className="banner-title">
                        {emergencyReserveSummary.reserveStatus === 'blindada'
                          ? '🛡️ Reserva de Emergência Blindada (100%)'
                          : `⚠️ Reserva de Emergência em Construção (${emergencyReserveSummary.reserveCompletionPercent.toFixed(1)}%)`}
                      </span>
                      <Link to="/reserva-emergencia" className="banner-link">
                        Ver detalhes <ArrowRight size={14} />
                      </Link>
                    </div>
                    <p className="banner-subtitle">
                      {emergencyReserveSummary.reserveStatus === 'blindada'
                        ? `Parabéns! Sua reserva possui R$ ${emergencyReserveSummary.totalCurrentReserve.toFixed(2)} (${emergencyReserveSummary.reserveMonthsCovered.toFixed(1)} meses de cobertura). Novos aportes liberados 100% para a carteira.`
                        : `Saldo atual: R$ ${emergencyReserveSummary.totalCurrentReserve.toFixed(2)} de R$ ${emergencyReserveSummary.targetReserveAmount.toFixed(2)} (Faltam R$ ${emergencyReserveSummary.missingReserveAmount.toFixed(2)} / ${emergencyReserveSummary.reserveMonthsCovered.toFixed(1)} meses cobertos).`}
                    </p>
                  </div>
                </div>

                {emergencyReserveSummary.reserveStatus !== 'blindada' && (
                  <div className="reserve-strategy-picker">
                    <span className="strategy-label">Prioridade deste aporte:</span>
                    <div className="strategy-buttons">
                      <button
                        type="button"
                        className={`btn-strategy ${reserveStrategy === 'focus_100' ? 'active' : ''}`}
                        onClick={() => setReserveStrategy('focus_100')}
                      >
                        100% Reserva
                      </button>
                      <button
                        type="button"
                        className={`btn-strategy ${reserveStrategy === 'hybrid_70_30' ? 'active' : ''}`}
                        onClick={() => setReserveStrategy('hybrid_70_30')}
                      >
                        70% Reserva / 30% Carteira
                      </button>
                      <button
                        type="button"
                        className={`btn-strategy ${reserveStrategy === 'free' ? 'active' : ''}`}
                        onClick={() => setReserveStrategy('free')}
                      >
                        100% Carteira
                      </button>
                    </div>
                  </div>
                )}
              </div>
            )}

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
                <label>Qtd de Ativos da Carteira</label>
                <select
                  value={numAssets}
                  onChange={(e) => setNumAssets(parseInt(e.target.value))}
                >
                  <option value={1}>1 Ativo</option>
                  <option value={2}>2 Ativos</option>
                  <option value={3}>3 Ativos</option>
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
                      <th>CÓDIGO / ATIVO</th>
                      <th>FINALIDADE</th>
                      <th>COTAS</th>
                      <th>VALOR TOTAL</th>
                      <th>APORTAR</th>
                    </tr>
                  </thead>
                  <tbody>
                    {suggestions.map(suggestion => (
                      <tr key={suggestion.ticker} className={suggestion.isEmergencyReserve ? 'row-emergency' : ''}>
                        <td className="ticker-cell">
                          {suggestion.ticker}
                          {suggestion.isEmergencyReserve && (
                            <span className="emergency-badge">🛡️ Reserva</span>
                          )}
                        </td>
                        <td className="purpose-cell">
                          {suggestion.reason || (suggestion.isEmergencyReserve ? 'Blindagem' : 'Rebalanceamento')}
                        </td>
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
              </>
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
