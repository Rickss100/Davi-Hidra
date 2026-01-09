import { useState } from 'react';
import { usePortfolio } from '../../context/PortfolioContext';
import './ObjectiveWizard.css';
import { Percent, ArrowLeft } from 'lucide-react';
import AssetSelectionStep from './AssetSelectionStep';
import SummaryStep from './SummaryStep';

const ObjectiveWizard = ({ onClose }) => {
  const [currentStep, setCurrentStep] = useState(1);
  const totalSteps = 9;

  // Step 1 State: Fixed vs Variable
  const [rendaFixa, setRendaFixa] = useState(10);
  const [rendaVariavel, setRendaVariavel] = useState(90);

  // Step 2 State
  const [brasil, setBrasil] = useState(65);
  const [usa, setUsa] = useState(35);

  // Step 3 State
  const [acoes, setAcoes] = useState(10);
  const [fiis, setFiis] = useState(90);

  // Step 4 State
  const [stocks, setStocks] = useState(10);
  const [reits, setReits] = useState(90);

  // Step 5 State: Ações List
  const [acoesList, setAcoesList] = useState([]);

  // Step 6 State: FIIs List
  const [fiisList, setFiisList] = useState([]);

  // Step 7 State: Stocks List
  const [stocksList, setStocksList] = useState([]);

  // Step 8 State: REITs List
  const [reitsList, setReitsList] = useState([]);

  // Handlers for Step 1
  const handleFixedChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 100) val = 100;
    setRendaFixa(val);
    setRendaVariavel(100 - val);
  };
  const handleVariableChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 100) val = 100;
    setRendaVariavel(val);
    setRendaFixa(100 - val);
  };

  // Handlers for Step 2
  const handleBrasilChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 100) val = 100;
    setBrasil(val);
    setUsa(100 - val);
  };

  const handleUsaChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 100) val = 100;
    setUsa(val);
    setBrasil(100 - val);
  };

  // Handlers for Step 3
  const handleAcoesChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 100) val = 100;
    setAcoes(val);
    setFiis(100 - val);
  };

  const handleFiisChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 100) val = 100;
    setFiis(val);
    setAcoes(100 - val);
  };

  // Handlers for Step 4
  const handleStocksChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 100) val = 100;
    setStocks(val);
    setReits(100 - val);
  };

  const handleReitsChange = (e) => {
    let val = parseInt(e.target.value) || 0;
    if (val > 100) val = 100;
    setReits(val);
    setStocks(100 - val);
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const renderStepContent = () => {
    switch(currentStep) {
      case 1:
        // ... (Step 1 content) ...
        return (
          <>
            <div className="step-question">
              Qual a sua porcentagem desejável em renda fixa e em renda variável?
            </div>
            
            <div className="input-label-group">
              <label>Renda fixa</label>
              <div className="percentage-input-wrapper">
                <input 
                  type="number" 
                  value={rendaFixa}
                  onChange={handleFixedChange}
                />
                <span className="percentage-symbol"><Percent size={16} /></span>
              </div>
            </div>

            <div className="input-label-group">
              <label>Renda variável</label>
              <div className="percentage-input-wrapper">
                <input 
                  type="number" 
                  value={rendaVariavel}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || 0;
                    if (val > 100) val = 100;
                    setRendaVariavel(val);
                    setRendaFixa(100 - val);
                  }}
                />
                <span className="percentage-symbol"><Percent size={16} /></span>
              </div>
            </div>
          </>
        );
      case 2:
        return (
          <>
            <div className="step-question">
              Dentro da renda variável, qual a porcentagem desejável no Brasil e nos EUA?
            </div>
            {/* ... inputs for Brasil/EUA ... */}
            <div className="input-label-group">
              <label>Brasil</label>
              <div className="percentage-input-wrapper">
                <input 
                  type="number" 
                  value={brasil}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || 0;
                    if (val > 100) val = 100;
                    setBrasil(val);
                    setUsa(100 - val);
                  }}
                />
                <span className="percentage-symbol"><Percent size={16} /></span>
              </div>
            </div>

            <div className="input-label-group">
              <label>EUA</label>
              <div className="percentage-input-wrapper">
                <input 
                  type="number" 
                  value={usa}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || 0;
                    if (val > 100) val = 100;
                    setUsa(val);
                    setBrasil(100 - val);
                  }}
                />
                <span className="percentage-symbol"><Percent size={16} /></span>
              </div>
            </div>
          </>
        );
      case 3:
        return (
          <>
            <div className="step-question">
              Na renda variável no Brasil, quanto em ações e quanto em FIIs?
            </div>
            {/* ... inputs for Ações/FIIs ... */}
            <div className="input-label-group">
              <label>Ações</label>
              <div className="percentage-input-wrapper">
                <input 
                  type="number" 
                  value={acoes}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || 0;
                    if (val > 100) val = 100;
                    setAcoes(val);
                    setFiis(100 - val);
                  }}
                />
                <span className="percentage-symbol"><Percent size={16} /></span>
              </div>
            </div>

            <div className="input-label-group">
              <label>FIIs</label>
              <div className="percentage-input-wrapper">
                <input 
                  type="number" 
                  value={fiis}
                  onChange={(e) => {
                    let val = parseInt(e.target.value) || 0;
                    if (val > 100) val = 100;
                    setFiis(val);
                    setAcoes(100 - val);
                  }}
                />
                <span className="percentage-symbol"><Percent size={16} /></span>
              </div>
            </div>
          </>
        );
      case 4:
        return (
          <>
            <div className="step-question">
              Na renda variável no exterior, quanto Stocks e em REITs? <span style={{color: '#04d361'}}>*</span>
            </div>
            {/* ... inputs for Stocks/REITs ... */}
            <div className="input-label-group">
              <label>Stocks</label>
              <div className="percentage-input-wrapper">
                <input 
                  type="number" 
                  value={stocks}
                  onChange={handleStocksChange}
                />
                <span className="percentage-symbol"><Percent size={16} /></span>
              </div>
            </div>

            <div className="input-label-group">
              <label>REITs</label>
              <div className="percentage-input-wrapper">
                <input 
                  type="number" 
                  value={reits}
                  onChange={handleReitsChange}
                />
                <span className="percentage-symbol"><Percent size={16} /></span>
              </div>
            </div>

            <div style={{ marginTop: '2rem', color: '#737380', fontSize: '0.9rem' }}>
              <p>* ETFs estão inclusos em stocks e REITs.</p>
              <p>Exemplo: VOO - STOCK, VNK - REIT.</p>
            </div>
          </>
        );
      case 5:
        return (
            <AssetSelectionStep 
                title="Da seção de Ações da sua carteira, registre as que deseja ter e o objetivo de cada uma:"
                assets={acoesList}
                onUpdate={setAcoesList}
                type="ACAO"
            />
        );
      case 6:
        return (
            <AssetSelectionStep 
                title="Da seção de FIIs da sua carteira, registre as que deseja ter e o objetivo de cada uma:"
                assets={fiisList}
                onUpdate={setFiisList}
                type="FII"
            />
        );
      case 7:
        return (
            <AssetSelectionStep 
                title="Da seção de Stocks da sua carteira, registre as que deseja ter e o objetivo de cada uma:"
                assets={stocksList}
                onUpdate={setStocksList}
                type="STOCK"
            />
        );
      case 8:
        return (
            <AssetSelectionStep 
                title="Da seção de REITs da sua carteira, registre as que deseja ter e o objetivo de cada uma:"
                assets={reitsList}
                onUpdate={setReitsList}
                type="REIT"
            />
        );
      case 9:
        return (
            <SummaryStep 
                rendaFixa={rendaFixa}
                rendaVariavel={rendaVariavel}
                brasil={brasil}
                usa={usa}
                acoes={acoes}
                fiis={fiis}
                stocks={stocks}
                reits={reits}
                onEdit={(step) => setCurrentStep(step)}
            />
        );
      default:
        return <div>Passo {currentStep} em construção...</div>;
    }
  };

  const canAdvance = () => {
    switch(currentStep) {
      case 5: return Math.abs(acoesList.reduce((s, a) => s + a.target, 0) - 100) < 0.1;
      case 6: return Math.abs(fiisList.reduce((s, a) => s + a.target, 0) - 100) < 0.1;
      case 7: return Math.abs(stocksList.reduce((s, a) => s + a.target, 0) - 100) < 0.1;
      case 8: return Math.abs(reitsList.reduce((s, a) => s + a.target, 0) - 100) < 0.1;
      case 9: return false; // Hide next button on summary
      default: return true;
    }
  };

  const { updateMacro, updateAssetTargets } = usePortfolio();

  const handleFinish = () => {
    // 1. Update Macro Allocation
    updateMacro({
        fixed: rendaFixa,
        variable: rendaVariavel,
        brasil: brasil,
        usa: usa,
        acoes: acoes,
        fiis: fiis,
        stocks: stocks,
        reits: reits
    });

    // 2. Update Asset Lists
    updateAssetTargets('acoes', acoesList);
    updateAssetTargets('fiis', fiisList);
    updateAssetTargets('stocks', stocksList);
    updateAssetTargets('reits', reitsList);

    // 3. Close Wizard
    onClose();
  };

  return (
    <div className="wizard-overlay">
      <div className="wizard-container">
        <div className="wizard-header">
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                {currentStep > 1 && (
                    <ArrowLeft 
                        size={24} 
                        style={{ cursor: 'pointer' }} 
                        onClick={handleBack}
                    />
                )}
                <h2>Adicionar objetivo</h2>
            </div>
          <div className="step-indicators">
            {Array.from({ length: totalSteps }).map((_, i) => (
              <div 
                key={i} 
                className={`step-dot ${i + 1 === currentStep ? 'active' : ''}`} 
              />
            ))}
          </div>
        </div>

        <div className="step-content">
          {renderStepContent()}
        </div>

        <div className="wizard-footer">
            <button className="btn-cancel" onClick={onClose}>
                {currentStep === 9 ? 'Fechar' : 'Cancelar'}
            </button>
            {currentStep < 9 && (
                <button 
                    className="btn-next" 
                    onClick={() => setCurrentStep(prev => Math.min(prev + 1, totalSteps))}
                    disabled={!canAdvance()}
                    style={{ opacity: canAdvance() ? 1 : 0.5, cursor: canAdvance() ? 'pointer' : 'not-allowed' }}
                >
                    Avançar
                </button>
            )}
             {currentStep === 9 && (
                <button 
                    className="btn-next" 
                    onClick={handleFinish}
                >
                    Concluir
                </button>
            )}
        </div>
      </div>
    </div>
  );
};

export default ObjectiveWizard;
