import { useState } from 'react';
import { Filter, RotateCcw, Zap, Shield, TrendingUp, ChevronLeft, ChevronRight } from 'lucide-react';
import './DaviFilters.css';

// Preset configurations for DAVI method
const PRESETS = {
  conservador: {
    name: 'Conservador',
    icon: Shield,
    description: 'Filtros rigorosos para máxima segurança',
    acoes: {
      pe_ratio: { max: 12 },
      pb_ratio: { max: 2 },
      dividend_yield: { min: 4 },
      roe: { min: 15 },
      current_ratio: { min: 1.5 },
      debt_to_equity: { max: 0.5 }
    },
    fiis: {
      p_vpa: { min: 0.85, max: 1.05 },
      dividend_yield: { min: 9 },
      vacancy_rate: { max: 5 },
      liquidity: { min: 500000 }
    },
    rendaFixa: {
      dividend_yield: { min: 10 },
      liquidity: { min: 1000000 }
    },
    stocks: {
      pe_ratio: { max: 22 },
      pb_ratio: { max: 4 },
      dividend_yield: { min: 2.0 },
      roe: { min: 15 },
      debt_to_equity: { max: 1.0 }
    },
    reits: {
      pe_ratio: { max: 16 },
      p_vpa: { max: 1.15 },
      dividend_yield: { min: 4.0 },
      vacancy_rate: { max: 5 }
    }
  },
  moderado: {
    name: 'Moderado',
    icon: TrendingUp,
    description: 'Equilíbrio entre segurança e oportunidade',
    acoes: {
      pe_ratio: { max: 15 },
      pb_ratio: { max: 3 },
      dividend_yield: { min: 3 },
      roe: { min: 10 },
      current_ratio: { min: 1.0 },
      debt_to_equity: { max: 1.0 }
    },
    fiis: {
      p_vpa: { min: 0.8, max: 1.15 },
      dividend_yield: { min: 7 },
      vacancy_rate: { max: 10 },
      liquidity: { min: 200000 }
    },
    rendaFixa: {
      dividend_yield: { min: 11 }
    },
    stocks: {
      pe_ratio: { max: 32 },
      pb_ratio: { max: 7 },
      dividend_yield: { min: 0.8 },
      roe: { min: 15 }
    },
    reits: {
      pe_ratio: { max: 20 },
      p_vpa: { max: 1.30 },
      dividend_yield: { min: 3.5 },
      vacancy_rate: { max: 8 }
    }
  },
  agressivo: {
    name: 'Agressivo',
    icon: Zap,
    description: 'Mais oportunidades, maior risco',
    acoes: {
      pe_ratio: { max: 20 },
      pb_ratio: { max: 5 },
      dividend_yield: { min: 2 },
      roe: { min: 8 }
    },
    fiis: {
      p_vpa: { min: 0.7, max: 1.3 },
      dividend_yield: { min: 5 },
      vacancy_rate: { max: 15 }
    },
    rendaFixa: {
      dividend_yield: { min: 12 }
    },
    stocks: {
      pe_ratio: { max: 45 },
      roe: { min: 12 }
    },
    reits: {
      pe_ratio: { max: 26 },
      dividend_yield: { min: 2.5 },
      vacancy_rate: { max: 12 }
    }
  }
};

// Filter definitions grouped by category for each asset type
const FILTER_DEFINITIONS = {
  Acao: {
    'Valuation': [
      { key: 'pe_ratio', label: 'P/L', type: 'max', step: 1, defaultMax: 30 },
      { key: 'pb_ratio', label: 'P/VP', type: 'max', step: 0.5, defaultMax: 10 },
      { key: 'ev_ebit', label: 'EV/EBIT', type: 'max', step: 1, defaultMax: 30 },
      { key: 'ev_ebitda', label: 'EV/EBITDA', type: 'max', step: 1, defaultMax: 20 },
      { key: 'psr', label: 'PSR', type: 'max', step: 0.5, defaultMax: 10 },
    ],
    'Rentabilidade': [
      { key: 'dividend_yield', label: 'Div. Yield (%)', type: 'min', step: 0.5, defaultMin: 0 },
      { key: 'roe', label: 'ROE (%)', type: 'min', step: 1, defaultMin: 0 },
      { key: 'roic', label: 'ROIC (%)', type: 'min', step: 1, defaultMin: 0 },
      { key: 'roa', label: 'ROA (%)', type: 'min', step: 1, defaultMin: 0 },
      { key: 'ebit_margin', label: 'Mrg. EBIT (%)', type: 'min', step: 1, defaultMin: 0 },
      { key: 'profit_margin', label: 'Mrg. Líquida (%)', type: 'min', step: 1, defaultMin: 0 },
    ],
    'Dívida': [
      { key: 'current_ratio', label: 'Liq. Corrente', type: 'min', step: 0.1, defaultMin: 0 },
      { key: 'debt_to_equity', label: 'Dív/PL', type: 'max', step: 0.1, defaultMax: 5 },
      { key: 'net_debt_ebitda', label: 'Dív.Líq/EBITDA', type: 'max', step: 0.5, defaultMax: 5 },
    ],
    'Crescimento': [
      { key: 'revenue_growth', label: 'Cresc. Receita (%)', type: 'min', step: 1, defaultMin: 0 },
      { key: 'revenue_growth_5y', label: 'Cresc. Rec. 5a (%)', type: 'min', step: 1, defaultMin: 0 },
      { key: 'earnings_growth', label: 'Cresc. Lucros (%)', type: 'min', step: 1, defaultMin: 0 },
    ],
    'Outros': [
      { key: 'payout_ratio', label: 'Payout (%)', type: 'range', step: 5, defaultMin: 0, defaultMax: 100 },
      { key: 'market_cap', label: 'Valor Mercado (M)', type: 'min', step: 100, defaultMin: 0 },
    ],
    '⭐ Minhas Notas': [
      { key: 'user_rating', label: 'Nota mínima', type: 'min', step: 1, defaultMin: 0 },
    ]
  },
  FII: {
    'Valuation': [
      { key: 'p_vpa', label: 'P/VP', type: 'range', step: 0.05, defaultMin: 0.5, defaultMax: 1.5 },
    ],
    'Rentabilidade': [
      { key: 'dividend_yield', label: 'Div. Yield (%)', type: 'min', step: 0.5, defaultMin: 0 },
      { key: 'ffo_yield', label: 'FFO Yield (%)', type: 'min', step: 0.5, defaultMin: 0 },
      { key: 'cap_rate', label: 'Cap Rate (%)', type: 'min', step: 0.5, defaultMin: 0 },
    ],
    'Qualidade': [
      { key: 'vacancy_rate', label: 'Vacância (%)', type: 'max', step: 1, defaultMax: 30 },
      { key: 'property_count', label: 'Qtd Imóveis', type: 'min', step: 1, defaultMin: 0 },
      { key: 'price_per_sqm', label: 'Preço/m² (R$)', type: 'max', step: 100, defaultMax: 20000 },
      { key: 'rent_per_sqm', label: 'Aluguel/m² (R$)', type: 'min', step: 1, defaultMin: 0 },
    ],
    'Liquidez': [
      { key: 'liquidity', label: 'Liquidez (R$)', type: 'min', step: 50000, defaultMin: 0 },
      { key: 'market_cap', label: 'Valor Mercado (M)', type: 'min', step: 100, defaultMin: 0 },
    ],
    '⭐ Minhas Notas': [
      { key: 'user_rating', label: 'Nota mínima', type: 'min', step: 1, defaultMin: 0 },
    ]
  },
  RendaFixa: {
    'Rentabilidade': [
      { key: 'dividend_yield', label: 'Rentab. Mínima (% a.a.)', type: 'min', step: 0.5, defaultMin: 0 },
      { key: 'rate_fixed', label: 'Taxa / Cupom Mínimo (%)', type: 'min', step: 0.5, defaultMin: 0 },
    ],
    'Aporte & Liquidez': [
      { key: 'min_investment', label: 'Aporte Máximo (R$)', type: 'max', step: 100, defaultMax: 2000 },
      { key: 'liquidity', label: 'Liquidez Mínima (R$)', type: 'min', step: 100000, defaultMin: 0 },
    ],
    '⭐ Minhas Notas': [
      { key: 'user_rating', label: 'Nota mínima', type: 'min', step: 1, defaultMin: 0 },
    ]
  },
  Stock: {
    'Valuation': [
      { key: 'pe_ratio', label: 'P/L (P/E)', type: 'max', step: 1, defaultMax: 40 },
      { key: 'pb_ratio', label: 'P/VP (P/B)', type: 'max', step: 0.5, defaultMax: 15 },
      { key: 'ev_ebitda', label: 'EV/EBITDA', type: 'max', step: 1, defaultMax: 30 },
      { key: 'psr', label: 'PSR (P/S)', type: 'max', step: 0.5, defaultMax: 15 },
    ],
    'Rentabilidade': [
      { key: 'dividend_yield', label: 'Div. Yield (%)', type: 'min', step: 0.5, defaultMin: 0 },
      { key: 'roe', label: 'ROE (%)', type: 'min', step: 1, defaultMin: 0 },
      { key: 'roic', label: 'ROIC (%)', type: 'min', step: 1, defaultMin: 0 },
      { key: 'profit_margin', label: 'Mrg. Líquida (%)', type: 'min', step: 1, defaultMin: 0 },
    ],
    'Dívida & Tamanho': [
      { key: 'current_ratio', label: 'Liq. Corrente', type: 'min', step: 0.1, defaultMin: 0 },
      { key: 'debt_to_equity', label: 'Dív/PL', type: 'max', step: 0.1, defaultMax: 5 },
      { key: 'market_cap', label: 'Valor Mercado ($B)', type: 'min', step: 10, defaultMin: 0 },
    ],
    '⭐ Minhas Notas': [
      { key: 'user_rating', label: 'Nota mínima', type: 'min', step: 1, defaultMin: 0 },
    ]
  },
  REIT: {
    'Valuation': [
      { key: 'pe_ratio', label: 'P/FFO', type: 'max', step: 1, defaultMax: 30 },
      { key: 'p_vpa', label: 'P/VP (P/NAV)', type: 'range', step: 0.05, defaultMin: 0.5, defaultMax: 1.5 },
      { key: 'psr', label: 'PSR', type: 'max', step: 0.5, defaultMax: 15 },
    ],
    'Rentabilidade': [
      { key: 'dividend_yield', label: 'Div. Yield (%)', type: 'min', step: 0.5, defaultMin: 0 },
      { key: 'ffo_yield', label: 'FFO Yield (%)', type: 'min', step: 0.5, defaultMin: 0 },
      { key: 'payout_ratio', label: 'Payout FFO Máx (%)', type: 'max', step: 5, defaultMax: 90 },
    ],
    'Qualidade & Imóveis': [
      { key: 'vacancy_rate', label: 'Vacância Máx (%)', type: 'max', step: 1, defaultMax: 20 },
      { key: 'property_count', label: 'Qtd Imóveis Mín', type: 'min', step: 50, defaultMin: 0 },
    ],
    'Dívida & Tamanho': [
      { key: 'debt_to_equity', label: 'Dív/PL', type: 'max', step: 0.1, defaultMax: 3 },
      { key: 'current_ratio', label: 'Liq. Corrente', type: 'min', step: 0.1, defaultMin: 0 },
      { key: 'market_cap', label: 'Valor Mercado ($B)', type: 'min', step: 1, defaultMin: 0 },
    ],
    '⭐ Minhas Notas': [
      { key: 'user_rating', label: 'Nota mínima', type: 'min', step: 1, defaultMin: 0 },
    ]
  }
};

const DaviFilters = ({ assetType, onApplyFilters, onClear, totalAssets, filteredCount }) => {
  const [filters, setFilters] = useState({});
  const [activeFilters, setActiveFilters] = useState({});
  const [isCollapsed, setIsCollapsed] = useState(false);
  const [selectedPreset, setSelectedPreset] = useState(null);

  const filterGroups = FILTER_DEFINITIONS[assetType] || FILTER_DEFINITIONS.Acao;

  const handleFilterChange = (key, type, value) => {
    const numValue = value === '' ? null : parseFloat(value);
    
    setFilters(prev => {
      const newFilters = { ...prev };
      
      if (!newFilters[key]) {
        newFilters[key] = {};
      }
      
      if (type === 'min') {
        newFilters[key].min = numValue;
      } else if (type === 'max') {
        newFilters[key].max = numValue;
      }
      
      // Clean up empty filters
      if (newFilters[key].min === null && newFilters[key].max === null) {
        delete newFilters[key];
      }
      
      return newFilters;
    });
    
    setSelectedPreset(null);
  };

  const handleToggleFilter = (key) => {
    setActiveFilters(prev => ({
      ...prev,
      [key]: !prev[key]
    }));
  };

  const applyPreset = (presetKey) => {
    const preset = PRESETS[presetKey];
    let presetFilters = preset.acoes;
    if (assetType === 'FII') {
      presetFilters = preset.fiis;
    } else if (assetType === 'RendaFixa') {
      presetFilters = preset.rendaFixa;
    } else if (assetType === 'Stock') {
      presetFilters = preset.stocks;
    } else if (assetType === 'REIT') {
      presetFilters = preset.reits;
    }
    
    setFilters(presetFilters || {});
    setSelectedPreset(presetKey);
    
    // Activate all preset filters
    const newActiveFilters = {};
    Object.keys(presetFilters || {}).forEach(key => {
      newActiveFilters[key] = true;
    });
    setActiveFilters(newActiveFilters);
    
    // Apply immediately
    onApplyFilters(presetFilters || {});
  };

  const handleApply = () => {
    // Only send active filters
    const filtersToApply = {};
    Object.keys(filters).forEach(key => {
      if (activeFilters[key] !== false) {
        filtersToApply[key] = filters[key];
      }
    });
    
    onApplyFilters(filtersToApply);
  };

  const handleClear = () => {
    setFilters({});
    setActiveFilters({});
    setSelectedPreset(null);
    onClear();
  };

  const activeFilterCount = Object.keys(filters).filter(k => activeFilters[k] !== false).length;

  return (
    <div className={`davi-sidebar ${isCollapsed ? 'collapsed' : ''}`}>
      {/* Collapse Toggle */}
      <button 
        className="sidebar-toggle" 
        onClick={() => setIsCollapsed(!isCollapsed)}
        title={isCollapsed ? 'Expandir filtros' : 'Recolher filtros'}
      >
        {isCollapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
      </button>

      {/* Sidebar Content */}
      <div className="sidebar-content">
        {/* Header */}
        <div className="sidebar-header">
          <div className="sidebar-title">
            <Filter size={18} />
            <span>Método DAVI</span>
            {activeFilterCount > 0 && (
              <span className="filter-badge">{activeFilterCount}</span>
            )}
          </div>
          <div className="filter-count">
            {filteredCount} de {totalAssets}
          </div>
        </div>

        {/* Presets Section */}
        <div className="presets-section">
          <span className="section-label">Perfil de Investidor</span>
          <div className="presets-list">
            {Object.entries(PRESETS).map(([key, preset]) => {
              const Icon = preset.icon;
              return (
                <button
                  key={key}
                  className={`preset-btn ${selectedPreset === key ? 'active' : ''}`}
                  onClick={() => applyPreset(key)}
                  title={preset.description}
                >
                  <Icon size={14} />
                  <span>{preset.name}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Groups */}
        <div className="filter-groups">
          {Object.entries(filterGroups).map(([groupName, groupFilters]) => (
            <div key={groupName} className="filter-group">
              <div className="group-title">{groupName}</div>
              <div className="group-filters">
                {groupFilters.map(def => (
                  <div key={def.key} className="filter-item">
                    <div className="filter-header">
                      <input
                        type="checkbox"
                        checked={activeFilters[def.key] !== false && !!filters[def.key]}
                        onChange={() => handleToggleFilter(def.key)}
                      />
                      <span className="filter-name">{def.label}</span>
                    </div>
                    <div className="filter-inputs">
                      {(def.type === 'min' || def.type === 'range') && (
                        <input
                          type="number"
                          placeholder="Min"
                          step={def.step}
                          value={filters[def.key]?.min ?? ''}
                          onChange={e => handleFilterChange(def.key, 'min', e.target.value)}
                          className="filter-input"
                        />
                      )}
                      {(def.type === 'max' || def.type === 'range') && (
                        <input
                          type="number"
                          placeholder="Max"
                          step={def.step}
                          value={filters[def.key]?.max ?? ''}
                          onChange={e => handleFilterChange(def.key, 'max', e.target.value)}
                          className="filter-input"
                        />
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Actions */}
        <div className="sidebar-actions">
          <button className="btn-clear" onClick={handleClear}>
            <RotateCcw size={14} />
            Limpar
          </button>
          <button className="btn-apply" onClick={handleApply}>
            <Filter size={14} />
            Aplicar
          </button>
        </div>
      </div>
    </div>
  );
};

export default DaviFilters;
