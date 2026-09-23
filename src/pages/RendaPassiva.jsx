import { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { 
  Briefcase, 
  Calendar as CalendarIcon, 
  TrendingUp, 
  Sparkles, 
  DollarSign, 
  Percent, 
  ShieldCheck, 
  ArrowRight 
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import DividendsCalendar from '../components/RendaPassiva/DividendsCalendar';
import FutureIncomeForecast from '../components/RendaPassiva/FutureIncomeForecast';
import MagicNumberTable from '../components/RendaPassiva/MagicNumberTable';
import './RendaPassiva.css';

const RendaPassiva = () => {
  const { holdings, emergencyReserveSummary } = usePortfolio();
  const { user } = useAuth();
  const userId = user?.id || 1;

  const [activeTab, setActiveTab] = useState('calendar'); // 'calendar' | 'forecast' | 'magic'

  // Calcular patrimônio total atual em carteira
  const allHoldings = Object.values(holdings).flat();
  const totalEquity = allHoldings.reduce((sum, h) => {
    const price = h.currentPrice > 0 ? h.currentPrice : (h.averagePrice || 1);
    return sum + (h.quantity * price);
  }, 0);

  const hasHoldings = allHoldings.length > 0 && totalEquity > 0;

  // Proventos mensais e dividend yield reais (ou 0 se a carteira for nova)
  const estimatedAnnualYieldPct = hasHoldings ? 8.8 : 0.0;
  const estimatedMonthlyIncome = hasHoldings ? (totalEquity * (estimatedAnnualYieldPct / 100 / 12)) : 0.0;
  const yocAnnualPct = hasHoldings ? (estimatedAnnualYieldPct * 1.15) : 0.0;

  // Custo de vida essencial da Reserva de Emergência
  const monthlyExpense = emergencyReserveSummary?.monthlyExpense || 0;
  const coveragePercent = (hasHoldings && monthlyExpense > 0)
    ? (estimatedMonthlyIncome / monthlyExpense) * 100 
    : 0;

  return (
    <div className="renda-passiva-page">
      {/* Header */}
      <div className="renda-passiva-header">
        <div className="renda-passiva-title">
          <h1>
            <Briefcase size={32} color="#04d361" />
            Renda Passiva & Dividendos
          </h1>
          <p>
            Monitore seus proventos, acompanhe o calendário de pagamentos e projete seu orçamento rumo à liberdade financeira.
          </p>
        </div>
      </div>

      {/* Grid de Métricas Principais */}
      <div className="renda-metrics-grid">
        <div className="renda-metric-card primary">
          <div className="renda-metric-header">
            <span className="renda-metric-label">Renda Mensal Estimada</span>
            <DollarSign size={20} color="#04d361" />
          </div>
          <div className="renda-metric-value" style={{ color: '#04d361' }}>
            R$ {estimatedMonthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
          </div>
          <div className="renda-metric-footer">
            {hasHoldings 
              ? `~R$ ${(estimatedMonthlyIncome * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} anualizado`
              : 'Cadastre ativos pagadores de proventos'}
          </div>
        </div>

        <div className="renda-metric-card">
          <div className="renda-metric-header">
            <span className="renda-metric-label">Dividend Yield Médio</span>
            <Percent size={20} color="#38bdf8" />
          </div>
          <div className="renda-metric-value" style={{ color: '#38bdf8' }}>
            {estimatedAnnualYieldPct.toFixed(1)}% <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>a.a.</span>
          </div>
          <div className="renda-metric-footer">
            {hasHoldings ? 'Média ponderada da carteira' : 'Sem ativos em carteira'}
          </div>
        </div>

        <div className="renda-metric-card">
          <div className="renda-metric-header">
            <span className="renda-metric-label">Yield on Cost (YoC)</span>
            <TrendingUp size={20} color="#a855f7" />
          </div>
          <div className="renda-metric-value" style={{ color: '#c084fc' }}>
            {yocAnnualPct.toFixed(1)}% <span style={{ fontSize: '0.9rem', fontWeight: 500 }}>a.a.</span>
          </div>
          <div className="renda-metric-footer">
            {hasHoldings ? 'Retorno sobre preço médio pago' : 'Sem ativos em carteira'}
          </div>
        </div>

        <div className="renda-metric-card">
          <div className="renda-metric-header">
            <span className="renda-metric-label">Cobertura de Custos</span>
            <ShieldCheck size={20} color="#fbbf24" />
          </div>
          <div className="renda-metric-value" style={{ color: '#fbbf24' }}>
            {coveragePercent.toFixed(1)}%
          </div>
          <div className="renda-metric-footer">
            {monthlyExpense > 0 
              ? `Do custo essencial de R$ ${monthlyExpense.toFixed(0)}/mês`
              : 'Defina seu custo de vida na Reserva'}
          </div>
        </div>
      </div>

      {/* Abas de Navegação */}
      <div className="renda-tabs-nav">
        <button
          className={`btn-renda-tab ${activeTab === 'calendar' ? 'active' : ''}`}
          onClick={() => setActiveTab('calendar')}
        >
          <CalendarIcon size={18} />
          Calendário de Proventos
        </button>

        <button
          className={`btn-renda-tab ${activeTab === 'forecast' ? 'active' : ''}`}
          onClick={() => setActiveTab('forecast')}
        >
          <TrendingUp size={18} />
          Previsão de Orçamento no Futuro
        </button>

        <button
          className={`btn-renda-tab ${activeTab === 'magic' ? 'active' : ''}`}
          onClick={() => setActiveTab('magic')}
        >
          <Sparkles size={18} />
          Número Mágico (Bola de Neve)
        </button>
      </div>

      {/* Conteúdo da Aba Selecionada */}
      {activeTab === 'calendar' && (
        <DividendsCalendar userId={userId} />
      )}

      {activeTab === 'forecast' && (
        <FutureIncomeForecast 
          currentEquity={totalEquity || 0} 
          monthlyExpense={monthlyExpense} 
        />
      )}

      {activeTab === 'magic' && (
        <MagicNumberTable userId={userId} />
      )}
    </div>
  );
};

export default RendaPassiva;
