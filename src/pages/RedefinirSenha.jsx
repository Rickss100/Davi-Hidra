import React, { useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import { useToast } from '../context/ToastContext';
import { Shield } from 'lucide-react';
import './Login.css';

const RedefinirSenha = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const { addToast } = useToast();
  
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!password) return;
    setLoading(true);
    try {
      const res = await fetch('/api/users/reset-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, newPassword: password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro ao redefinir');
      addToast('success', 'Senha redefinida! Você já pode fazer login.');
      navigate('/login');
    } catch (err) {
      addToast('error', err.message);
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return <div className="login-container"><div className="login-card"><p>Token inválido.</p><Link to="/login">Voltar</Link></div></div>;
  }

  return (
    <div className="login-container">
      <div className="login-card">
        <div className="login-header">
          <div className="login-logo">
            <Shield size={32} />
            <h2>Norte Invest</h2>
          </div>
          <p>Digite sua nova senha</p>
        </div>
        <form onSubmit={handleSubmit} className="login-form">
          <div className="form-group">
            <label>Nova Senha</label>
            <div className="input-wrapper">
              <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} required />
            </div>
          </div>
          <button type="submit" className="btn-primary" disabled={loading}>
            {loading ? 'Salvando...' : 'Redefinir Senha'}
          </button>
        </form>
      </div>
    </div>
  );
};
export default RedefinirSenha;