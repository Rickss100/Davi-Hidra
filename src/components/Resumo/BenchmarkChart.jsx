import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  LineChart, 
  Line, 
  XAxis, 
  YAxis, 
  Tooltip, 
  Legend, 
  CartesianGrid 
} from 'recharts';
import { TrendingUp, HelpCircle } from 'lucide-react';
import './BenchmarkChart.css';

const BenchmarkChart = ({ userId = 1 }) => {
  const [period, setPeriod] = useState('12m'); // '6m', 'ytd', '12m', '24m', 'total'
  const [chartData, setChartData] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Controle de visibilidade das curvas
  const [visibleSeries, setVisibleSeries] = useState({
    carteira: true,
    sp500: true,
    ibov: true,
    cdi: true,
    ipca: true,
    ifix: false // Desligado por padrão para manter o gráfico limpo, clicável para ligar
  });

  const [hasInvestments, setHasInvestments] = useState(false);

  useEffect(() => {
    const fetchBenchmark = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/resumo/benchmark-data?userId=${userId}&period=${period}`);
        if (res.ok) {
          const data = await res.json();
          setChartData(data.dataPoints || []);
          setHasInvestments(Boolean(data.hasInvestments));
        }
      } catch (err) {
        console.error('Erro ao buscar benchmark:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchBenchmark();
  }, [userId, period]);

  const toggleSerie = (key) => {
    setVisibleSeries(prev => ({ ...prev, [key]: !prev[key] }));
  };

  // Valores acumulados do último ponto
  const lastPoint = chartData[chartData.length - 1] || {};

  // Custom Tooltip formatado
  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div style={{
          background: '#18181c',
          border: '1px solid #323238',
          borderRadius: '6px',
          padding: '0.75rem 1rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          <div style={{ color: '#9ca3af', fontSize: '0.75rem', fontWeight: 600, marginBottom: '0.4rem' }}>
            {label}
          </div>
          {payload.map((entry) => (
            <div key={entry.name} style={{ display: 'flex', justifyContent: 'space-between', gap: '1rem', fontSize: '0.8rem', padding: '2px 0' }}>
              <span style={{ color: entry.color, fontWeight: 600 }}>{entry.name}:</span>
              <span style={{ color: '#fff', fontWeight: 700 }}>
                {entry.value > 0 ? `+${entry.value.toFixed(2)}%` : `${entry.value.toFixed(2)}%`}
              </span>
            </div>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className="benchmark-card">
      <div className="benchmark-card-header">
        <div className="benchmark-title">
          <h2>
            <TrendingUp size={22} color="#04d361" />
            Rentabilidade Relativa vs. Benchmarks
          </h2>
          <p>
            Compare o retorno acumulado da sua carteira contra os principais índices do mercado (EUA, Brasil e Renda Fixa).
          </p>
        </div>

        <div className="period-buttons-group">
          <button 
            type="button" 
            className={`btn-period ${period === '6m' ? 'active' : ''}`}
            onClick={() => setPeriod('6m')}
          >
            6M
          </button>
          <button 
            type="button" 
            className={`btn-period ${period === 'ytd' ? 'active' : ''}`}
            onClick={() => setPeriod('ytd')}
          >
            YTD
          </button>
          <button 
            type="button" 
            className={`btn-period ${period === '12m' ? 'active' : ''}`}
            onClick={() => setPeriod('12m')}
          >
            12M
          </button>
          <button 
            type="button" 
            className={`btn-period ${period === '24m' ? 'active' : ''}`}
            onClick={() => setPeriod('24m')}
          >
            24M
          </button>
          <button 
            type="button" 
            className={`btn-period ${period === 'total' ? 'active' : ''}`}
            onClick={() => setPeriod('total')}
          >
            Total
          </button>
        </div>
      </div>

      {/* Banner de Orientação para Carteira Nova */}
      {!hasInvestments && (
        <div style={{
          margin: '0 0 16px 0',
          padding: '10px 14px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '8px',
          fontSize: '12px',
          color: '#bae6fd',
          display: 'flex',
          alignItems: 'center',
          gap: '8px'
        }}>
          <span style={{ fontSize: '15px' }}>💡</span>
          <span>
            <strong>Carteira nova sem aportes cadastrados (0,00%).</strong> Os índices de mercado abaixo (S&P 500, Ibovespa, CDI, IPCA) estão exibidos como referência comparativa para quando você registrar seus primeiros investimentos.
          </span>
        </div>
      )}

      {/* Barra de Filtro das Curvas do Gráfico */}
      <div className="benchmark-toggles-bar">
        <button
          type="button"
          className={`benchmark-toggle-btn ${visibleSeries.carteira ? 'active' : ''}`}
          onClick={() => toggleSerie('carteira')}
          style={{ borderColor: visibleSeries.carteira ? '#04d361' : undefined }}
        >
          <span className="toggle-circle" style={{ background: '#04d361' }}></span>
          <span>Sua Carteira ({hasInvestments && lastPoint.carteira != null ? `${lastPoint.carteira > 0 ? '+' : ''}${lastPoint.carteira}%` : '0,00%'})</span>
        </button>

        <button
          type="button"
          className={`benchmark-toggle-btn ${visibleSeries.sp500 ? 'active' : ''}`}
          onClick={() => toggleSerie('sp500')}
          style={{ borderColor: visibleSeries.sp500 ? '#38bdf8' : undefined }}
        >
          <span className="toggle-circle" style={{ background: '#38bdf8' }}></span>
          <span>S&P 500 (EUA) ({lastPoint.sp500 != null ? `${lastPoint.sp500 > 0 ? '+' : ''}${lastPoint.sp500}%` : '0%'})</span>
        </button>

        <button
          type="button"
          className={`benchmark-toggle-btn ${visibleSeries.ibov ? 'active' : ''}`}
          onClick={() => toggleSerie('ibov')}
          style={{ borderColor: visibleSeries.ibov ? '#a855f7' : undefined }}
        >
          <span className="toggle-circle" style={{ background: '#a855f7' }}></span>
          <span>Ibovespa / B3 ({lastPoint.ibov != null ? `${lastPoint.ibov > 0 ? '+' : ''}${lastPoint.ibov}%` : '0%'})</span>
        </button>

        <button
          type="button"
          className={`benchmark-toggle-btn ${visibleSeries.cdi ? 'active' : ''}`}
          onClick={() => toggleSerie('cdi')}
          style={{ borderColor: visibleSeries.cdi ? '#fbbf24' : undefined }}
        >
          <span className="toggle-circle" style={{ background: '#fbbf24' }}></span>
          <span>Selic / CDI ({lastPoint.cdi != null ? `+${lastPoint.cdi}%` : '0%'})</span>
        </button>

        <button
          type="button"
          className={`benchmark-toggle-btn ${visibleSeries.ipca ? 'active' : ''}`}
          onClick={() => toggleSerie('ipca')}
          style={{ borderColor: visibleSeries.ipca ? '#f97316' : undefined }}
        >
          <span className="toggle-circle" style={{ background: '#f97316' }}></span>
          <span>IPCA / Inflação ({lastPoint.ipca != null ? `+${lastPoint.ipca}%` : '0%'})</span>
        </button>

        <button
          type="button"
          className={`benchmark-toggle-btn ${visibleSeries.ifix ? 'active' : ''}`}
          onClick={() => toggleSerie('ifix')}
          style={{ borderColor: visibleSeries.ifix ? '#ec4899' : undefined }}
        >
          <span className="toggle-circle" style={{ background: '#ec4899' }}></span>
          <span>IFIX (FIIs) ({lastPoint.ifix != null ? `${lastPoint.ifix > 0 ? '+' : ''}${lastPoint.ifix}%` : '0%'})</span>
        </button>
      </div>

      {/* Gráfico Recharts */}
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#29292e" vertical={false} />
            <XAxis dataKey="date" stroke="#6b7280" tick={{ fontSize: 11 }} />
            <YAxis stroke="#6b7280" tick={{ fontSize: 11 }} tickFormatter={(val) => `${val}%`} />
            <Tooltip content={<CustomTooltip />} />

            {visibleSeries.carteira && (
              <Line 
                type="monotone" 
                dataKey="carteira" 
                name="Sua Carteira" 
                stroke="#04d361" 
                strokeWidth={3} 
                dot={{ r: 3, fill: '#04d361' }} 
                activeDot={{ r: 6 }} 
              />
            )}

            {visibleSeries.sp500 && (
              <Line 
                type="monotone" 
                dataKey="sp500" 
                name="S&P 500 (EUA)" 
                stroke="#38bdf8" 
                strokeWidth={2} 
                dot={false} 
              />
            )}

            {visibleSeries.ibov && (
              <Line 
                type="monotone" 
                dataKey="ibov" 
                name="Ibovespa" 
                stroke="#a855f7" 
                strokeWidth={2} 
                dot={false} 
              />
            )}

            {visibleSeries.cdi && (
              <Line 
                type="monotone" 
                dataKey="cdi" 
                name="Selic / CDI" 
                stroke="#fbbf24" 
                strokeWidth={2} 
                strokeDasharray="4 4" 
                dot={false} 
              />
            )}

            {visibleSeries.ipca && (
              <Line 
                type="monotone" 
                dataKey="ipca" 
                name="IPCA (Inflação)" 
                stroke="#f97316" 
                strokeWidth={1.5} 
                strokeDasharray="2 2" 
                dot={false} 
              />
            )}

            {visibleSeries.ifix && (
              <Line 
                type="monotone" 
                dataKey="ifix" 
                name="IFIX (FIIs)" 
                stroke="#ec4899" 
                strokeWidth={1.5} 
                dot={false} 
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* Comparativo de Desempenho no Rodapé */}
      <div className="benchmark-comparison-footer">
        <div className="comparison-box">
          <span className="comparison-box-label">Sua Carteira</span>
          <span className="comparison-box-val" style={{ color: hasInvestments ? '#04d361' : '#94a3b8' }}>
            {hasInvestments && lastPoint.carteira != null 
              ? `${lastPoint.carteira > 0 ? '+' : ''}${lastPoint.carteira.toFixed(2)}%` 
              : '0,00%'}
          </span>
          <span className="comparison-box-sub">
            {hasInvestments ? 'Retorno total consolidado' : 'Aguardando primeiros aportes'}
          </span>
        </div>

        <div className="comparison-box">
          <span className="comparison-box-label">Alfa vs. CDI</span>
          <span className="comparison-box-val" style={{ color: !hasInvestments ? '#94a3b8' : ((lastPoint.carteira - lastPoint.cdi) >= 0 ? '#04d361' : '#f87171') }}>
            {hasInvestments && lastPoint.carteira != null && lastPoint.cdi != null 
              ? `${(lastPoint.carteira - lastPoint.cdi) > 0 ? '+' : ''}${(lastPoint.carteira - lastPoint.cdi).toFixed(2)}%`
              : '—'}
          </span>
          <span className="comparison-box-sub">
            {hasInvestments ? 'Retorno excedente ao risco zero' : 'Sem histórico para comparar'}
          </span>
        </div>

        <div className="comparison-box">
          <span className="comparison-box-label">Alfa vs. Ibovespa</span>
          <span className="comparison-box-val" style={{ color: !hasInvestments ? '#94a3b8' : ((lastPoint.carteira - lastPoint.ibov) >= 0 ? '#04d361' : '#f87171') }}>
            {hasInvestments && lastPoint.carteira != null && lastPoint.ibov != null 
              ? `${(lastPoint.carteira - lastPoint.ibov) > 0 ? '+' : ''}${(lastPoint.carteira - lastPoint.ibov).toFixed(2)}%`
              : '—'}
          </span>
          <span className="comparison-box-sub">
            {hasInvestments ? 'Superação do mercado BR' : 'Sem histórico para comparar'}
          </span>
        </div>

        <div className="comparison-box">
          <span className="comparison-box-label">Ganho Real (Acima do IPCA)</span>
          <span className="comparison-box-val" style={{ color: !hasInvestments ? '#94a3b8' : ((lastPoint.carteira - lastPoint.ipca) >= 0 ? '#04d361' : '#f87171') }}>
            {hasInvestments && lastPoint.carteira != null && lastPoint.ipca != null 
              ? `${(lastPoint.carteira - lastPoint.ipca) > 0 ? '+' : ''}${(lastPoint.carteira - lastPoint.ipca).toFixed(2)}%`
              : '—'}
          </span>
          <span className="comparison-box-sub">
            {hasInvestments ? 'Aumento de poder de compra' : 'Sem histórico para comparar'}
          </span>
        </div>
      </div>
    </div>
  );
};

export default BenchmarkChart;
