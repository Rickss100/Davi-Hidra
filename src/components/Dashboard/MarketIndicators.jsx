import { useState, useEffect } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import { TrendingUp, DollarSign, Activity } from 'lucide-react';

const MarketIndicators = () => {
  const { usdRate } = usePortfolio();
  const [selic, setSelic] = useState(null);
  const [ipca, setIpca] = useState(null);

  useEffect(() => {
    // Fetch Selic from BCB (432 is Meta Selic)
    fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.432/dados/ultimos/1')
      .then(res => res.json())
      .then(d => {
          if (d && d.length > 0) setSelic(d[0].valor);
      })
      .catch(() => {});

    // Fetch IPCA from BCB (10844 is IPCA 12 meses)
    fetch('https://api.bcb.gov.br/dados/serie/bcdata.sgs.10844/dados/ultimos/1')
      .then(res => res.json())
      .then(data => {
        if (data && data.length > 0) {
          setIpca(data[0].valor);
        }
      })
      .catch(() => {});
  }, []);

  return (
    <div style={{
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
      gap: '16px',
      marginBottom: '24px'
    }}>
      <div style={{ background: '#121214', padding: '16px', borderRadius: '12px', border: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ padding: '10px', background: 'rgba(34, 197, 94, 0.1)', borderRadius: '8px', color: '#22c55e' }}>
          <DollarSign size={24} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa' }}>Dólar Comercial</p>
          <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '18px' }}>R$ {usdRate ? usdRate.toFixed(2).replace('.', ',') : '---'}</h3>
        </div>
      </div>

      <div style={{ background: '#121214', padding: '16px', borderRadius: '12px', border: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ padding: '10px', background: 'rgba(59, 130, 246, 0.1)', borderRadius: '8px', color: '#3b82f6' }}>
          <TrendingUp size={24} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa' }}>Taxa Selic (Meta)</p>
          <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '18px' }}>{selic ? selic + '%' : '---'}</h3>
        </div>
      </div>

      <div style={{ background: '#121214', padding: '16px', borderRadius: '12px', border: '1px solid #27272a', display: 'flex', alignItems: 'center', gap: '16px' }}>
        <div style={{ padding: '10px', background: 'rgba(245, 158, 11, 0.1)', borderRadius: '8px', color: '#f59e0b' }}>
          <Activity size={24} />
        </div>
        <div>
          <p style={{ margin: 0, fontSize: '13px', color: '#a1a1aa' }}>IPCA (12 Meses)</p>
          <h3 style={{ margin: '4px 0 0 0', color: '#fff', fontSize: '18px' }}>{ipca ? ipca + '%' : '---'}</h3>
        </div>
      </div>
    </div>
  );
};

export default MarketIndicators;
