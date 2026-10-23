import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';
import { RefreshCcw, Wallet } from 'lucide-react';
import { formatCurrency, calculateTotalValue, calculatePassiveIncome, getHoldingsSummary } from '../utils/formatters';
import UserMenu from '../components/UserMenu/UserMenu';
import MarketIndicators from '../components/Dashboard/MarketIndicators';
import IncomeChart from '../components/Dashboard/IncomeChart';
import MiniAllocationChart from '../components/Dashboard/MiniAllocationChart';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const { holdings, transactions, isLoading, assetTargets, usdRate } = usePortfolio();

  const [incomePeriod, setIncomePeriod] = useState('90d');
  const [carteiraView, setCarteiraView] = useState('class'); // 'class' | 'asset'

  const userName = user?.name || 'Investidor';
  
  // Calculate values
  const totalValue = calculateTotalValue(holdings, usdRate);
  const passiveIncome = calculatePassiveIncome(transactions, incomePeriod);
  const totalHistoricalIncome = calculatePassiveIncome(transactions, 'all');
  const holdingsSummary = getHoldingsSummary(holdings, usdRate);
  
  // Lista individual de ativos ordenada por valor
  const individualAssets = Object.entries(holdings || {})
    .flatMap(([cat, list]) => {
      const isUs = cat === 'stocks' || cat === 'reits';
      return (list || []).map(a => {
        const val = (Number(a.quantity) || 0) * (Number(a.currentPrice) || 0) * (isUs ? usdRate : 1);
        return { ...a, category: cat, totalVal: val };
      });
    })
    .filter(a => a.quantity > 0)
    .sort((a, b) => b.totalVal - a.totalVal);

  // Check if user has objectives defined
  const hasObjectives = Object.values(assetTargets).some(arr => arr.length > 0);

  return (
    <div className="home-container">
      <header className="home-header">
        <div className="header-welcome">
          <h1>Bem vindo(a), <span className="user-name">{userName}!</span></h1>
          <p>Acompanhe a evolução da sua carteira.</p>
        </div>
        <UserMenu />
      </header>

      <MarketIndicators />
      <div className="dashboard-grid">
        {/* Top Row */}
        <div className="dashboard-row">
          {/* Total Card */}
          <div className="dashboard-card card-total">
            <div className="card-title">Total</div>
            <div className="total-value">
              {isLoading ? (
                <span style={{ fontSize: '1.5rem' }}>Carregando...</span>
              ) : (
                formatCurrency(totalValue)
              )}
            </div>
          </div>

          {/* Objectives Card */}
          <div className="dashboard-card">
            {!hasObjectives ? (
              <div className="empty-objectives">
                <p>Você não possui nenhum objetivo cadastrado</p>
                <Link to="/definir-objetivos" className="create-objective-btn">
                  Criar objetivo
                </Link>
              </div>
            ) : (
              <div className="objectives-summary">
                <div className="card-title">Objetivos</div>
                <div style={{ padding: '1rem', color: '#a8a8b3' }}>
                  <p>✓ Objetivos definidos</p>
                  <Link to="/definir-objetivos" style={{ color: '#8257e5', textDecoration: 'none', fontSize: '0.875rem' }}>
                    Ver detalhes →
                  </Link>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Bottom Row */}
        <div className="dashboard-row">
          {/* Renda Passiva Card */}
          <div className="dashboard-card card-renda-passiva">
            <div className="card-title">
               <RefreshCcw size={18} /> Renda passiva
            </div>
            <div className="passive-income-value">
              {formatCurrency(passiveIncome)}
            </div>
            
            <div className="filters">
                <span style={{ fontSize: '0.875rem', color: '#a8a8b3', position: 'absolute', right: '150px', top: '28px' }}>Filtrar por:</span>
                <select 
                  className="filter-select"
                  value={incomePeriod}
                  onChange={(e) => setIncomePeriod(e.target.value)}
                >
                    <option value="90d">Últimos 90 dias (B3)</option>
                    <option value="month">Mês atual</option>
                    <option value="12m">Últimos 12 meses</option>
                    <option value="all">Total histórico</option>
                </select>
            </div>

            {totalHistoricalIncome === 0 ? (
              <div className="empty-graph-state">
                Sem rendimentos :/
              </div>
            ) : (
              <IncomeChart transactions={transactions} />
            )}
          </div>

          {/* Carteira Card */}
          <div className="dashboard-card">
            <div className="card-carteira-header">
                <div className="card-title">
                    <Wallet size={18} /> Carteira
                </div>
                <div className="carteira-controls">
                    <button 
                      className={`control-btn ${carteiraView === 'class' ? 'active' : ''}`}
                      onClick={() => setCarteiraView('class')}
                    >
                      Classe de ativo
                    </button>
                    <button 
                      className={`control-btn ${carteiraView === 'asset' ? 'active' : ''}`}
                      onClick={() => setCarteiraView('asset')}
                    >
                      Ativo
                    </button>
                </div>
            </div>
            
            {holdingsSummary.length === 0 ? (
              <div className="empty-table-state">
                  Não há dados a serem exibidos...
              </div>
            ) : carteiraView === 'class' ? (
              <>
                <MiniAllocationChart holdingsSummary={holdingsSummary} />
                <div className="holdings-summary-table" style={{ marginTop: '16px' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                    <thead>
                      <tr style={{ borderBottom: '1px solid #29292e', color: '#a8a8b3', fontSize: '0.875rem' }}>
                        <th style={{ textAlign: 'left', padding: '0.5rem' }}>Categoria</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>Ativos</th>
                        <th style={{ textAlign: 'right', padding: '0.5rem' }}>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {holdingsSummary.map(item => (
                        <tr key={item.category} style={{ borderBottom: '1px solid #29292e' }}>
                          <td style={{ padding: '0.75rem 0.5rem', color: '#e1e1e6' }}>{item.label}</td>
                          <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#a8a8b3' }}>{item.count}</td>
                          <td style={{ textAlign: 'right', padding: '0.75rem 0.5rem', color: '#e1e1e6', fontWeight: '500' }}>
                            {formatCurrency(item.total)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </>
            ) : (
              <div className="holdings-summary-table" style={{ marginTop: '12px', maxHeight: '340px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid #29292e', color: '#a8a8b3', fontSize: '0.82rem' }}>
                      <th style={{ textAlign: 'left', padding: '0.5rem' }}>Ativo</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Qtd</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>Total</th>
                      <th style={{ textAlign: 'right', padding: '0.5rem' }}>%</th>
                    </tr>
                  </thead>
                  <tbody>
                    {individualAssets.map(asset => (
                      <tr key={asset.code} style={{ borderBottom: '1px solid #29292e', fontSize: '0.88rem' }}>
                        <td style={{ padding: '0.6rem 0.5rem', color: '#e1e1e6', fontWeight: '600' }}>{asset.code}</td>
                        <td style={{ textAlign: 'right', padding: '0.6rem 0.5rem', color: '#a8a8b3' }}>{Number(asset.quantity.toFixed(2))}</td>
                        <td style={{ textAlign: 'right', padding: '0.6rem 0.5rem', color: '#10b981', fontWeight: '500' }}>
                          {formatCurrency(asset.totalVal)}
                        </td>
                        <td style={{ textAlign: 'right', padding: '0.6rem 0.5rem', color: '#a8a8b3' }}>
                          {totalValue > 0 ? ((asset.totalVal / totalValue) * 100).toFixed(1) + '%' : '0%'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
