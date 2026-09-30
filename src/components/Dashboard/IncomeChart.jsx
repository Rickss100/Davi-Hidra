import React, { useMemo } from 'react';
import { ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const IncomeChart = ({ transactions }) => {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Filter only events
    const events = transactions.filter(tx => tx.type === 'event');
    
    // Group by month-year
    const monthlyData = {};
    events.forEach(tx => {
      // Assuming tx.date is YYYY-MM-DD
      const dateParts = tx.date.split('-');
      if (dateParts.length >= 2) {
        const year = dateParts[0];
        const month = dateParts[1];
        const key = `${year}-${month}`;
        
        if (!monthlyData[key]) {
          monthlyData[key] = {
            id: key,
            year: parseInt(year),
            month: parseInt(month),
            total: 0
          };
        }
        monthlyData[key].total += (Number(tx.totalValue) || Number(tx.total_value) || 0);
      }
    });

    // Convert to array and sort chronologically
    const sortedData = Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    // Format for display (e.g. "Jan/26")
    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    // If we have more than 6 months, slice the last 6 to keep it clean, or keep up to 12
    const displayData = sortedData.slice(-12).map(item => ({
      name: `${monthNames[item.month - 1]}/${item.year.toString().slice(-2)}`,
      valor: item.total
    }));

    return displayData;
  }, [transactions]);

  if (chartData.length === 0) {
    return (
      <div style={{ height: '250px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
        Nenhum provento recebido ainda.
      </div>
    );
  }

  return (
    <div style={{ height: '250px', width: '100%', marginTop: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#27272a" vertical={false} />
          <XAxis 
            dataKey="name" 
            tick={{ fill: '#a1a1aa', fontSize: 12 }} 
            axisLine={false} 
            tickLine={false} 
          />
          <YAxis 
            tick={{ fill: '#a1a1aa', fontSize: 12 }} 
            axisLine={false} 
            tickLine={false}
            tickFormatter={(value) => `R$ ${value}`}
          />
          <Tooltip 
            cursor={{ fill: '#27272a', opacity: 0.4 }}
            contentStyle={{ backgroundColor: '#18181b', border: '1px solid #27272a', borderRadius: '8px', color: '#fff' }}
            itemStyle={{ color: '#22c55e' }}
            formatter={(value) => [formatCurrency(value), 'Proventos']}
          />
          <Bar dataKey="valor" fill="#22c55e" radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default IncomeChart;
