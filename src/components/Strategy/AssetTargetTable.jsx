import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import './Strategy.css';

const AssetTargetTable = ({ title, assets, onUpdate }) => {
  const [newAsset, setNewAsset] = useState({ code: '', sector: '', target: '' });

  const handleAdd = () => {
    if (newAsset.code && newAsset.target) {
      onUpdate([...assets, { ...newAsset, target: Number(newAsset.target) }]);
      setNewAsset({ code: '', sector: '', target: '' });
    }
  };

  const handleDelete = (index) => {
    const updated = assets.filter((_, i) => i !== index);
    onUpdate(updated);
  };

  const handleEdit = (index, field, value) => {
    const updated = [...assets];
    updated[index] = { ...updated[index], [field]: field === 'target' ? Number(value) : value };
    onUpdate(updated);
  };

  // Group by sector for summary
  const sectorSummary = assets.reduce((acc, asset) => {
    const sector = asset.sector || 'Outros';
    acc[sector] = (acc[sector] || 0) + (asset.target || 0);
    return acc;
  }, {});

  const totalPorcentagem = assets.reduce((sum, a) => sum + (a.target || 0), 0);

  return (
    <div className="strategy-card asset-table-card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-body">
        <p className="instruction-text">
          Da seção de {title.toUpperCase()} da sua carteira, registre os que deseja ter e o objetivo de cada um:
        </p>

        <table className="asset-table">
          <thead>
            <tr>
              <th>Código</th>
              <th>Setor</th>
              <th>%</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {assets.map((asset, index) => (
              <tr key={index}>
                <td>
                  <input 
                    value={asset.code} 
                    onChange={(e) => handleEdit(index, 'code', e.target.value)} 
                    className="table-input"
                  />
                </td>
                <td>
                  <input 
                    value={asset.sector} 
                    onChange={(e) => handleEdit(index, 'sector', e.target.value)} 
                    className="table-input"
                  />
                </td>
                <td>
                  <input 
                    type="number"
                    value={asset.target} 
                    onChange={(e) => handleEdit(index, 'target', e.target.value)} 
                    className="table-input center-text"
                  />
                </td>
                <td>
                  <button onClick={() => handleDelete(index)} className="icon-btn">
                    <Trash2 size={16} />
                  </button>
                </td>
              </tr>
            ))}
            {/* Input Row */}
            <tr className="input-row">
              <td>
                <input 
                  placeholder="Novo"
                  value={newAsset.code}
                  onChange={(e) => setNewAsset({...newAsset, code: e.target.value})}
                  className="table-input"
                />
              </td>
              <td>
                <input 
                   placeholder="Setor"
                   value={newAsset.sector}
                   onChange={(e) => setNewAsset({...newAsset, sector: e.target.value})}
                   className="table-input"
                />
              </td>
              <td>
                <input 
                   placeholder="%"
                   type="number"
                   value={newAsset.target}
                   onChange={(e) => setNewAsset({...newAsset, target: e.target.value})}
                   className="table-input center-text"
                />
              </td>
              <td>
                <button onClick={handleAdd} className="icon-btn add-btn">
                  <Plus size={16} />
                </button>
              </td>
            </tr>
          </tbody>
        </table>
        
        <div className="sector-summary">
          <h4>Resumo por Setor</h4>
          <ul>
            {Object.entries(sectorSummary).map(([sector, total]) => (
              <li key={sector}>
                <span>{sector}</span>
                <span>{total}%</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
};

export default AssetTargetTable;
