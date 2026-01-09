import { usePortfolio } from '../../context/PortfolioContext';
import { useAuth } from '../../context/AuthContext';
import { RefreshCw, LogOut } from 'lucide-react';
import './Header.css';

const Header = () => {
    const { refreshPrices, isUpdatingPrices } = usePortfolio();
    const { user, logout } = useAuth();

    return (
        <header className="app-header">
            <div className="header-left">
                <h1>Olá, {user ? user.name.split(' ')[0] : 'Investidor'}</h1>
            </div>
            
            <div className="header-right">
                <button 
                    className="btn-refresh" 
                    onClick={refreshPrices}
                    disabled={isUpdatingPrices}
                >
                    <RefreshCw size={18} className={isUpdatingPrices ? 'spinning' : ''} />
                    {isUpdatingPrices ? 'Atualizando...' : 'Atualizar Cotações'}
                </button>

                <button className="btn-logout" onClick={logout} title="Sair">
                    <LogOut size={18} />
                </button>
            </div>
        </header>
    );
};

export default Header;
