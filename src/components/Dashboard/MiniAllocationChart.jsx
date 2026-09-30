import React from 'react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip } from 'recharts';
import { formatCurrency, formatPercent } from '../../utils/formatters';

const COLORS = {
  acoes: '#8b5cf6', // purple
  fiis: '#f59e0b', // amber
  stocks: '#3b82f6', // blue
  reits: '#10b981', // emerald
  fixed: '#ec4899', // pink
  caixa: '#64748b'  // slate
};

const CustomTooltip = ({ active, payload }) => {
  if (active && payload && payload.length) {
    const data = payload[0].payload;
    return (
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '12px', borderRadius: '8px' }}>
        <p style={{ margin: '0 0 4px 0', color: '#fff', fontWeight: 'bold' }}>{data.label}</p>
        <p style={{ margin: 0, color: '#a1a1aa' }}>{formatCurrency(data.total)}</p>
      </div>
    );
  }
  return null;
};

const MiniAllocationChart = ({ holdingsSummary }) => {
  if (!holdingsSummary || holdingsSummary.length === 0) {
    return (
      <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
        Sem ativos na carteira.
      </div>
    );
  }

  const totalValue = holdingsSummary.reduce((acc, curr) => acc + curr.total, 0);

  // Prepare data, sort by total descending
  const data = [...holdingsSummary]
    .filter(h => h.total > 0)
    .sort((a, b) => b.total - a.total);

  return (
    <div style={{ height: '250px', width: '100%', position: 'relative', marginTop: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={60}
            outerRadius={90}
            paddingAngle={2}
            dataKey="total"
            stroke="none"
          >
            {data.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[entry.category] || '#9ca3af'} />
            ))}
          </Pie>
          <Tooltip content={<CustomTooltip />} />
        </PieChart>
      </ResponsiveContainer>
      
      {/* Center text */}
      <div style={{
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        textAlign: 'center',
        pointerEvents: 'none'
      }}>
        <span style={{ display: 'block', fontSize: '12px', color: '#a1a1aa' }}>Total</span>
        <span style={{ display: 'block', fontWeight: 'bold', color: '#fff', fontSize: '14px' }}>
          {data.length} Classes
        </span>
      </div>
    </div>
  );
};

export default MiniAllocationChart;
