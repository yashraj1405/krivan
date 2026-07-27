import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import api from '../services/api';
import type { User } from '../interfaces';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (token: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(() => localStorage.getItem('token'));
  const [loading, setLoading] = useState(true);

  const logout = useCallback(() => {
    localStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setLoading(false);
  }, []);

  const fetchUser = useCallback(async (authToken: string) => {
    try {
      setLoading(true);
      const response = await api.get<User>('/auth/me', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      setUser(response.data);
    } catch (err) {
      console.error('Failed to fetch user me credentials', err);
      logout();
    } finally {
      setLoading(false);
    }
  }, [logout]);

  useEffect(() => {
    if (token) {
      fetchUser(token);
    } else {
      setLoading(false);
    }
  }, [token, fetchUser]);

  const login = async (newToken: string) => {
    localStorage.setItem('token', newToken);
    setToken(newToken);
    await fetchUser(newToken);
  };

  const refreshUser = async () => {
    const currentToken = localStorage.getItem('token');
    if (currentToken) {
      await fetchUser(currentToken);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: !!user && !!token,
        loading,
        login,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
