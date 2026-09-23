import { useState, useEffect } from 'react';
import { 
  TrendingUp, 
  DollarSign, 
  Calendar, 
  ShieldCheck, 
  Flame, 
  RotateCw, 
  CheckCircle2, 
  ArrowRight 
} from 'lucide-react';
import './FutureIncomeForecast.css';

const FutureIncomeForecast = ({ currentEquity = 50000, monthlyExpense = 3000 }) => {
  const [months, setMonths] = useState(36); // 3 anos default
  const [monthlyContribution, setMonthlyContribution] = useState(1500);
  const [dividendYield, setDividendYield] = useState(8.5); // 8.5% a.a.
  const [reinvest, setReinvest] = useState(true); // Efeito Bola de Neve
  const [forecastData, setForecastData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchForecast = async () => {
      try {
        setIsLoading(true);
        const query = new URLSearchParams({
          currentEquity: String(currentEquity),
          monthlyContribution: String(monthlyContribution),
          months: String(months),
          dividendYield: String(dividendYield),
          reinvest: String(reinvest)
        });

        const res = await fetch(`/api/dividends/forecast?${query.toString()}`);
        if (res.ok) {
          const data = await res.json();
          setForecastData(data);
        }
      } catch (err) {
        console.error('Erro na projeção:', err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchForecast();
  }, [currentEquity, monthlyContribution, months, dividendYield, reinvest]);

  // Data futura formatada
  const targetDate = new Date();
  targetDate.setMonth(targetDate.getMonth() + months);
  const formattedFutureDate = targetDate.toLocaleDateString('pt-BR', { month: 'long', year: 'numeric' });

  // Cobertura do orçamento
  const finalMonthlyIncome = forecastData?.finalMonthlyIncome || 0;
  const coveragePercent = monthlyExpense > 0 
    ? Math.min(200, (finalMonthlyIncome / monthlyExpense) * 100) 
    : 100;

  return (
    <div className="forecast-container">
      <div className="forecast-header">
        <h2>
          <TrendingUp size={24} color="#04d361" />
          Previsão de Renda Passiva Futura & Orçamento
        </h2>
        <p>
          Simule o poder dos juros compostos e o Efeito Bola de Neve na data futura de sua escolha.
        </p>
      </div>

      {/* Aviso quando carteira está iniciando do zero */}
      {currentEquity === 0 && (
        <div style={{
          margin: '0 0 16px 0',
          padding: '12px 16px',
          background: 'rgba(56, 189, 248, 0.08)',
          border: '1px solid rgba(56, 189, 248, 0.25)',
          borderRadius: '8px',
          fontSize: '13px',
          color: '#bae6fd',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}>
          <span style={{ fontSize: '18px' }}>🌱</span>
          <span>
            <strong>Iniciando do zero (Patrimônio R$ 0,00):</strong> Este simulador projeta a construção da sua renda passiva futura a partir do seu aporte mensal recorrente e o reinvestimento dos proventos.
          </span>
        </div>
      )}

      <div className="forecast-grid">
        {/* Painel Esquerdo: Controles e Parâmetros */}
        <div className="forecast-controls-card">
          <div style={{
            background: 'rgba(255, 255, 255, 0.03)',
            padding: '10px 12px',
            borderRadius: '6px',
            marginBottom: '1rem',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            fontSize: '12px',
            color: '#9ca3af'
          }}>
            <span>Patrimônio Atual em Carteira:</span>
            <strong style={{ color: currentEquity > 0 ? '#04d361' : '#f1f5f9', fontSize: '13px' }}>
              R$ {Number(currentEquity || 0).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
            </strong>
          </div>

          <div className="forecast-form-group">
            <label>Horizonte de Tempo: <strong>{months} meses ({(months / 12).toFixed(1)} anos)</strong></label>
            <input
              type="range"
              min="6"
              max="240"
              step="6"
              value={months}
              onChange={(e) => setMonths(parseInt(e.target.value))}
              style={{ width: '100%', accentColor: '#04d361', cursor: 'pointer' }}
            />
            <div className="time-presets-grid">
              <button
                type="button"
                className={`btn-time-preset ${months === 12 ? 'active' : ''}`}
                onClick={() => setMonths(12)}
              >
                1 Ano
              </button>
              <button
                type="button"
                className={`btn-time-preset ${months === 36 ? 'active' : ''}`}
                onClick={() => setMonths(36)}
              >
                3 Anos
              </button>
              <button
                type="button"
                className={`btn-time-preset ${months === 60 ? 'active' : ''}`}
                onClick={() => setMonths(60)}
              >
                5 Anos
              </button>
              <button
                type="button"
                className={`btn-time-preset ${months === 120 ? 'active' : ''}`}
                onClick={() => setMonths(120)}
              >
                10 Anos
              </button>
            </div>
          </div>

          <div className="forecast-form-group">
            <label>Aporte Mensal Pretendido (R$)</label>
            <input
              type="number"
              value={monthlyContribution}
              onChange={(e) => setMonthlyContribution(parseFloat(e.target.value) || 0)}
              step="100"
              min="0"
              style={{
                width: '100%',
                background: '#202024',
                border: '1px solid #323238',
                color: '#fff',
                padding: '0.65rem',
                borderRadius: '6px'
              }}
            />
          </div>

          <div className="forecast-form-group">
            <label>Dividend Yield Médio da Carteira (% a.a.)</label>
            <input
              type="number"
              value={dividendYield}
              onChange={(e) => setDividendYield(parseFloat(e.target.value) || 0)}
              step="0.5"
              min="1"
              max="20"
              style={{
                width: '100%',
                background: '#202024',
                border: '1px solid #323238',
                color: '#fff',
                padding: '0.65rem',
                borderRadius: '6px'
              }}
            />
          </div>

          <div className="forecast-form-group" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginTop: '1.25rem' }}>
            <input
              type="checkbox"
              id="reinvest-check"
              checked={reinvest}
              onChange={(e) => setReinvest(e.target.checked)}
              style={{ width: '18px', height: '18px', accentColor: '#04d361', cursor: 'pointer' }}
            />
            <label htmlFor="reinvest-check" style={{ margin: 0, textTransform: 'none', cursor: 'pointer', color: '#f3f4f6' }}>
              <strong>Efeito Bola de Neve:</strong> Reinvestir 100% dos proventos recebidos
            </label>
          </div>
        </div>

        {/* Painel Direito: Resultados e Cobertura */}
        <div className="forecast-results-card">
          <div className="forecast-highlight-box">
            <div className="highlight-label">Renda Passiva Mensal Prevista em {formattedFutureDate}</div>
            <div className="highlight-amount">
              R$ {finalMonthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
              <span style={{ fontSize: '1rem', fontWeight: 500, color: '#9ca3af' }}>/mês</span>
            </div>
            <div className="highlight-subtitle">
              Ou R$ {(finalMonthlyIncome * 12).toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} por ano
            </div>
          </div>

          <div className="forecast-stats-grid">
            <div className="forecast-stat-item">
              <div className="stat-item-label">Patrimônio Acumulado</div>
              <div className="stat-item-val" style={{ color: '#04d361' }}>
                R$ {forecastData?.finalEquity?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>

            <div className="forecast-stat-item">
              <div className="stat-item-label">Proventos Totais no Período</div>
              <div className="stat-item-val" style={{ color: '#38bdf8' }}>
                R$ {forecastData?.totalDividendsReceived?.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
              </div>
            </div>
          </div>

          {/* Cobertura do Orçamento Essencial */}
          <div className="independence-progress-box">
            <div className="independence-header">
              <span style={{ color: '#f3f4f6', fontWeight: 600 }}>
                Cobertura do Custo de Vida (R$ {Number(monthlyExpense).toFixed(0)}/mês):
              </span>
              <strong style={{ color: coveragePercent >= 100 ? '#04d361' : '#fbbf24' }}>
                {coveragePercent.toFixed(1)}%
              </strong>
            </div>

            <div className="independence-track">
              <div 
                className="independence-fill"
                style={{ 
                  width: `${Math.min(100, coveragePercent)}%`,
                  background: coveragePercent >= 100 ? '#04d361' : 'linear-gradient(90deg, #f59e0b 0%, #10b981 100%)'
                }}
              ></div>
            </div>

            <div className="independence-text">
              {coveragePercent >= 100 ? (
                <span style={{ color: '#04d361' }}>
                  🎉 <strong>Independência Financeira Plena Atingida!</strong> Seus dividendos cobrem 100% das suas contas básicas sem depender de salário.
                </span>
              ) : (
                <span>
                  🛡️ Em {formattedFutureDate}, seus rendimentos cobrirão <strong>{coveragePercent.toFixed(0)}%</strong> do seu orçamento, pagando contas importantes como luz, água e supermercado.
                </span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Tabela de Progressão na Linha do Tempo */}
      {forecastData?.timeline && forecastData.timeline.length > 0 && (
        <div style={{ marginTop: '1.5rem' }}>
          <h4 style={{ margin: '0 0 0.5rem 0', color: '#f3f4f6', fontSize: '0.95rem' }}>
            📅 Evolução Projetada (Efeito Bola de Neve ao longo dos anos)
          </h4>
          <table className="timeline-table">
            <thead>
              <tr>
                <th>PRAZO</th>
                <th>MÊS</th>
                <th>PATRIMÔNIO TOTAL</th>
                <th>RENDA PASSIVA / MÊS</th>
                <th>RENDA ANUAL</th>
              </tr>
            </thead>
            <tbody>
              {forecastData.timeline.map(t => (
                <tr key={t.month}>
                  <td><strong>{t.year} ano(s)</strong></td>
                  <td>Mês {t.month}</td>
                  <td style={{ color: '#04d361', fontWeight: 600 }}>
                    R$ {t.equity.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ color: '#38bdf8', fontWeight: 600 }}>
                    R$ {t.monthlyIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td>R$ {t.annualIncome.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default FutureIncomeForecast;
