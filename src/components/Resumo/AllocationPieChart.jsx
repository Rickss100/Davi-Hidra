import { useState, useEffect } from 'react';
import { 
  ResponsiveContainer, 
  PieChart, 
  Pie, 
  Cell, 
  Tooltip 
} from 'recharts';
import { PieChart as PieIcon, Globe } from 'lucide-react';
import './AllocationPieChart.css';

const AllocationPieChart = ({ userId = 1 }) => {
  const [allocationData, setAllocationData] = useState({ categories: [], geography: {} });
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchAllocation = async () => {
      try {
        setIsLoading(true);
        const res = await fetch(`/api/resumo/allocation?userId=${userId}`);
        if (res.ok) {
          const data = await res.json();
          setAllocationData(data);
        }
      } catch (err) {
        console.error('Erro na alocação:', err);
      } finally {
        setIsLoading(false);
      }
    };
    fetchAllocation();
  }, [userId]);

  const CustomPieTooltip = ({ active, payload }) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <div style={{
          background: '#18181c',
          border: `1px solid ${data.color}`,
          borderRadius: '6px',
          padding: '0.65rem 0.85rem',
          boxShadow: '0 4px 12px rgba(0,0,0,0.5)'
        }}>
          <div style={{ color: data.color, fontWeight: 700, fontSize: '0.85rem' }}>
            {data.name}
          </div>
          <div style={{ color: '#fff', fontSize: '0.8rem', marginTop: '3px' }}>
            R$ {data.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ({data.percent}%)
          </div>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="allocation-card">
      <div className="allocation-card-header">
        <h2>
          <PieIcon size={22} color="#04d361" />
          Composição e Desempenho por Classe de Ativo
        </h2>
        <p>
          Distribuição da carteira entre as diferentes classes e exposição internacional.
        </p>
      </div>

      <div className="allocation-grid">
        {/* Gráfico de Rosca */}
        <div className="pie-chart-wrapper">
          <ResponsiveContainer width="100%" height={220}>
            <PieChart>
              <Pie
                data={allocationData.categories}
                dataKey="current"
                nameKey="name"
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={3}
              >
                {allocationData.categories.map((entry) => (
                  <Cell key={`cell-${entry.key}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip content={<CustomPieTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Exposição Geográfica */}
          <div className="geo-exposure-box">
            <div className="geo-item">
              <span>🇧🇷 Brasil:</span>
              <strong style={{ color: '#fff' }}>{allocationData.geography?.brasilPct || 0}%</strong>
            </div>
            <div className="geo-item">
              <span>🇺🇸 Exterior (USD):</span>
              <strong style={{ color: '#38bdf8' }}>{allocationData.geography?.usaPct || 0}%</strong>
            </div>
          </div>
        </div>

        {/* Tabela Tradicional de Performance */}
        <div className="allocation-table-wrapper">
          <table className="allocation-table">
            <thead>
              <tr>
                <th>CLASSE DE ATIVO</th>
                <th>APLICADO (R$)</th>
                <th>ATUAL (R$)</th>
                <th>LUCRO / PREJ.</th>
                <th>RENTAB.</th>
                <th>PARTIC.</th>
              </tr>
            </thead>
            <tbody>
              {allocationData.categories.map(cat => (
                <tr key={cat.key}>
                  <td>
                    <div className="category-badge-cell">
                      <span className="category-color-dot" style={{ background: cat.color }}></span>
                      <span>{cat.name}</span>
                    </div>
                  </td>
                  <td>R$ {cat.invested.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ fontWeight: 600 }}>R$ {cat.current.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td style={{ color: cat.profit >= 0 ? '#04d361' : '#f87171', fontWeight: 600 }}>
                    {cat.profit > 0 ? '+' : ''}R$ {cat.profit.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                  </td>
                  <td style={{ color: cat.returnPct >= 0 ? '#04d361' : '#f87171', fontWeight: 700 }}>
                    {cat.returnPct > 0 ? '+' : ''}{cat.returnPct.toFixed(2)}%
                  </td>
                  <td style={{ fontWeight: 700 }}>{cat.percent.toFixed(1)}%</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default AllocationPieChart;
