import { useState, useEffect } from 'react';
import { 
  FileText, 
  DollarSign, 
  TrendingUp, 
  TrendingDown, 
  PieChart, 
  ShieldCheck, 
  Percent,
  Coins
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import BenchmarkChart from '../components/Resumo/BenchmarkChart';
import AllocationPieChart from '../components/Resumo/AllocationPieChart';
import './Resumo.css';

const Resumo = () => {
  const { user } = useAuth();
  const userId = user?.id || 1;

  const [metrics, setMetrics] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchMetrics = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/resumo/metrics?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setMetrics(data);
        }
      } catch (err) {
        console.error('Erro ao buscar métricas de resumo:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchMetrics();
  }, [userId]);

  const totalEquity = metrics?.totalEquity || 0;
  const investedCapital = metrics?.investedCapital || 0;
  const totalProfitBRL = metrics?.totalProfitBRL || 0;
  const totalReturnPct = metrics?.totalReturnPct || 0;
  const pctOfCdi = metrics?.comparisons?.pctOfCdi || 0;
  const totalDividends = metrics?.totalDividendsBRL || 0;

  return (
    <div className="resumo-page">
      {/* Header */}
      <div className="resumo-header">
        <div className="resumo-title">
          <h1>
            <FileText size={32} color="#04d361" />
            Resumo Geral da Carteira
          </h1>
          <p>
            Visão executiva tradicional: acompanhe o crescimento patrimonial e compare sua performance contra os índices de mercado.
          </p>
        </div>
      </div>

      {/* Grid de Cards Executivos de Topo */}
      <div className="resumo-metrics-grid">
        <div className="resumo-metric-card highlight">
          <div className="resumo-card-header">
            <span className="resumo-card-label">Patrimônio Total</span>
            <DollarSign size={20} color="#04d361" />
          </div>
          <div className="resumo-card-value" style={{ color: '#04d361' }}>
            R$ {totalEquity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="resumo-card-sub">
            Posição consolidada a mercado
          </div>
        </div>

        <div className="resumo-metric-card">
          <div className="resumo-card-header">
            <span className="resumo-card-label">Capital Aplicado</span>
            <Coins size={20} color="#38bdf8" />
          </div>
          <div className="resumo-card-value">
            R$ {investedCapital.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="resumo-card-sub">
            Total aportado de compras
          </div>
        </div>

        <div className="resumo-metric-card">
          <div className="resumo-card-header">
            <span className="resumo-card-label">Lucro / Prejuízo Histórico</span>
            {totalProfitBRL >= 0 ? (
              <TrendingUp size={20} color="#04d361" />
            ) : (
              <TrendingDown size={20} color="#f87171" />
            )}
          </div>
          <div className="resumo-card-value" style={{ color: totalProfitBRL >= 0 ? '#04d361' : '#f87171' }}>
            {totalProfitBRL >= 0 ? '+' : ''}R$ {totalProfitBRL.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="resumo-card-sub" style={{ color: totalReturnPct >= 0 ? '#04d361' : '#f87171', fontWeight: 600 }}>
            {totalReturnPct >= 0 ? '+' : ''}{totalReturnPct.toFixed(2)}% de retorno total
          </div>
        </div>

        <div className="resumo-metric-card">
          <div className="resumo-card-header">
            <span className="resumo-card-label">Desempenho vs. CDI</span>
            <Percent size={20} color="#fbbf24" />
          </div>
          <div className="resumo-card-value" style={{ color: '#fbbf24' }}>
            {pctOfCdi > 0 ? `${pctOfCdi.toFixed(0)}%` : '0%'} <span style={{ fontSize: '0.85rem', fontWeight: 500 }}>do CDI</span>
          </div>
          <div className="resumo-card-sub">
            {metrics?.comparisons?.alphaVsCdi >= 0 
              ? `Superando o CDI em +${metrics?.comparisons?.alphaVsCdi}%`
              : `Referência CDI: ${metrics?.benchmarks?.cdi || 11.25}% a.a.`}
          </div>
        </div>

        <div className="resumo-metric-card">
          <div className="resumo-card-header">
            <span className="resumo-card-label">Proventos Recebidos</span>
            <ShieldCheck size={20} color="#a855f7" />
          </div>
          <div className="resumo-card-value" style={{ color: '#c084fc' }}>
            R$ {totalDividends.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
          </div>
          <div className="resumo-card-sub">
            Dividendos, JCP e FIIs creditados
          </div>
        </div>
      </div>

      {/* 1. Gráfico Principal de Benchmarks Comparativos */}
      <BenchmarkChart userId={userId} />

      {/* 2. Composição e Alocação por Classe */}
      <AllocationPieChart userId={userId} />
    </div>
  );
};

export default Resumo;
