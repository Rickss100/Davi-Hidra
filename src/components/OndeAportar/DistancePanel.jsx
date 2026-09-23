import { useState } from 'react';
import { ChevronDown, ChevronUp, HelpCircle } from 'lucide-react';
import { calculateCategoryDistances, calculateAssetDistances } from '../../utils/calculateInvestmentSuggestions';
import './DistancePanel.css';

const DistancePanel = ({ holdings, macroAllocation, assetTargets, totalValue }) => {
  const [expandedCategory, setExpandedCategory] = useState(null);

  const categoryDistances = calculateCategoryDistances(holdings, macroAllocation, totalValue);

  const toggleCategory = (category) => {
    setExpandedCategory(expandedCategory === category ? null : category);
  };

  const getCategoryAssets = (category) => {
    const catDist = categoryDistances.find(c => c.category === category);
    if (!catDist) return [];

    if (category === 'fixed') {
      const fixedTargets = assetTargets['fixed'] || [];
      if (fixedTargets.length === 0) {
        return [{
          ticker: 'Reserva / Renda Fixa Geral',
          distance: catDist.distance
        }];
      }
    }

    return calculateAssetDistances(
      holdings,
      assetTargets,
      category,
      totalValue,
      catDist.targetPercent
    );
  };

  return (
    <div className="distance-panel">
      <div className="distance-panel-header">
        <div className="header-title">
          <span className="icon-target">🎯</span>
          <h3>Distância para o objetivo</h3>
        </div>
        <HelpCircle size={18} className="help-icon" />
      </div>

      <div className="distance-list">
        <div className="distance-list-header">
          <span>Ativo</span>
        </div>

        {categoryDistances.map(catDist => (
          <div key={catDist.category} className="distance-category">
            <div 
              className="distance-item"
              onClick={() => toggleCategory(catDist.category)}
            >
              <div className="distance-item-left">
                <span className="category-name">{catDist.name}</span>
                <button className="btn-expand">
                  {expandedCategory === catDist.category ? (
                    <ChevronUp size={16} />
                  ) : (
                    <ChevronDown size={16} />
                  )}
                </button>
              </div>
              <span className={`distance-value ${catDist.distance > 0 ? 'positive' : 'negative'}`}>
                {catDist.distance > 0 ? '+' : ''}{catDist.distance.toFixed(2)}%
              </span>
            </div>

            {expandedCategory === catDist.category && (
              <div className="asset-details">
                <div className="asset-details-header">
                  <span>Ativo</span>
                  <span>Distância do Obj.</span>
                </div>
                {getCategoryAssets(catDist.category).map(asset => (
                  <div key={asset.ticker} className="asset-detail-row">
                    <span className="asset-ticker">{asset.ticker}</span>
                    <span className={`asset-distance ${asset.distance > 0 ? 'positive' : 'negative'}`}>
                      {asset.distance > 0 ? '+' : ''}{asset.distance.toFixed(2)}%
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default DistancePanel;
