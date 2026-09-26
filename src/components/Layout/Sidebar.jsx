import { Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, Wallet, Target, PiggyBank, Briefcase, FileText, History, TrendingUp, Search, Shield, GraduationCap } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { user, exitImpersonation } = useAuth();

  const isActive = (path) => location.pathname === path;

  const menuItems = [
    { name: 'Home', path: '/', icon: LayoutDashboard },
    { name: 'Carteira', path: '/carteira', icon: Wallet },
    { name: 'Onde Aportar', path: '/onde-aportar', icon: TrendingUp },
    { name: 'Definir Objetivos', path: '/definir-objetivos', icon: Target },
    { name: 'Reserva de Emerg.', path: '/reserva-emergencia', icon: PiggyBank },
    { name: 'Renda Passiva', path: '/renda-passiva', icon: Briefcase },
    { name: 'Resumo', path: '/resumo', icon: FileText },
    { name: 'Radar de Ativos', path: '/radar', icon: Search },
    { name: 'Histórico', path: '/historico', icon: History },
    { name: 'Tutorial & Método', path: '/tutorial', icon: GraduationCap },
  ];

  if (user?.role === 'admin' || user?.role === 'collaborator') {
    menuItems.push({ 
      name: user.role === 'admin' ? 'Painel Admin' : 'Painel Gestão (TI)', 
      path: '/admin', 
      icon: Shield, 
      isAdmin: true 
    });
  }

  return (
    <aside className="sidebar">
      <div className="logo-container">
        <h2>NORTE INVEST</h2>
        <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
          Método Davi & Hydra
        </span>
      </div>
      {user?.isImpersonated && (
        <div style={{ background: '#ef4444', color: '#fff', padding: '12px 10px', margin: '10px', borderRadius: '6px', textAlign: 'center', fontSize: '12px', border: '1px solid #7f1d1d' }}>
          <strong style={{ display: 'block', marginBottom: '4px' }}>🛡️ MODO AUDITORIA</strong>
          Acessando: {user.name?.split(' ')[0]}
          <button 
            onClick={() => { exitImpersonation(); window.location.href = '/admin'; }}
            style={{ display: 'block', width: '100%', marginTop: '8px', padding: '6px 8px', background: 'rgba(0,0,0,0.3)', border: '1px solid rgba(0,0,0,0.4)', color: '#fff', cursor: 'pointer', borderRadius: '4px', fontWeight: 'bold' }}>
            Encerrar Sessão
          </button>
        </div>
      )}
      <nav>
        <ul>
          {menuItems.map((item) => {
            const Icon = item.icon;
            return (
              <li key={item.path} className={isActive(item.path) ? 'active' : ''}>
                <Link to={item.path}>
                  <Icon size={20} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
};

export default Sidebar;
