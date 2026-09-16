import React, { createContext, useContext, useState, useEffect } from 'react';
import api from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const token = localStorage.getItem('genius_token');
    const savedUser = localStorage.getItem('genius_user');
    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch { /* ignore */ }
    }
    setLoading(false);
  }, []);

  const login = (token, userData) => {
    localStorage.setItem('genius_token', token);
    localStorage.setItem('genius_user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginStudent = async (parent_phone, password, grade) => {
    const res = await api.post('/auth/student/login', { parent_phone, password, grade });
    const { token, student } = res.data;
    const userData = { ...student, role: 'student' };
    login(token, userData);
    return student;
  };

  const registerStudent = async (data) => {
    const res = await api.post('/auth/student/register', data);
    const { token, student } = res.data;
    const userData = { ...student, role: 'student' };
    login(token, userData);
    return student;
  };

  const loginAdmin = async (username, password) => {
    const res = await api.post('/auth/admin/login', { username, password });
    const { token, admin } = res.data;
    const userData = { ...admin, role: 'admin' };
    login(token, userData);
    return admin;
  };

  const logout = () => {
    localStorage.removeItem('genius_token');
    localStorage.removeItem('genius_user');
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginStudent, registerStudent, loginAdmin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
}
