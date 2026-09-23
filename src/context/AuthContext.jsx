import { createContext, useState, useContext, useEffect } from 'react';
import { USERS_DB } from '../data/usersDb';
import { userService } from '../services/userService';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem('user');
    return savedUser ? JSON.parse(savedUser) : null;
  });

  const login = async (email, password) => {
    try {
      // Tentar login na API Express / SQLite
      const data = await userService.login(email, password);
      if (data && data.user) {
        setUser(data.user);
        localStorage.setItem('user', JSON.stringify(data.user));
        return { success: true, user: data.user };
      }
    } catch (err) {
      console.warn('API login failed, attempting local fallback:', err.message);
      
      // Fallback local se a API estiver offline
      const foundUser = USERS_DB.find(u => u.email === email && u.password === password);
      if (foundUser) {
        const userObj = {
          id: foundUser.id,
          name: foundUser.name,
          email: foundUser.email,
          role: foundUser.id === 1 ? 'admin' : 'user',
          status: 'active'
        };
        setUser(userObj);
        localStorage.setItem('user', JSON.stringify(userObj));
        return { success: true, user: userObj };
      }
      return { success: false, error: err.message || 'Login ou senha inválidos' };
    }
    return { success: false, error: 'Login ou senha inválidos' };
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('user');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated: !!user
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
