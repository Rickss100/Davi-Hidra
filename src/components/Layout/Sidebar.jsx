import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Wallet,
  Target,
  PiggyBank,
  Briefcase,
  FileText,
  History,
  TrendingUp,
  Search,
  Shield,
  GraduationCap,
  Smartphone,
  Download,
  CheckCircle2,
  Menu,
  X,
  Share
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import './Sidebar.css';

const Sidebar = () => {
  const location = useLocation();
  const { user, exitImpersonation } = useAuth();

  const [deferredPrompt, setDeferredPrompt] = useState(() => window.__deferredPwaPrompt || null);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showInstallModal, setShowInstallModal] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const checkStandalone = () => {
      const standalone =
        window.matchMedia('(display-mode: standalone)').matches ||
        window.navigator.standalone === true;
      setIsStandalone(standalone);
    };
    checkStandalone();

    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      window.__deferredPwaPrompt = e;
      setDeferredPrompt(e);
    };

    const handleCustomPromptReady = () => {
      if (window.__deferredPwaPrompt) {
        setDeferredPrompt(window.__deferredPwaPrompt);
      }
    };

    const handleAppInstalled = () => {
      window.__deferredPwaPrompt = null;
      setDeferredPrompt(null);
      setIsStandalone(true);
      setShowInstallModal(false);
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    window.addEventListener('pwa-prompt-available', handleCustomPromptReady);
    window.addEventListener('appinstalled', handleAppInstalled);
    window.addEventListener('pwa-installed', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('pwa-prompt-available', handleCustomPromptReady);
      window.removeEventListener('appinstalled', handleAppInstalled);
      window.removeEventListener('pwa-installed', handleAppInstalled);
    };
  }, []);

  // Fecha o drawer mobile automaticamente ao trocar de rota
  useEffect(() => {
    setIsMobileMenuOpen(false);
  }, [location.pathname]);

  const handleInstallClick = async () => {
    const promptEvent = deferredPrompt || window.__deferredPwaPrompt;
    if (promptEvent) {
      try {
        promptEvent.prompt();
        const { outcome } = await promptEvent.userChoice;
        if (outcome === 'accepted') {
          window.__deferredPwaPrompt = null;
          setDeferredPrompt(null);
        }
        return;
      } catch (err) {
        console.warn('Falha ao disparar prompt nativo PWA:', err);
      }
    }
    setShowInstallModal(true);
  };

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
    <>
      {/* Backdrop escuro quando o menu mobile está aberto */}
      {isMobileMenuOpen && (
        <div
          className="sidebar-mobile-backdrop"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      <aside className={`sidebar ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="logo-container">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
              <img
                src="/icon.svg"
                alt="Norte Invest"
                style={{ width: '32px', height: '32px', borderRadius: '8px' }}
              />
              <div>
                <h2 style={{ margin: 0, lineHeight: 1.1 }}>NORTE INVEST</h2>
                <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  Método Davi & Hydra
                </span>
              </div>
            </div>
            <button
              className="mobile-close-btn"
              onClick={() => setIsMobileMenuOpen(false)}
              aria-label="Fechar menu"
            >
              <X size={20} />
            </button>
          </div>
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

        <nav className="sidebar-nav">
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

        {/* Rodapé da Sidebar: Botão Instalar App (PWA) */}
        <div className="sidebar-pwa-footer">
          {!isStandalone ? (
            <button
              type="button"
              onClick={handleInstallClick}
              className="btn-install-pwa"
              title="Instalar o aplicativo Norte Invest no celular ou computador"
            >
              <div className="btn-install-pwa-icon">
                {deferredPrompt ? <Download size={18} /> : <Smartphone size={18} />}
              </div>
              <div className="btn-install-pwa-text">
                <strong>📲 Instalar App</strong>
                <span>{deferredPrompt ? 'Instalação Rápida (1 Clique)' : 'Android, iPhone & PC'}</span>
              </div>
            </button>
          ) : (
            <div className="pwa-installed-badge">
              <CheckCircle2 size={16} color="#04d361" />
              <span>App Instalado</span>
            </div>
          )}
        </div>
      </aside>

      {/* Barra de Navegação Inferior para Celular (App Feel) */}
      <nav className="mobile-bottom-nav" aria-label="Navegação Rápida Mobile">
        <Link to="/" className={`mobile-nav-item ${isActive('/') ? 'active' : ''}`}>
          <LayoutDashboard size={20} />
          <span>Home</span>
        </Link>
        <Link to="/carteira" className={`mobile-nav-item ${isActive('/carteira') ? 'active' : ''}`}>
          <Wallet size={20} />
          <span>Carteira</span>
        </Link>
        <Link to="/onde-aportar" className={`mobile-nav-item highlight ${isActive('/onde-aportar') ? 'active' : ''}`}>
          <TrendingUp size={20} />
          <span>Aportar</span>
        </Link>
        <Link to="/definir-objetivos" className={`mobile-nav-item ${isActive('/definir-objetivos') ? 'active' : ''}`}>
          <Target size={20} />
          <span>Régua</span>
        </Link>
        <button
          type="button"
          className={`mobile-nav-item ${isMobileMenuOpen ? 'active' : ''}`}
          onClick={() => setIsMobileMenuOpen((prev) => !prev)}
        >
          <Menu size={20} />
          <span>Menu</span>
        </button>
      </nav>

      {/* Modal Guia de Instalação PWA (iOS / Safari / Android / Desktop) */}
      {showInstallModal && (
        <div className="pwa-modal-overlay" onClick={() => setShowInstallModal(false)}>
          <div className="pwa-modal-card" onClick={(e) => e.stopPropagation()}>
            <div className="pwa-modal-header">
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                <img src="/icon.svg" alt="Norte Invest" style={{ width: '42px', height: '42px', borderRadius: '10px' }} />
                <div>
                  <h3 style={{ margin: 0, fontSize: '1.1rem', color: '#fff' }}>Instalar Norte Invest</h3>
                  <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>Acesso direto da tela inicial sem ocupar memória</span>
                </div>
              </div>
              <button
                type="button"
                className="pwa-modal-close"
                onClick={() => setShowInstallModal(false)}
              >
                <X size={20} />
              </button>
            </div>

            <div className="pwa-modal-body">
              <div className="pwa-instruction-box">
                <div className="pwa-platform-title">🍎 No iPhone ou iPad (Safari)</div>
                <ol className="pwa-steps-list">
                  <li>
                    Toque no ícone <strong>Compartilhar</strong>{' '}
                    <span className="pwa-inline-badge"><Share size={13} /></span> na barra inferior do Safari.
                  </li>
                  <li>
                    Role a lista para baixo e toque em <strong>"Adicionar à Tela de Início"</strong> (➕).
                  </li>
                  <li>
                    Toque em <strong>"Adicionar"</strong> no canto superior direito.
                  </li>
                </ol>
              </div>

              <div className="pwa-instruction-box">
                <div className="pwa-platform-title">🤖 No Android ou Computador (Chrome / Edge)</div>
                <ol className="pwa-steps-list">
                  <li>
                    Toque nos <strong>3 pontinhos (⋮)</strong> no canto superior direito do navegador (ou no ícone de monitor/download na barra de endereço).
                  </li>
                  <li>
                    Selecione <strong>"Instalar aplicativo"</strong> ou <strong>"Adicionar à tela inicial"</strong>.
                  </li>
                </ol>
              </div>
            </div>

            <div className="pwa-modal-footer">
              <button
                type="button"
                className="pwa-btn-understand"
                onClick={() => setShowInstallModal(false)}
              >
                Entendi, vou instalar!
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Sidebar;
