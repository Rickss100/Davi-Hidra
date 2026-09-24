import { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import { Sparkles } from 'lucide-react';
import MacroAllocation from '../components/Strategy/MacroAllocation';
import AssetTargetTable from '../components/Strategy/AssetTargetTable';
import ObjectiveWizard from '../components/Strategy/ObjectiveWizard';
import '../components/Strategy/Strategy.css';

const DefinirObjetivos = () => {
  const { assetTargets, updateAssetTargets } = usePortfolio();
  const [showWizard, setShowWizard] = useState(false);

  return (
    <div className="definir-objetivos-page">
      {showWizard && <ObjectiveWizard onClose={() => setShowWizard(false)} />}
      
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1>Definição de Objetivos</h1>
          <p>Defina sua estratégia de alocação macro e os ativos alvo para rebalanceamento.</p>
        </div>
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

      <section className="strategy-section">
        <h2>1. Estratégia Macro</h2>
        <MacroAllocation />
      </section>

      <section className="strategy-section">
        <h2>2. Definição por Ativos</h2>
        <div className="assets-container">
          <AssetTargetTable 
            title="Ações" 
            assets={assetTargets.acoes} 
            onUpdate={(newAssets) => updateAssetTargets('acoes', newAssets)} 
          />
          <div className="arrow-separator">›</div>
          <AssetTargetTable 
            title="FIIs" 
            assets={assetTargets.fiis} 
            onUpdate={(newAssets) => updateAssetTargets('fiis', newAssets)} 
          />
          <div className="arrow-separator">›</div>
          <AssetTargetTable 
            title="Stocks" 
            assets={assetTargets.stocks} 
            onUpdate={(newAssets) => updateAssetTargets('stocks', newAssets)} 
          />
          <div className="arrow-separator">›</div>
          <AssetTargetTable 
            title="REITs" 
            assets={assetTargets.reits} 
            onUpdate={(newAssets) => updateAssetTargets('reits', newAssets)} 
          />
          <div className="arrow-separator">›</div>
          <AssetTargetTable 
            title="Renda Fixa" 
            assets={assetTargets.fixed || []} 
            onUpdate={(newAssets) => updateAssetTargets('fixed', newAssets)} 
          />
        </div>
      </section>
    </div>
  );
};

export default DefinirObjetivos;
