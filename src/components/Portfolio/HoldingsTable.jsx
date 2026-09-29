import { usePortfolio } from '../../context/PortfolioContext';
import './Portfolio.css';

const HoldingsTable = ({ category, title, color, ...props }) => {
  const { holdings, usdRate } = usePortfolio();
  const { emergencyReserveSummary } = usePortfolio();
  let assets = holdings[category] || [];
  
  if (category === 'fixed') {
    const reserveCodes = (emergencyReserveSummary?.reserveAssets || []).map(a => a.code);
    if (props.excludeReserve) {
      assets = assets.filter(a => !reserveCodes.includes(a.code));
    }
    if (props.onlyReserve) {
      assets = assets.filter(a => reserveCodes.includes(a.code));
    }
  }

  // Calculate totals for % Real
  const categoryTotal = assets.reduce((sum, asset) => sum + (asset.quantity * asset.currentPrice), 0);
  let portfolioTotal = 0;
  Object.keys(holdings).forEach(cat => {
    const isUs = cat === 'stocks' || cat === 'reits';
    holdings[cat].forEach(h => {
      const val = h.quantity * h.currentPrice;
      portfolioTotal += isUs ? val * usdRate : val;
    });
  });

  if (props.onlyReserve && assets.length === 0) return null;
  
  return (
    <div className="holdings-card" style={{ borderTop: `4px solid ${color}` }}>
      <div className="card-header-row">
        <h3>{title}</h3>
        <div className="card-header-total">
          <span>R$ {categoryTotal.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
          <span className="percent-badge">
            {portfolioTotal > 0 ? ((categoryTotal / portfolioTotal) * 100).toFixed(1) : 0}% Real
          </span>
        </div>
      </div>
      
      <table className="holdings-table">
        <thead>
          <tr>
            <th>Ativo</th>
            <th>Qtd</th>
            <th>Valor Unit.</th>
            <th>Valor Total</th>
            <th>% Real</th>
          </tr>
        </thead>
        <tbody>
          {assets.length === 0 ? (
            <tr><td colSpan="5" className="empty-cell">Nenhum ativo</td></tr>
          ) : (
            assets.map((asset) => {
              const totalValue = asset.quantity * asset.currentPrice;
              const isUsCat = category === 'stocks' || category === 'reits';
              const assetTotalBrl = isUsCat ? totalValue * usdRate : totalValue;
              const percent = categoryTotal > 0 ? (totalValue / categoryTotal) * 100 : 0;
              
              return (
                <tr key={asset.code}>
                  <td className="asset-code">{asset.code}</td>
                  <td>{asset.quantity}</td>
                  <td>R$ {asset.currentPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>{isUsCat ? 'US$ ' : 'R$ '}{totalValue.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</td>
                  <td>{percent.toFixed(1)}%</td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

export default HoldingsTable;
