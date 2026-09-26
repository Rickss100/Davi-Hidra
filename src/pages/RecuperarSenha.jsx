import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Shield } from 'lucide-react';
import './Login.css';

const RecuperarSenha = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const { addToast } = useToast();

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!email) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users/forgot-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email })
      });
      const data = await res.json();
      setSent(true);
      addToast('success', data.message);
    } catch (err) {
      addToast('error', 'Erro de conexão.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Shield size={32} />
            <h2>Norte Invest</h2>
          </div>
          <p>Recuperação de Senha</p>
        </div>

        {sent ? (
          <div style={{ textAlign: 'center', color: '#cbd5e1' }}>
            <p>Se o e-mail estiver cadastrado, você receberá um link em instantes.</p>
            <br/>
            <Link to="/login" className="btn-secondary" style={{ width: '100%', display: 'inline-block', textAlign: 'center' }}>Voltar ao Login</Link>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="login-form">
            <div className="form-group">
              <label>Seu e-mail cadastrado</label>
              <div className="input-wrapper">
                <input type="text" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="voce@email.com" required />
              </div>
            </div>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Processando...' : 'Enviar Link de Recuperação'}
            </button>
            <div style={{ textAlign: 'center', marginTop: '1rem' }}>
              <Link to="/login" style={{ color: '#60a5fa', textDecoration: 'none', fontSize: '0.9rem' }}>Voltar</Link>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
export default RecuperarSenha;