import { useState } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import './Strategy.css';

const AssetTargetTable = ({ title, assets, onUpdate, availableAssets }) => {
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

  const handleCodeChange = (e, isNew, index = -1) => {
    const val = e.target.value.toUpperCase();
    let sector = isNew ? newAsset.sector : assets[index].sector;
    
    // Auto-preencher o setor se achar o ativo na lista
    if (availableAssets) {
      const matchedAsset = availableAssets.find(a => a.code.toUpperCase() === val);
      if (matchedAsset && matchedAsset.sector) {
        sector = matchedAsset.sector;
      }
    }

    if (isNew) {
      setNewAsset({ ...newAsset, code: val, sector });
    } else {
      const updated = [...assets];
      updated[index] = { ...updated[index], code: val, sector };
      onUpdate(updated);
    }
  };

  // Group by sector for summary
  const sectorSummary = assets.reduce((acc, asset) => {
    const sector = asset.sector || 'Outros';
    acc[sector] = (acc[sector] || 0) + (asset.target || 0);
    return acc;
  }, {});

  const totalPorcentagem = assets.reduce((sum, a) => sum + (a.target || 0), 0);
  const datalistId = `assets-list-${title.replace(/\s+/g, '')}`;

  return (
    <div className="strategy-card asset-table-card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-body">
        <p className="instruction-text">
          Da seção de {title.toUpperCase()} da sua carteira, registre os que deseja ter e o objetivo de cada um:
        </p>

        {/* Datalist invisível para servir de base para o Autocomplete nativo */}
        {availableAssets && (
          <datalist id={datalistId}>
            {availableAssets
              .filter(a => {
                // Filtra a lista pelo tipo do Card se for possível, ou mostra tudo.
                if (title === 'Ações') return a.type === 'Acao';
                if (title === 'FIIs') return a.type === 'FII';
                if (title === 'Stocks') return a.type === 'Stock';
                if (title === 'REITs') return a.type === 'REIT';
                if (title === 'Renda Fixa') return a.type === 'RendaFixa';
                return true;
              })
              .map(a => (
                <option key={a.code} value={a.code}>{a.name}</option>
              ))
            }
          </datalist>
        )}

        <div style={{ overflowY: 'auto', flex: 1, minHeight: '120px' }} className="custom-scroll">
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
                      list={datalistId}
                      value={asset.code} 
                      onChange={(e) => handleCodeChange(e, false, index)} 
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
                    list={datalistId}
                    placeholder="Novo"
                    value={newAsset.code}
                    onChange={(e) => handleCodeChange(e, true)}
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
        </div>
        
        <div className="sector-summary">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
            <h4 style={{ margin: 0 }}>Resumo por Setor</h4>
            <span style={{ 
              fontSize: '11px', 
              padding: '3px 8px', 
              borderRadius: '12px', 
              backgroundColor: totalPorcentagem === 100 ? '#10b981' : totalPorcentagem > 100 ? '#ef4444' : '#f59e0b',
              color: '#fff',
              fontWeight: 'bold',
              whiteSpace: 'nowrap'
            }}>
              {totalPorcentagem === 100 
                ? '100% (Ok)' 
                : totalPorcentagem > 100 
                  ? `Passou ${totalPorcentagem - 100}%` 
                  : `Falta ${100 - totalPorcentagem}%`}
            </span>
          </div>
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
