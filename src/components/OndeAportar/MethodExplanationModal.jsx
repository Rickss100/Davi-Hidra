import { useEffect } from 'react';
import { X } from 'lucide-react';
import './MethodExplanationModal.css';

const MethodExplanationModal = ({ onClose }) => {
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  const handleDontShowAgain = (e) => {
    if (e.target.checked) {
      localStorage.setItem('hideAM2OWarning', 'true');
    } else {
      localStorage.removeItem('hideAM2OWarning');
    }
  };

  return (
    <div 
      className="modal-overlay" 
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ cursor: 'pointer' }}
    >
      <div className="method-modal" style={{ cursor: 'default' }}>
        <div className="method-modal-header">
          <h2>Explicação do método</h2>
          <button className="btn-close" onClick={onClose} title="Fechar modal (Esc)">
            <X size={20} />
          </button>
        </div>
        
        <div className="method-modal-body">
          <p>
            No <strong>AM2O*</strong> sempre devemos aportar no ativo da sua carteira que está mais distante do objetivo.
          </p>
          
          <p>
            Isso significa que <strong>não é uma indicação de investimentos</strong>, e nenhuma das informações apresentadas devem ser encaradas dessa forma.
          </p>
          
          <p>
            E sim como um <strong>método de equilíbrio de carteira</strong> para a tomada de decisão individual.
          </p>
          
          <p className="footnote">
            * Ferramenta da Metodologia de Verdade, baseada no equilíbrio de carteira.
          </p>
        </div>
        
        <div className="method-modal-footer">
          <label className="checkbox-label">
            <input 
              type="checkbox" 
              onChange={handleDontShowAgain}
            />
            <span>Não ver essa mensagem novamente</span>
          </label>
          
          <button className="btn-ok" onClick={onClose}>
            OK
          </button>
        </div>
      </div>
    </div>
  );
};

export default MethodExplanationModal;
