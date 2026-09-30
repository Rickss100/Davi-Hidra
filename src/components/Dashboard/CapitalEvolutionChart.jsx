import React, { useMemo } from 'react';
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts';
import { formatCurrency } from '../../utils/formatters';

const CustomTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div style={{ backgroundColor: '#18181b', border: '1px solid #27272a', padding: '12px', borderRadius: '8px', minWidth: '200px' }}>
        <p style={{ margin: '0 0 8px 0', color: '#fff', fontWeight: 'bold' }}>{label}</p>
        {payload.map((entry, index) => (
          <div key={index} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
            <span style={{ color: entry.color }}>{entry.name}:</span>
            <span style={{ color: '#fff', fontWeight: 'bold' }}>{formatCurrency(entry.value)}</span>
          </div>
        ))}
      </div>
    );
  }
  return null;
};

const CapitalEvolutionChart = ({ transactions, currentTotalValue }) => {
  const chartData = useMemo(() => {
    if (!transactions || transactions.length === 0) return [];

    // Filter only buys and sells
    const trades = transactions.filter(tx => tx.type === 'buy' || tx.type === 'sell');
    if (trades.length === 0) return [];

    // Sort chronologically
    trades.sort((a, b) => new Date(a.date) - new Date(b.date));

    // Group by month-year to create a timeline
    const monthlyData = {};
    let runningCapital = 0;

    trades.forEach(tx => {
      const dateParts = tx.date.split('-');
      if (dateParts.length >= 2) {
        const year = dateParts[0];
        const month = dateParts[1];
        const key = `${year}-${month}`;
        
        const txValue = Number(tx.totalValue) || Number(tx.total_value) || (Number(tx.quantity) * Number(tx.price)) || 0;
        
        if (tx.type === 'buy') {
          runningCapital += txValue;
        } else if (tx.type === 'sell') {
          // Simple subtraction of cash withdrawn
          runningCapital -= txValue; 
          if (runningCapital < 0) runningCapital = 0;
        }

        monthlyData[key] = {
          id: key,
          year: parseInt(year),
          month: parseInt(month),
          capitalAplicado: runningCapital
        };
      }
    });

    const sortedData = Object.values(monthlyData).sort((a, b) => {
      if (a.year !== b.year) return a.year - b.year;
      return a.month - b.month;
    });

    const monthNames = ["Jan", "Fev", "Mar", "Abr", "Mai", "Jun", "Jul", "Ago", "Set", "Out", "Nov", "Dez"];
    
    const displayData = sortedData.map(item => ({
      name: `${monthNames[item.month - 1]}/${item.year.toString().slice(-2)}`,
      "Capital Aplicado": item.capitalAplicado,
      // We don't have historical market value, so we only plot it at the very last point
      "Patrimônio Atual": null
    }));

    // Add current market value to the last point to show the difference today
    if (displayData.length > 0 && currentTotalValue > 0) {
      displayData[displayData.length - 1]["Patrimônio Atual"] = currentTotalValue;
    }

    return displayData;
  }, [transactions, currentTotalValue]);

  if (chartData.length === 0) {
    return (
      <div style={{ height: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#a1a1aa' }}>
        Sem dados de transações para exibir evolução.
      </div>
    );
  }

  return (
    <div style={{ width: '100%', height: '300px', marginTop: '16px' }}>
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 10, bottom: 0 }}>
          <defs>
            <linearGradient id="colorCapital" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#8257e5" stopOpacity={0.3}/>
              <stop offset="95%" stopColor="#8257e5" stopOpacity={0}/>
            </linearGradient>
            <linearGradient id="colorPatrimonio" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#04d361" stopOpacity={0.8}/>
              <stop offset="95%" stopColor="#04d361" stopOpacity={0}/>
            </linearGradient>
          </defs>
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
            tickFormatter={(value) => `R$ ${value >= 1000 ? (value/1000).toFixed(0) + 'k' : value}`}
          />
          <Tooltip content={<CustomTooltip />} />
          
          <Area 
            type="monotone" 
            dataKey="Capital Aplicado" 
            stroke="#8257e5" 
            strokeWidth={2}
            fillOpacity={1} 
            fill="url(#colorCapital)" 
            activeDot={{ r: 6, fill: '#8257e5', stroke: '#18181b', strokeWidth: 2 }}
          />
          
          {/* We use a dot or a very short line for the final Patrimônio Atual */}
          <Area 
            type="monotone" 
            dataKey="Patrimônio Atual" 
            stroke="#04d361" 
            strokeWidth={3}
            fillOpacity={1} 
            fill="url(#colorPatrimonio)" 
            connectNulls={true}
            activeDot={{ r: 6, fill: '#04d361', stroke: '#18181b', strokeWidth: 2 }}
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
};

export default CapitalEvolutionChart;
