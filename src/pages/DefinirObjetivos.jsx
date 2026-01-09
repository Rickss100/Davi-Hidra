import { useState } from 'react';
import { usePortfolio } from '../context/PortfolioContext';
import MacroAllocation from '../components/Strategy/MacroAllocation';
import AssetTargetTable from '../components/Strategy/AssetTargetTable';
import ObjectiveWizard from '../components/Strategy/ObjectiveWizard';
import '../components/Strategy/Strategy.css';

const DefinirObjetivos = () => {
  const { assetTargets, updateAssetTargets } = usePortfolio();
  const [showWizard, setShowWizard] = useState(true); // Default true for testing/flow

  return (
    <div className="definir-objetivos-page">
      {showWizard && <ObjectiveWizard onClose={() => setShowWizard(false)} />}
      
      <div className="page-header">
        <h1>Definição de Objetivos</h1>
        <p>Defina sua estratégia de alocação macro e os ativos alvo para rebalanceamento.</p>
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
        </div>
      </section>
    </div>
  );
};

export default DefinirObjetivos;
