import { useState, useRef, useEffect } from 'react';
import { useAuth } from '../../context/AuthContext';
import { usePortfolio } from '../../context/PortfolioContext';
import { User, ChevronDown, CheckCircle } from 'lucide-react';
import './UserMenu.css';

const UserMenu = () => {
  const { user, logout } = useAuth();
  const { resetAccount } = usePortfolio();
  
  const [isOpen, setIsOpen] = useState(false);
  const [showResetModal, setShowResetModal] = useState(false);
  const [confirmText, setConfirmText] = useState('');
  
  const menuRef = useRef(null);

  // Close menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
  };

  const openResetModal = () => {
    setIsOpen(false);
    setShowResetModal(true);
    setConfirmText('');
  };

  const handleReset = async () => {
    if (confirmText === 'resetar-conta') {
      await resetAccount();
      setShowResetModal(false);
      // Optional: Show success toast or reload
    }
  };

  const isValid = confirmText === 'resetar-conta';

  return (
    <div className="user-menu-container" ref={menuRef}>
      <button className="user-trigger" onClick={() => setIsOpen(!isOpen)}>
        <div className="user-avatar-placeholder">
          <User size={18} />
        </div>
        <span className="user-email">{user?.email || 'Usuario'}</span>
        <ChevronDown size={14} className="user-chevron" />
      </button>

      {isOpen && (
        <div className="user-dropdown">
          <div className="dropdown-header">Importação Rápida</div>
          
          <button className="dropdown-item" disabled>
            Alterar Senha
          </button>
          
          <button className="dropdown-item" onClick={openResetModal}>
            Resetar Conta
          </button>
          
          <button className="dropdown-item" disabled>
            Excluir Conta
          </button>
          
          <button className="dropdown-item" onClick={handleLogout}>
            Sair
          </button>
        </div>
      )}

      {showResetModal && (
        <div className="modal-overlay">
          <div className="reset-modal">
            <div className="modal-header">
              <h3>Resetar Conta</h3>
              <button className="btn-close-modal" onClick={() => setShowResetModal(false)}>×</button>
            </div>
            
            <div className="modal-content">
              <p className="warning-text">
                Ao confirmar a opção de resetar conta, todos os aportes, vendas, 
                recebimentos de renda passiva e objetivos cadastrados serão excluídos.
              </p>
              
              <label className="confirmation-input-label">
                Para prosseguir digite "<strong>resetar-conta</strong>" no campo abaixo.
              </label>
              
              <input 
                type="text" 
                className="confirmation-input"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder=""
                autoFocus
              />
              
              <div className="modal-actions">
                <button 
                  className="btn-modal btn-modal-cancel"
                  onClick={() => setShowResetModal(false)}
                >
                  Cancelar
                </button>
                <button 
                  className={`btn-modal btn-modal-reset ${isValid ? 'danger' : ''}`}
                  onClick={handleReset}
                  disabled={!isValid}
                >
                  Resetar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserMenu;
