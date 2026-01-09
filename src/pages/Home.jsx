import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { usePortfolio } from '../context/PortfolioContext';
import { RefreshCcw, Wallet } from 'lucide-react';
import { formatCurrency, calculateTotalValue, calculatePassiveIncome, getHoldingsSummary } from '../utils/formatters';
import UserMenu from '../components/UserMenu/UserMenu';
import './Home.css';

const Home = () => {
  const { user } = useAuth();
  const { holdings, transactions, isLoading, macroAllocation, assetTargets } = usePortfolio();

  const userName = user?.name || 'Investidor';
  
  // Calculate values
  const totalValue = calculateTotalValue(holdings);
  const passiveIncome = calculatePassiveIncome(transactions);
  const holdingsSummary = getHoldingsSummary(holdings);
  
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
                <span style={{ fontSize: '0.875rem', color: '#a8a8b3', position: 'absolute', right: '110px', top: '28px' }}>Filtrar por:</span>
                <select className="filter-select">
                    <option>Mês atual</option>
                </select>
            </div>

            {passiveIncome === 0 ? (
              <div className="empty-graph-state">
                Sem rendimentos :/
              </div>
            ) : (
              <div className="empty-graph-state">
                Gráfico em desenvolvimento
              </div>
            )}
          </div>

          {/* Carteira Card */}
          <div className="dashboard-card">
            <div className="card-carteira-header">
                <div className="card-title">
                    <Wallet size={18} /> Carteira
                </div>
                <div className="carteira-controls">
                    <button className="control-btn active">Classe de ativo</button>
                    <button className="control-btn">Ativo</button>
                </div>
            </div>
            
            {holdingsSummary.length === 0 ? (
              <div className="empty-table-state">
                  Não há dados a serem exibidos...
              </div>
            ) : (
              <div className="holdings-summary-table">
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
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Home;
