import React, { createContext, useState, useContext, useEffect } from 'react';
import { AuthService } from '../services/auth';

const AuthContext = createContext({});

export const useAuth = () => useContext(AuthContext);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadUser = async () => {
      const storedUser = localStorage.getItem('@SAGADI:user');
      const storedToken = localStorage.getItem('@SAGADI:token');

      if (storedUser && storedToken) {
        try {
          const userData = await AuthService.getMe();
          setUser(userData);
        } catch (error) {
          localStorage.removeItem('@SAGADI:token');
          localStorage.removeItem('@SAGADI:user');
        }
      }
      setLoading(false);
    };

    loadUser();
  }, []);

  const login = async (email, senha) => {
    const data = await AuthService.login(email, senha);
    localStorage.setItem('@SAGADI:token', data.token);
    localStorage.setItem('@SAGADI:user', JSON.stringify(data.user));
    setUser(data.user);
    return data;
  };

  const logout = async () => {
    try {
      await AuthService.logout();
    } finally {
      localStorage.removeItem('@SAGADI:token');
      localStorage.removeItem('@SAGADI:user');
      setUser(null);
    }
  };

  const alterarSenha = async (senha_atual, nova_senha) => {
    await AuthService.alterarSenha(senha_atual, nova_senha);
  };

  return (
    <AuthContext.Provider value={{ 
      user, 
      loading, 
      login, 
      logout, 
      alterarSenha,
      isAuthenticated: !!user,
      isAdmin: user?.perfil?.nome === 'admin_nacional',
      isInspetor: user?.perfil?.nome === 'inspetor',
      isOperador: user?.perfil?.nome === 'operador'
    }}>
      {children}
    </AuthContext.Provider>
  );
};