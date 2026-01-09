import { useState, useMemo } from 'react';
import { Plus, Trash2, Search, AlertCircle, X, ChevronDown, ChevronUp } from 'lucide-react';
import './AssetSelectionStep.css';

import { ASSETS_DB } from '../../data/assets';

// Use shared DB
const MOCK_TICKERS = ASSETS_DB;

const AssetSelectionStep = ({ title, assets, onUpdate, type, totalRequired = 100 }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTicker, setSelectedTicker] = useState('');
  const [targetPercentage, setTargetPercentage] = useState('');
  const [showDropdown, setShowDropdown] = useState(false);

  const currentTotal = assets.reduce((sum, asset) => sum + asset.target, 0);
  const isValid = Math.abs(currentTotal - 100) < 0.1; // Allow small float diff

  const filteredTickers = useMemo(() => {
    return MOCK_TICKERS.filter(t => 
      t.type === type && // Filter by type
      t.ticker.toLowerCase().includes(searchTerm.toLowerCase()) && 
      !assets.find(a => a.ticker === t.ticker) // Exclude already added
    );
  }, [searchTerm, assets, type]);

  const handleAddAsset = () => {
    if (selectedTicker && targetPercentage) {
      onUpdate([
        ...assets, 
        { ticker: selectedTicker, target: parseFloat(targetPercentage) }
      ]);
      resetModal();
    }
  };

  const removeAsset = (ticker) => {
    onUpdate(assets.filter(a => a.ticker !== ticker));
  };

  const updateAssetPercentage = (ticker, newTarget) => {
    onUpdate(assets.map(a => 
      a.ticker === ticker ? { ...a, target: parseFloat(newTarget) || 0 } : a
    ));
  };

  const resetModal = () => {
    setIsModalOpen(false);
    setSearchTerm('');
    setSelectedTicker('');
    setTargetPercentage('');
    setShowDropdown(false);
  };

  return (
    <div className="asset-selection-step">
      <div className="step-question">
        {title}
      </div>

      <div className="assets-summary">
        <span className="label">TOTAL</span>
        <span className={`value ${isValid ? 'valid' : 'invalid'}`}>
          {currentTotal.toFixed(2)}%
        </span>
      </div>

      <div className="assets-list-header">
        <span>Ativo</span>
        <span>%</span>
      </div>

      <div className="assets-list">
        {assets.map(asset => (
          <div key={asset.ticker} className="asset-row">
            <span className="asset-ticker">{asset.ticker}</span>
            <div className="asset-input-wrapper">
              <input 
                type="number" 
                value={asset.target}
                onChange={(e) => updateAssetPercentage(asset.ticker, e.target.value)}
              />
              <span className="symbol">%</span>
            </div>
            <button className="btn-remove" onClick={() => removeAsset(asset.ticker)}>
                <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      <button className="btn-add-asset" onClick={() => setIsModalOpen(true)}>
        <Plus size={16} /> Adicionar Ação
      </button>

      {!isValid && (
        <div className="validation-error">
          <AlertCircle size={16} />
          O somatório precisa ser igual a 100%
        </div>
      )}

      {/* Modal */}
      {isModalOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h3>Adicionar Ação</h3>
              <button className="btn-close" onClick={resetModal}>
                <X size={20} />
              </button>
            </div>

            <div className="modal-body">
              <label>Qual o seu objetivo com esta ação?</label>
              
              <div className="search-wrapper">
                 <div className="search-input-box">
                     <input 
                        type="text" 
                        placeholder="Pesquisar..." 
                        value={searchTerm}
                        onChange={(e) => {
                            setSearchTerm(e.target.value);
                            setShowDropdown(true);
                        }}
                        onFocus={() => {
                           setShowDropdown(true);
                        }}
                    />
                    <ChevronDown size={16} className="search-icon" />
                 </div>
                 
                 {/* Dropdown implementation */}
                 {showDropdown && filteredTickers.length > 0 && (
                     <div className="dropdown-list">
                        {filteredTickers.map(item => (
                            <div 
                                key={item.ticker} 
                                className="dropdown-item"
                                onClick={() => {
                                    setSelectedTicker(item.ticker);
                                    setSearchTerm(item.ticker);
                                    setShowDropdown(false);
                                }}
                            >
                                {item.ticker}
                            </div>
                        ))}
                     </div>
                 )}
              </div>

              <div className="input-label-group" style={{ marginTop: '1.5rem' }}>
                <label>Objetivo</label>
                <div className="percentage-input-wrapper">
                    <input 
                        type="number" 
                        value={targetPercentage}
                        onChange={(e) => setTargetPercentage(e.target.value)}
                    />
                    <span className="percentage-symbol">%</span>
                </div>
              </div>
            </div>

            <div className="modal-footer">
              <button className="btn-cancel" onClick={resetModal}>Cancelar</button>
              <button 
                className="btn-next" 
                onClick={handleAddAsset}
                disabled={!selectedTicker || !targetPercentage}
              >
                Adicionar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AssetSelectionStep;
