import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { useToast } from '../context/ToastContext';
import { Eye, EyeOff, UserPlus, LogIn, ShieldAlert } from 'lucide-react';
import './Login.css';

const Login = () => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);

  const { login, register } = useAuth();
  const { success, error } = useToast();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email.trim() || !password.trim()) {
      error('Preencha todos os campos obrigatórios.');
      return;
    }

    setLoading(true);
    try {
      if (isRegistering) {
        if (!name.trim()) {
          error('Por favor, informe seu nome.');
          setLoading(false);
          return;
        }

        const res = await register(name.trim(), email.trim(), password.trim());
        if (res && res.success) {
          success(`Conta criada com sucesso! Bem-vindo, ${res.user?.name}!`);
          setTimeout(() => navigate('/'), 400);
        } else {
          error(res?.error || 'Erro ao cadastrar usuário.');
        }
      } else {
        const res = await login(email.trim(), password.trim());
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
          error(res?.error || 'Credenciais inválidas. Verifique seu login e senha.');
        }
      }
    } catch (err) {
      error(err.message || 'Erro ao conectar ao servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-box">
        <div className="login-header">
          <h1>
            {isRegistering ? (
              <>Crie sua conta para<br />começar a investir</>
            ) : (
              <>Insira suas informações<br />para realizar o login</>
            )}
          </h1>
          <p style={{ fontSize: '13px', color: '#94a3b8', marginTop: '6px' }}>
            {isRegistering 
              ? 'Ambiente exclusivo DAVI & HYDRA para controle e aporte inteligente'
              : 'Acesso seguro à sua carteira e estratégias de alocação'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="login-form">
          {isRegistering && (
            <div className="input-group">
              <label htmlFor="name">Seu Nome Completo</label>
              <div className="input-wrapper">
                <input 
                  type="text" 
                  id="name" 
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ex: Carlos Silva"
                  required
                />
              </div>
            </div>
          )}

          <div className="input-group">
            <label htmlFor="email">Login ou E-mail</label>
            <div className="input-wrapper">
              <input 
                type="text" 
                id="email" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={isRegistering ? "Ex: seuemail@exemplo.com" : "Digite seu login ou e-mail"}
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
                placeholder="Digite sua senha"
                required
              />
              <button 
                type="button" 
                className="toggle-password"
                onClick={() => setShowPassword(!showPassword)}
                aria-label="Alternar visibilidade de senha"
              >
                {showPassword ? <EyeOff size={18}/> : <Eye size={18}/>}
              </button>
            </div>
          </div>

          <button type="submit" className="login-button" disabled={loading}>
            {loading ? (
              'Processando...'
            ) : isRegistering ? (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <UserPlus size={18} /> Criar Conta Gratuita
              </span>
            ) : (
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
                <LogIn size={18} /> Entrar
              </span>
            )}
          </button>
        </form>

        {/* Alternar entre Login e Cadastro */}
        <div style={{
          marginTop: '20px',
          paddingTop: '16px',
          borderTop: '1px solid rgba(255, 255, 255, 0.08)',
          textAlign: 'center',
          fontSize: '13px',
          color: '#cbd5e1'
        }}>
          {isRegistering ? (
            <span>
              Já possui uma conta?{' '}
              <button
                type="button"
                onClick={() => { setIsRegistering(false); setShowPassword(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#34d399',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Faça login aqui
              </button>
            </span>
          ) : (
            <span>
              Primeira vez aqui?{' '}
              <button
                type="button"
                onClick={() => { setIsRegistering(true); setShowPassword(false); }}
                style={{
                  background: 'none',
                  border: 'none',
                  color: '#38bdf8',
                  fontWeight: 700,
                  cursor: 'pointer',
                  textDecoration: 'underline'
                }}
              >
                Cadastre-se gratuitamente
              </button>
            </span>
          )}
        </div>

      </div>
    </div>
  );
};

export default Login;
