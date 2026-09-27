import { usePortfolio } from '../../context/PortfolioContext';
import './Strategy.css';

const AllocationCard = ({ title, inputs, onChange, orientation, expectedTotal = 100 }) => {
  const total = inputs.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const isValid = total === expectedTotal;

  return (
    <div className="strategy-card">
      <div className="card-header">
        <h3>{title}</h3>
      </div>
      <div className="card-body">
        {inputs.map((input, index) => (
          <div key={index} className="input-group">
            <label>{input.label}</label>
            <div className="percentage-input">
              <input
                type="number"
                value={input.value}
                onChange={(e) => onChange(input.key, e.target.value)}
              />
              <span>%</span>
            </div>
          </div>
        ))}
        <div className={`total-row ${isValid ? 'valid' : 'invalid'}`}>
          <span>Somatório</span>
          <span>{total}% {expectedTotal !== 100 && !isValid ? `(Alvo: ${expectedTotal}%)` : ""}</span>
        </div>
      </div>
      {orientation && (
        <div className="card-footer">
          <p><strong>Orientação:</strong> {orientation}</p>
        </div>
      )}
    </div>
  );
};



const MacroAllocation = () => {
  const { macroAllocation, updateMacro } = usePortfolio();

  const handleChange = (key, value) => {
    updateMacro({ ...macroAllocation, [key]: Number(value) });
  };

  return (
    <div className="macro-allocation-container">
      <AllocationCard
        title="Renda Fixa vs Variável"
        inputs={[
          { label: 'Renda Fixa', value: macroAllocation.fixed, key: 'fixed' },
          { label: 'Renda Variável', value: macroAllocation.variable, key: 'variable' }
        ]}
        onChange={handleChange}
        orientation="Conservador: 30% RF | Moderado: 20% RF | Agressivo: 10% RF"
      />
      
      

      <AllocationCard
        title="Brasil vs EUA"
        inputs={[
          { label: 'Brasil', value: macroAllocation.brasil, key: 'brasil' },
          { label: 'EUA', value: macroAllocation.usa, key: 'usa' }
        ]}
        onChange={handleChange}
        orientation="Mínimo 25% e máximo 40% alocado nos EUA"
      />

      

      
        <AllocationCard
          title="Brasil: Ações vs FIIs"
          inputs={[
            { label: 'Ações', value: macroAllocation.acoes, key: 'acoes' },
            { label: 'FIIs', value: macroAllocation.fiis, key: 'fiis' }
          ]}
          onChange={handleChange}
          orientation="Mínimo 30% e máximo 70% em cada classe"
        />
        <AllocationCard
          title="EUA: Stocks vs REITs"
          inputs={[
            { label: 'Stocks', value: macroAllocation.stocks, key: 'stocks' },
            { label: 'REITs', value: macroAllocation.reits, key: 'reits' }
          ]}
          onChange={handleChange}
          orientation="Mínimo 25% e máximo 75% em cada classe"
        />
      
    </div>
  );
};

export default MacroAllocation;
