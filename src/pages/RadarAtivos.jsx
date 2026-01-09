import { useState, useEffect, useCallback } from 'react';
import DaviFilters from '../components/RadarAtivos/DaviFilters';
import { useToast } from '../context/ToastContext';
import { Star, RefreshCw } from 'lucide-react';
import './RadarAtivos.css';

const RadarAtivos = () => {
  const [activeFilter, setActiveFilter] = useState('Acao'); // Default: Ações
  const [assets, setAssets] = useState([]);
  const [allAssets, setAllAssets] = useState([]); // Unfiltered for count reference
  const [loading, setLoading] = useState(false);
  const [filterText, setFilterText] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [daviFiltersActive, setDaviFiltersActive] = useState({});
  const [editingCell, setEditingCell] = useState(null); // { code, field }
  const [syncing, setSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState({ current: 0, total: 0 });
  const { success, error: showError, info } = useToast();

  // Load assets when filter changes
  useEffect(() => {
    loadAssets(activeFilter);
  }, [activeFilter]);

  const loadAssets = async (type) => {
    setLoading(true);
    try {
      const response = await fetch(`http://localhost:3002/api/assets/with-fundamentals?type=${type}`);
      const data = await response.json();
      setAssets(data);
      setAllAssets(data);
      setDaviFiltersActive({}); // Reset DAVI filters when changing type
    } catch (err) {
      console.error('Failed to load assets:', err);
      setAssets([]);
      setAllAssets([]);
    } finally {
      setLoading(false);
    }
  };

  // Apply DAVI filters
  const applyDaviFilters = async (filters) => {
    if (Object.keys(filters).length === 0) {
      // No filters, show all assets
      setAssets(allAssets);
      setDaviFiltersActive({});
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('http://localhost:3002/api/assets/filter-davi', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          type: activeFilter,
          filters: filters
        })
      });
      
      const data = await response.json();
      setAssets(data.assets || []);
      setDaviFiltersActive(filters);
      
      const removed = allAssets.length - (data.assets?.length || 0);
      success(`Método DAVI aplicado! ${removed} ativos filtrados.`);
    } catch (err) {
      console.error('Failed to apply DAVI filters:', err);
      showError('Erro ao aplicar filtros. Verifique se o servidor está rodando.');
    } finally {
      setLoading(false);
    }
  };

  const clearDaviFilters = () => {
    setAssets(allAssets);
    setDaviFiltersActive({});
  };

  // Sync data from Brapi API
  const syncData = async () => {
    setSyncing(true);
    setSyncProgress({ current: 0, total: 0 });
    info('Iniciando sincronização... Isso pode levar alguns minutos.');
    
    try {
      const response = await fetch('http://localhost:3002/api/sync/fundamentals-batch', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type: activeFilter, limit: 50 }) // Sync 50 at a time
      });
      
      const data = await response.json();
      
      if (response.ok) {
        success(`Sincronização concluída! ${data.success || 0} ativos atualizados.`);
        // Reload assets to show new data
        loadAssets(activeFilter);
      } else {
        showError(`Erro: ${data.error || 'Falha na sincronização'}`);
      }
    } catch (err) {
      console.error('Sync failed:', err);
      showError('Erro ao sincronizar. Verifique se o servidor está rodando.');
    } finally {
      setSyncing(false);
    }
  };

  // Save user notes to backend
  const saveUserNotes = useCallback(async (assetCode, rating, notes) => {
    try {
      const response = await fetch(`http://localhost:3002/api/assets/${assetCode}/notes`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ rating, notes })
      });
      
      if (response.ok) {
        // Update local state
        const updateAsset = (assetList) => 
          assetList.map(a => 
            a.code === assetCode 
              ? { ...a, user_rating: rating, user_notes: notes }
              : a
          );
        
        setAssets(updateAsset);
        setAllAssets(prev => updateAsset(prev));
        success('Nota salva!');
      }
    } catch (err) {
      console.error('Failed to save notes:', err);
      showError('Erro ao salvar nota');
    }
  }, [success, showError]);

  // Handle rating click
  const handleRatingClick = (assetCode, newRating, currentRating, currentNotes) => {
    const finalRating = newRating === currentRating ? null : newRating; // Toggle off if same
    saveUserNotes(assetCode, finalRating, currentNotes);
  };

  // Handle notes edit
  const handleNotesBlur = (assetCode, newNotes, currentRating) => {
    saveUserNotes(assetCode, currentRating, newNotes);
    setEditingCell(null);
  };

  // Sorting logic
  const sortedData = [...assets].sort((a, b) => {
    if (!sortConfig.key) return 0;
    
    const valA = a[sortConfig.key];
    const valB = b[sortConfig.key];
    
    // Handle null/undefined
    if (valA == null && valB == null) return 0;
    if (valA == null) return 1;
    if (valB == null) return -1;
    
    if (valA < valB) return sortConfig.direction === 'asc' ? -1 : 1;
    if (valA > valB) return sortConfig.direction === 'asc' ? 1 : -1;
    return 0;
  });

  const requestSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // Filter by search text
  const filteredData = sortedData.filter(asset =>
    asset.code.toLowerCase().includes(filterText.toLowerCase()) ||
    (asset.name && asset.name.toLowerCase().includes(filterText.toLowerCase()))
  );

  const formatNumber = (num, decimals = 2) => {
    if (num == null) return '-';
    return Number(num).toFixed(decimals);
  };

  const formatPercent = (num) => {
    if (num == null) return '-';
    return `${Number(num).toFixed(2)}%`;
  };

  const formatMarketCap = (num) => {
    if (num == null) return '-';
    if (num >= 1e9) return `${(num / 1e9).toFixed(1)}B`;
    if (num >= 1e6) return `${(num / 1e6).toFixed(1)}M`;
    return formatNumber(num, 0);
  };

  const formatPrice = (num) => {
    if (num == null) return '-';
    return `R$ ${Number(num).toFixed(2)}`;
  };

  // Extended columns for Ações
  const getColumns = () => {
    if (activeFilter === 'FII') {
      return [
        { key: 'code', label: 'Papel', sticky: true },
        { key: 'price', label: 'Cotação' },
        { key: 'p_vpa', label: 'P/VP' },
        { key: 'dividend_yield', label: 'Div.Yield' },
        { key: 'ffo_yield', label: 'FFO Yield' },
        { key: 'vacancy_rate', label: 'Vacância' },
        { key: 'cap_rate', label: 'Cap Rate' },
        { key: 'liquidity', label: 'Liq.2meses' },
        { key: 'net_equity', label: 'Patrim.Líq' },
        { key: 'property_count', label: 'Qtd Imóveis' },
        { key: 'user_rating', label: 'Nota', editable: true },
        { key: 'user_notes', label: 'Informação', editable: true }
      ];
    }
    // Ações - All requested columns
    return [
      { key: 'code', label: 'Papel', sticky: true },
      { key: 'price', label: 'Cotação' },
      { key: 'pe_ratio', label: 'P/L' },
      { key: 'pb_ratio', label: 'P/VP' },
      { key: 'psr', label: 'PSR' },
      { key: 'dividend_yield', label: 'Div.Yield' },
      { key: 'ev_ebit', label: 'EV/EBIT' },
      { key: 'ev_ebitda', label: 'EV/EBITDA' },
      { key: 'ebit_margin', label: 'Mrg EBIT' },
      { key: 'profit_margin', label: 'Mrg.Líq.' },
      { key: 'current_ratio', label: 'Liq.Corr.' },
      { key: 'roic', label: 'ROIC' },
      { key: 'roe', label: 'ROE' },
      { key: 'liquidity', label: 'Liq.2meses' },
      { key: 'net_equity', label: 'Patrim.Líq' },
      { key: 'debt_to_equity', label: 'Dív/Patrim.' },
      { key: 'revenue_growth_5y', label: 'Cresc.Rec.5a' },
      { key: 'user_rating', label: 'Nota', editable: true },
      { key: 'user_notes', label: 'Informação', editable: true }
    ];
  };

  // Star rating component
  const StarRating = ({ value, onChange }) => {
    return (
      <div className="star-rating">
        {[1, 2, 3, 4, 5].map(star => (
          <Star
            key={star}
            size={14}
            className={`star ${star <= (value || 0) ? 'filled' : ''}`}
            onClick={(e) => {
              e.stopPropagation();
              onChange(star);
            }}
          />
        ))}
      </div>
    );
  };

  const renderCellValue = (asset, key, colDef) => {
    const value = asset[key];
    
    // Editable rating column
    if (key === 'user_rating') {
      return (
        <StarRating 
          value={value} 
          onChange={(newRating) => handleRatingClick(asset.code, newRating, value, asset.user_notes)}
        />
      );
    }
    
    // Editable notes column
    if (key === 'user_notes') {
      const isEditing = editingCell?.code === asset.code && editingCell?.field === 'user_notes';
      
      if (isEditing) {
        return (
          <input
            type="text"
            className="notes-input"
            defaultValue={value || ''}
            autoFocus
            onBlur={(e) => handleNotesBlur(asset.code, e.target.value, asset.user_rating)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                handleNotesBlur(asset.code, e.target.value, asset.user_rating);
              }
              if (e.key === 'Escape') {
                setEditingCell(null);
              }
            }}
          />
        );
      }
      
      return (
        <span 
          className="notes-cell" 
          onClick={() => setEditingCell({ code: asset.code, field: 'user_notes' })}
          title={value || 'Clique para adicionar'}
        >
          {value || <span className="placeholder">+ Adicionar</span>}
        </span>
      );
    }
    
    switch (key) {
      case 'code':
        return <span className="ticker-cell">{value}</span>;
      case 'price':
        return formatPrice(value);
      case 'sector':
        return value || '-';
      case 'dividend_yield':
      case 'roe':
      case 'roic':
      case 'roa':
      case 'ebit_margin':
      case 'profit_margin':
      case 'vacancy_rate':
      case 'cap_rate':
      case 'ffo_yield':
      case 'revenue_growth_5y':
        return formatPercent(value);
      case 'pe_ratio':
      case 'pb_ratio':
      case 'p_vpa':
      case 'current_ratio':
      case 'psr':
      case 'ev_ebit':
      case 'ev_ebitda':
      case 'debt_to_equity':
        return formatNumber(value);
      case 'market_cap':
      case 'liquidity':
      case 'net_equity':
        return formatMarketCap(value);
      case 'property_count':
        return value != null ? value.toString() : '-';
      default:
        return value || '-';
    }
  };

  const columns = getColumns();

  return (
    <div className="radar-page">
      {/* DAVI Filters Sidebar */}
      <DaviFilters
        assetType={activeFilter}
        onApplyFilters={applyDaviFilters}
        onClear={clearDaviFilters}
        totalAssets={allAssets.length}
        filteredCount={assets.length}
      />

      {/* Main Content Area */}
      <div className="radar-main-content">
        <div className="page-header">
          <div className="header-row">
            <div>
              <h1>Radar de Ativos</h1>
              <p>Aplique o Método DAVI para identificar ativos de qualidade</p>
            </div>
            <button 
              className={`sync-button ${syncing ? 'syncing' : ''}`}
              onClick={syncData}
              disabled={syncing}
            >
              <RefreshCw size={18} className={syncing ? 'spin' : ''} />
              {syncing ? 'Sincronizando...' : 'Atualizar Cotações'}
            </button>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="filter-buttons">
          <button
            className={activeFilter === 'RendaFixa' ? 'active' : ''}
            onClick={() => setActiveFilter('RendaFixa')}
            disabled
          >
            Renda Fixa
          </button>
          <button
            className={activeFilter === 'Acao' ? 'active' : ''}
            onClick={() => setActiveFilter('Acao')}
          >
            Ações ({activeFilter === 'Acao' ? allAssets.length : '...'})
          </button>
          <button
            className={activeFilter === 'FII' ? 'active' : ''}
            onClick={() => setActiveFilter('FII')}
          >
            FIIs ({activeFilter === 'FII' ? allAssets.length : '...'})
          </button>
          <button
            className={activeFilter === 'Stock' ? 'active' : ''}
            onClick={() => setActiveFilter('Stock')}
            disabled
          >
            Stocks
          </button>
          <button
            className={activeFilter === 'REIT' ? 'active' : ''}
            onClick={() => setActiveFilter('REIT')}
            disabled
          >
            REITs
          </button>
        </div>

        {/* Search Bar */}
        <div className="control-bar">
          <input
            type="text"
            placeholder="Buscar por código ou nome..."
            value={filterText}
            onChange={e => setFilterText(e.target.value)}
            className="search-input"
          />
          <span className="result-count">
            {filteredData.length} de {allAssets.length} ativos
            {Object.keys(daviFiltersActive).length > 0 && (
              <span className="davi-active-badge">DAVI ativo</span>
            )}
          </span>
        </div>

        {/* Assets Table */}
        <div className="table-container">
          {loading ? (
            <div className="loading-state">
              <div className="spinner"></div>
              <p>Carregando ativos...</p>
            </div>
          ) : filteredData.length === 0 ? (
            <div className="empty-state">
              <p>Nenhum ativo encontrado com os filtros aplicados.</p>
            </div>
          ) : (
            <table className="assets-table">
              <thead>
                <tr>
                  {columns.map(col => (
                    <th 
                      key={col.key}
                      onClick={() => requestSort(col.key)} 
                      className={`sortable ${col.sticky ? 'sticky-col' : ''}`}
                    >
                      {col.label} {sortConfig.key === col.key && (sortConfig.direction === 'asc' ? '▲' : '▼')}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filteredData.map((asset) => (
                  <tr key={asset.code}>
                    {columns.map(col => (
                      <td key={col.key} className={col.sticky ? 'sticky-col' : ''}>
                        {renderCellValue(asset, col.key, col)}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default RadarAtivos;
