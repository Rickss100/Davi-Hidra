import { createContext, useState, useContext, useEffect, useCallback } from 'react';
import { userService } from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    try {
      const savedUser = localStorage.getItem('user');
      const savedToken = localStorage.getItem('auth_token');
      // Sessões antigas sem token criptográfico assinado são invalidadas por segurança
      if (!savedUser || !savedToken) {
        localStorage.removeItem('user');
        localStorage.removeItem('auth_token');
        localStorage.removeItem('original_user');
        localStorage.removeItem('impersonator_id');
        return null;
      }
      return JSON.parse(savedUser);
    } catch {
      return null;
    }
  });

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem('user');
    localStorage.removeItem('auth_token');
    localStorage.removeItem('original_user');
    localStorage.removeItem('impersonator_id');
  }, []);

  useEffect(() => {
    const handleUnauthorized = () => {
      logout();
    };
    window.addEventListener('auth-unauthorized', handleUnauthorized);
    return () => window.removeEventListener('auth-unauthorized', handleUnauthorized);
  }, [logout]);

  const login = async (email, password) => {
    try {
      const data = await userService.login(email, password);
      if (data && data.user && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        localStorage.removeItem('original_user');
        localStorage.removeItem('impersonator_id');
        setUser(data.user);
        return { success: true, user: data.user };
      }
    } catch (err) {
      console.warn('API login error:', err.message);

      if (err.code === 'ACCOUNT_INACTIVE' || err.message?.toLowerCase().includes('inativa')) {
        return {
          success: false,
          error: err.message || 'Sua conta está inativa por motivos técnicos ou desfiliação do programa.',
          code: 'ACCOUNT_INACTIVE'
        };
      }

      return { success: false, error: err.message || 'Login ou senha inválidos' };
    }
    return { success: false, error: 'Login ou senha inválidos' };
  };

  const register = async (name, email, password) => {
    try {
      const data = await userService.register({ name, email, password });
      if (data && data.user && data.token) {
        localStorage.setItem('auth_token', data.token);
        localStorage.setItem('user', JSON.stringify(data.user));
        setUser(data.user);
        return { success: true, user: data.user };
      }
      return { success: false, error: 'Erro ao registrar usuário' };
    } catch (err) {
      return { success: false, error: err.message || 'Erro ao criar conta' };
    }
  };

  const impersonateUser = (targetUser) => {
    // O auth_token permanece o JWT assinado do Admin/Colaborador,
    // permitindo que o backend valide criptograficamente a permissão de auditoria.
    if (!localStorage.getItem('original_user')) {
      localStorage.setItem('original_user', JSON.stringify(user));
      localStorage.setItem('impersonator_id', String(user.id));
    }
    const fakeUser = { ...targetUser, isImpersonated: true };
    setUser(fakeUser);
    localStorage.setItem('user', JSON.stringify(fakeUser));
  };

  const exitImpersonation = () => {
    const original = localStorage.getItem('original_user');
    if (original) {
      const origUser = JSON.parse(original);
      setUser(origUser);
      localStorage.setItem('user', JSON.stringify(origUser));
      localStorage.removeItem('original_user');
      localStorage.removeItem('impersonator_id');
    }
  };

  const value = {
    user,
    login,
    register,
    logout,
    isAuthenticated: !!user,
    impersonateUser,
    exitImpersonation
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
