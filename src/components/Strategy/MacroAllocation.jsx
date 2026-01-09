import { usePortfolio } from '../../context/PortfolioContext';
import './Strategy.css';

const AllocationCard = ({ title, inputs, onChange, orientation }) => {
  const total = inputs.reduce((sum, item) => sum + (Number(item.value) || 0), 0);
  const isValid = total === 100;

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
          <span>{total}%</span>
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
        orientation="Mínimo 20% em renda fixa"
      />
      
      <div className="arrow-separator">›</div>

      <AllocationCard
        title="Brasil vs EUA"
        inputs={[
          { label: 'Brasil', value: macroAllocation.brasil, key: 'brasil' },
          { label: 'EUA', value: macroAllocation.usa, key: 'usa' }
        ]}
        onChange={handleChange}
        orientation="Mínimo 20% e máximo 40% nos EUA"
      />

      <div className="arrow-separator">›</div>

      <div className="vertical-stack">
        <AllocationCard
          title="Brasil: Ações vs FIIs"
          inputs={[
            { label: 'Ações', value: macroAllocation.acoes, key: 'acoes' },
            { label: 'FIIs', value: macroAllocation.fiis, key: 'fiis' }
          ]}
          onChange={handleChange}
          orientation="30% a 70% em cada"
        />
        <AllocationCard
          title="EUA: Stocks vs REITs"
          inputs={[
            { label: 'Stocks', value: macroAllocation.stocks, key: 'stocks' },
            { label: 'REITs', value: macroAllocation.reits, key: 'reits' }
          ]}
          onChange={handleChange}
          orientation="30% a 70% em cada"
        />
      </div>
    </div>
  );
};

export default MacroAllocation;
