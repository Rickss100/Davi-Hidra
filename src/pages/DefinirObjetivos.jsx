import { useState, useEffect } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Sparkles, Award, Globe } from 'lucide-react';
import MacroAllocation from '../components/Strategy/MacroAllocation';
import AssetTargetTable from '../components/Strategy/AssetTargetTable';
import ObjectiveWizard from '../components/Strategy/ObjectiveWizard';
import '../components/Strategy/Strategy.css';

const DefinirObjetivos = () => {
  const { assetTargets, updateAssetTargets, updateMacro } = usePortfolio();
  const [showWizard, setShowWizard] = useState(false);
  const [allAssetsInfo, setAllAssetsInfo] = useState([]);
  const [presetMessage, setPresetMessage] = useState('');

  useEffect(() => {
    fetch('/api/assets')
      .then(res => res.json())
      .then(data => setAllAssetsInfo(data))
      .catch(err => console.error('Error fetching assets:', err));
  }, []);

  const applyPresetBrasil = () => {
    const macro = {
      fixed: 15,
      variable: 85,
      brasil: 100,
      usa: 0,
      acoes: 60,
      fiis: 40,
      stocks: 0,
      reits: 0
    };
    const acoes = [
      { code: 'WEGE3', sector: 'Bens Industriais', target: 15 },
      { code: 'ITUB3', sector: 'Financeiro', target: 15 },
      { code: 'PSSA3', sector: 'Seguros', target: 12 },
      { code: 'EQTL3', sector: 'Utilidade Pública', target: 12 },
      { code: 'EGIE3', sector: 'Utilidade Pública', target: 10 },
      { code: 'CPFE3', sector: 'Utilidade Pública', target: 10 },
      { code: 'RENT3', sector: 'Locação / Consumo', target: 10 },
      { code: 'FLRY3', sector: 'Saúde', target: 8 },
      { code: 'BBDC3', sector: 'Financeiro', target: 8 }
    ];
    const fiis = [
      { code: 'HGLG11', sector: 'Logística', target: 15 },
      { code: 'XPML11', sector: 'Shoppings', target: 15 },
      { code: 'KNRI11', sector: 'Híbrido', target: 15 },
      { code: 'FIIB11', sector: 'Industrial', target: 15 },
      { code: 'HGRU11', sector: 'Renda Urbana', target: 10 },
      { code: 'VISC11', sector: 'Shoppings', target: 10 },
      { code: 'VRTA11', sector: 'Papel', target: 10 },
      { code: 'BCRI11', sector: 'Papel', target: 10 }
    ];
    const fixed = [{ code: 'Tesouro Selic 2029', sector: 'Títulos Públicos', target: 100 }];
    const reserva = [{ code: 'TESOURO_SELIC_2029', sector: 'Título Público Federal', target: 100 }];

    updateMacro(macro);
    updateAssetTargets('acoes', acoes);
    updateAssetTargets('fiis', fiis);
    updateAssetTargets('stocks', []);
    updateAssetTargets('reits', []);
    updateAssetTargets('fixed', fixed);
    updateAssetTargets('reserva', reserva);
    setPresetMessage('✓ Régua Padrão Ouro (100% Brasil) aplicada com sucesso!');
    setTimeout(() => setPresetMessage(''), 4000);
  };

  const applyPresetGlobal = () => {
    const macro = {
      fixed: 15,
      variable: 85,
      brasil: 60,
      usa: 40,
      acoes: 60,
      fiis: 40,
      stocks: 70,
      reits: 30
    };
    const acoes = [
      { code: 'ITUB4', sector: 'Financeiro', target: 20 },
      { code: 'BBAS3', sector: 'Financeiro', target: 15 },
      { code: 'WEGE3', sector: 'Bens Industriais', target: 15 },
      { code: 'EGIE3', sector: 'Utilidade Pública', target: 15 },
      { code: 'ALUP11', sector: 'Utilidade Pública', target: 15 },
      { code: 'SAPR11', sector: 'Saneamento', target: 10 },
      { code: 'VALE3', sector: 'Materiais Básicos', target: 10 }
    ];
    const fiis = [
      { code: 'ALZR11', sector: 'Híbrido', target: 20 },
      { code: 'XPML11', sector: 'Shoppings', target: 20 },
      { code: 'HGLG11', sector: 'Logística', target: 20 },
      { code: 'KNRI11', sector: 'Híbrido', target: 20 },
      { code: 'KNIP11', sector: 'Papel', target: 20 }
    ];
    const stocks = [
      { code: 'AAPL', sector: 'Tecnologia', target: 20 },
      { code: 'MSFT', sector: 'Tecnologia', target: 20 },
      { code: 'GOOGL', sector: 'Comunicação', target: 15 },
      { code: 'JNJ', sector: 'Saúde', target: 15 },
      { code: 'PG', sector: 'Consumo Não Cíclico', target: 15 },
      { code: 'KO', sector: 'Consumo Não Cíclico', target: 15 }
    ];
    const reits = [
      { code: 'O', sector: 'Varejo', target: 30 },
      { code: 'AMT', sector: 'Infraestrutura', target: 25 },
      { code: 'PLD', sector: 'Logística', target: 25 },
      { code: 'DLR', sector: 'Data Centers', target: 20 }
    ];
    const fixed = [
      { code: 'Tesouro IPCA+ 2035', sector: 'Títulos Públicos', target: 50 },
      { code: 'Tesouro Selic 2029', sector: 'Títulos Públicos', target: 50 }
    ];
    const reserva = [{ code: 'TESOURO_SELIC_2029', sector: 'Título Público Federal', target: 100 }];

    updateMacro(macro);
    updateAssetTargets('acoes', acoes);
    updateAssetTargets('fiis', fiis);
    updateAssetTargets('stocks', stocks);
    updateAssetTargets('reits', reits);
    updateAssetTargets('fixed', fixed);
    updateAssetTargets('reserva', reserva);
    setPresetMessage('✓ Régua Padrão Ouro Global (Brasil + EUA) aplicada com sucesso!');
    setTimeout(() => setPresetMessage(''), 4000);
  };

  return (
    <div className="definir-objetivos-page">
      {showWizard && <ObjectiveWizard onClose={() => setShowWizard(false)} />}
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Definição de Objetivos</h1>
          <p>Defina sua estratégia de alocação macro e os ativos alvo para rebalanceamento.</p>
        </div>
        <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
          <button 
            onClick={applyPresetBrasil}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(245, 158, 11, 0.15)',
              color: '#fbbf24',
              border: '1px solid rgba(245, 158, 11, 0.4)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Award size={16} />
            <span>Padrão Ouro 100% Brasil</span>
          </button>

          <button 
            onClick={applyPresetGlobal}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: 'rgba(56, 189, 248, 0.15)',
              color: '#38bdf8',
              border: '1px solid rgba(56, 189, 248, 0.4)',
              borderRadius: '8px',
              padding: '10px 14px',
              fontSize: '13px',
              fontWeight: '600',
              cursor: 'pointer'
            }}
          >
            <Globe size={16} />
            <span>Padrão Ouro Global (BR + EUA)</span>
          </button>

          <button 
            className="btn-open-wizard"
            onClick={() => setShowWizard(true)}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              backgroundColor: '#10b981',
              color: '#ffffff',
              border: 'none',
              borderRadius: '8px',
              padding: '10px 18px',
              fontSize: '14px',
              fontWeight: '600',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(16, 185, 129, 0.25)',
              transition: 'all 0.2s ease'
            }}
          >
            <Sparkles size={16} />
            <span>Assistente Guiado (Passo a Passo)</span>
          </button>
        </div>
      </div>

      {presetMessage && (
        <div style={{ margin: '12px 0', padding: '12px 16px', background: 'rgba(16, 185, 129, 0.15)', border: '1px solid rgba(16, 185, 129, 0.35)', borderRadius: '8px', color: '#34d399', fontWeight: '600', fontSize: '14px' }}>
          {presetMessage}
        </div>
      )}

      <section className="strategy-section">
        <h2>1. Estratégia Macro</h2>
        <MacroAllocation />
      </section>

      <section className="strategy-section">
        <h2>2. Definição por Ativos</h2>
        <div className="assets-row-3">
          <AssetTargetTable availableAssets={allAssetsInfo} 
            title="Ações" 
            assets={assetTargets.acoes} 
            onUpdate={(newAssets) => updateAssetTargets('acoes', newAssets)} 
          />
          
          <AssetTargetTable availableAssets={allAssetsInfo} 
            title="FIIs" 
            assets={assetTargets.fiis} 
            onUpdate={(newAssets) => updateAssetTargets('fiis', newAssets)} 
          />
          
          <AssetTargetTable availableAssets={allAssetsInfo} 
            title="Stocks" 
            assets={assetTargets.stocks} 
            onUpdate={(newAssets) => updateAssetTargets('stocks', newAssets)} 
          />
          
          </div>
        <div className="assets-row-3">
          <AssetTargetTable availableAssets={allAssetsInfo} 
            title="REITs" 
            assets={assetTargets.reits} 
            onUpdate={(newAssets) => updateAssetTargets('reits', newAssets)} 
          />
          
          <AssetTargetTable availableAssets={allAssetsInfo} 
            title="Renda Fixa" 
            assets={assetTargets.fixed || []} 
            onUpdate={(newAssets) => updateAssetTargets('fixed', newAssets)} 
          />
          
          <AssetTargetTable availableAssets={allAssetsInfo} 
            title="Reserva de Emergência" 
            assets={assetTargets.reserva || []} 
            onUpdate={(newAssets) => updateAssetTargets('reserva', newAssets)} 
          />
        </div>
      </section>
    </div>
  );
};

export default DefinirObjetivos;
