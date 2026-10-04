import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/axios';
import { config } from '../config';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [admin, setAdmin] = useState(() => {
    try {
      const saved = localStorage.getItem(config.storageKeys.adminUser);
      return saved ? JSON.parse(saved) : null;
    } catch {
      return null;
    }
  });
  const [token, setToken] = useState(() => localStorage.getItem(config.storageKeys.authToken));
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const verifyAuth = async () => {
      const storedToken = localStorage.getItem(config.storageKeys.authToken);
      if (storedToken) {
        try {
          const res = await api.get('/auth/me');
          if (res.data?.admin) {
            setAdmin(res.data.admin);
            localStorage.setItem(config.storageKeys.adminUser, JSON.stringify(res.data.admin));
          }
        } catch (err) {
          // Token is expired or invalid
          setAdmin(null);
          setToken(null);
          localStorage.removeItem(config.storageKeys.authToken);
          localStorage.removeItem(config.storageKeys.adminUser);
        }
      } else {
        setAdmin(null);
        setToken(null);
      }
      setLoading(false);
    };

    verifyAuth();
  }, []);

  const login = async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    if (res.data?.success && res.data.token) {
      setToken(res.data.token);
      setAdmin(res.data.admin);
      localStorage.setItem(config.storageKeys.authToken, res.data.token);
      localStorage.setItem(config.storageKeys.adminUser, JSON.stringify(res.data.admin));
      return res.data;
    }
    throw new Error(res.data?.message || 'Authentication failed');
  };

  const logout = () => {
    setToken(null);
    setAdmin(null);
    localStorage.removeItem(config.storageKeys.authToken);
    localStorage.removeItem(config.storageKeys.adminUser);
    window.location.href = '/login';
  };

  return (
    <AuthContext.Provider
      value={{
        admin,
        token,
        isAuthenticated: !!token && !!admin,
        loading,
        login,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
