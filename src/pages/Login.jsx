import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const { login } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleLoginWithCredentials = async (loginEmail, loginPassword) => {
    setLoading(true);
    try {
      const res = await login(loginEmail, loginPassword);
      if (res && res.success) {
        success(`Bem-vindo de volta, ${res.user?.name || 'Investidor'}!`);
        setTimeout(() => {
          if (res.user?.role === 'admin') {
            navigate('/admin');
          } else {
            navigate('/');
          }
        }, 400);
      } else {
        error(res?.error || 'Login ou senha inválidos!');
      }
    } catch (err) {
      error(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    handleLoginWithCredentials(email, password);
  };

  const handleQuickLogin = (quickEmail, quickPassword) => {
    setEmail(quickEmail);
    setPassword(quickPassword);
    handleLoginWithCredentials(quickEmail, quickPassword);
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>Insira suas informações<br/>para realizar o login</h1>
        </div>
        
        <form onSubmit={handleSubmit} className="login-form">
          <div className="input-group">
            <label htmlFor="email">Login / E-mail</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Ex: admin@davi.com ou user@davi.com"
                required
              />
            </div>
          </div>

          <div className="input-group">
            <label htmlFor="password">Senha</label>
            <div className="input-wrapper">
              <input 
                type={showPassword ? "text" : "password"} 
                id="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? <EyeOff size={20}/> : <Eye size={20}/>}
              </button>
            </div>
          </div>

          <div className="forgot-password">
            Esqueceu a senha? <a href="#">clique aqui</a>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? 'Acessando...' : 'Entrar'}
          </button>
        </form>

        {/* Atalhos de Acesso Rápido */}
        <div className="quick-access-section" style={{
          marginTop: '24px',
          paddingTop: '20px',
          borderTop: '1px solid rgba(255, 255, 255, 0.1)',
          display: 'flex',
          flexDirection: 'column',
          gap: '10px'
        }}>
          <span style={{
            fontSize: '11px',
            textTransform: 'uppercase',
            letterSpacing: '0.05em',
            color: '#94a3b8',
            textAlign: 'center',
            fontWeight: 700
          }}>
            ⚡ Acesso Rápido / Atalhos
          </span>

          <button 
            type="button"
            onClick={() => handleQuickLogin('admin@davi.com', '123')}
            style={{
              background: 'linear-gradient(135deg, rgba(16, 185, 129, 0.15) 0%, rgba(5, 150, 105, 0.25) 100%)',
              border: '1px solid rgba(16, 185, 129, 0.4)',
              color: '#34d399',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            👑 Entrar como Administrador (Superusuário)
          </button>

          <button 
            type="button"
            onClick={() => handleQuickLogin('user@davi.com', '123')}
            style={{
              background: 'rgba(56, 189, 248, 0.1)',
              border: '1px solid rgba(56, 189, 248, 0.3)',
              color: '#38bdf8',
              padding: '10px 14px',
              borderRadius: '10px',
              fontSize: '12px',
              fontWeight: 700,
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              transition: 'all 0.2s'
            }}
          >
            👤 Entrar como Investidor Padrão
          </button>
        </div>

      </div>
    </div>
  );
};

export default Login;
