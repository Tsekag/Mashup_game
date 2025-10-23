import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { authAPI } from '../services/api';

// User interface for type safety
interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  selectedGenres: string[];
  uploads: any[];
  createdAt?: string; // optional, since backend doesn't always return it
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (username: string, email: string, password: string) => Promise<boolean>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 🔹 On app mount, check if token exists and fetch profile
  useEffect(() => {
    const initializeAuth = async () => {
      const token = localStorage.getItem('auth_token');
      if (token) {
        try {
          authAPI.setToken(token);
          const response = await authAPI.getProfile();
          setUser(response.user);
        } catch (error) {
          console.warn('Token invalid or expired, logging out');
          logout();
        }
      }
      setIsLoading(false);
    };

    initializeAuth();
  }, []);

  // 🔹 Login
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const { token, user } = await authAPI.login({ email, password });
      if (!token || !user) return false;

      localStorage.setItem('auth_token', token);
      authAPI.setToken(token);
      setUser(user);

      return true;
    } catch (error) {
      console.error('Login failed:', error);
      return false;
    }
  };

  // 🔹 Register
  const register = async (username: string, email: string, password: string): Promise<boolean> => {
    try {
      const { token, user } = await authAPI.register({ username, email, password });
      if (!token || !user) return false;

      localStorage.setItem('auth_token', token);
      authAPI.setToken(token);
      setUser(user);

      return true;
    } catch (error) {
      console.error('Registration failed:', error);
      return false;
    }
  };

  // 🔹 Logout
  const logout = () => {
    setUser(null);
    // Clear both user and admin tokens to prevent conflicts
    localStorage.removeItem('auth_token');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('adminUser');
    authAPI.setToken(null);
  };

  // 🔹 Refresh profile
  const refreshProfile = async () => {
    try {
      const response = await authAPI.getProfile();
      setUser(response.user);
    } catch (error) {
      console.error('Profile refresh failed, logging out');
      logout();
    }
  };

  const value = { user, isLoading, login, register, logout, refreshProfile };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

// Custom hook
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
