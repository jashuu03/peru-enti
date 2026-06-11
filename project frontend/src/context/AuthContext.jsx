import React, { createContext, useState, useEffect, useContext } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize and load current user if token exists
  useEffect(() => {
    const bootstrapAuth = async () => {
      const token = localStorage.getItem('token');
      if (token) {
        try {
          const userData = await api.auth.getMe();
          setUser(userData);
        } catch (error) {
          console.error('Session restoration failed:', error.message);
          localStorage.removeItem('token');
          setUser(null);
        }
      }
      setLoading(false);
    };

    bootstrapAuth();
  }, []);

  const signup = async (formData) => {
    setLoading(true);
    try {
      const data = await api.auth.signup(formData);
      localStorage.setItem('token', data.token);
      setUser(data);
      return data;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signin = async (credentials) => {
    setLoading(true);
    try {
      const data = await api.auth.signin(credentials);
      localStorage.setItem('token', data.token);
      setUser(data);
      return data;
    } catch (error) {
      setUser(null);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  const updateProfileState = (updatedUser) => {
    setUser(updatedUser);
  };

  return (
    <AuthContext.Provider value={{ user, loading, signup, signin, signout, updateProfileState }}>
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
