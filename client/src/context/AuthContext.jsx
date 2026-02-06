import { createContext, useContext, useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/axios';

const AuthContext = createContext(null);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState({
    name: 'Admin User',
    email: 'admin@iafds.com',
    role: 'Administrator'
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  // Auto-authenticate user on mount
  useEffect(() => {
    const initAuth = () => {
      // Always set a default user
      const defaultUser = {
        name: 'Admin User',
        email: 'admin@iafds.com',
        role: 'Administrator'
      };
      setUser(defaultUser);
      localStorage.setItem('token', 'mock-token');
      localStorage.setItem('user', JSON.stringify(defaultUser));
    };

    initAuth();
  }, []);

  const login = async (email, password) => {
    try {
      const response = await api.post('/auth/login', { email, password });
      const { token, user: userData } = response.data;

      localStorage.setItem('token', token);
      localStorage.setItem('user', JSON.stringify(userData));
      setUser(userData);

      navigate('/dashboard');
      return { success: true };
    } catch (error) {
      console.error('Login error:', error);
      return {
        success: false,
        message: error.response?.data?.message || 'Login failed. Please try again.',
      };
    }
  };

  const logout = () => {
    // Optional: Keep user logged in or redirect to dashboard
    navigate('/dashboard');
  };

  const isAuthenticated = () => {
    return !!user && !!localStorage.getItem('token');
  };

  const value = {
    user,
    login,
    logout,
    isAuthenticated,
    loading,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};
