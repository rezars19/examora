import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '../services/api';

export type UserRole = 'SUPERADMIN' | 'SCHOOL_ADMIN' | 'TEACHER' | 'STUDENT';

export interface User {
  id: string;
  fullName: string;
  role: UserRole;
  identifier: string;
  schoolId?: string | null;
}

export interface School {
  id: string;
  code: string;
  name: string;
}

interface AuthContextType {
  user: User | null;
  school: School | null;
  token: string | null;
  login: (data: { token: string; user: User; school?: School }) => void;
  logout: () => void;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [school, setSchool] = useState<School | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const savedToken = localStorage.getItem('examora_token');
    const savedUser = localStorage.getItem('examora_user');
    const savedSchool = localStorage.getItem('examora_school');

    if (savedToken && savedUser) {
      setToken(savedToken);
      setUser(JSON.parse(savedUser));
      if (savedSchool) {
        setSchool(JSON.parse(savedSchool));
      }
    }
    setIsLoading(false);
  }, []);

  const login = (data: { token: string; user: User; school?: School }) => {
    localStorage.setItem('examora_token', data.token);
    localStorage.setItem('examora_user', JSON.stringify(data.user));
    if (data.school) {
      localStorage.setItem('examora_school', JSON.stringify(data.school));
    }
    setToken(data.token);
    setUser(data.user);
    if (data.school) setSchool(data.school);
  };

  const logout = () => {
    localStorage.removeItem('examora_token');
    localStorage.removeItem('examora_user');
    localStorage.removeItem('examora_school');
    setToken(null);
    setUser(null);
    setSchool(null);
  };

  return (
    <AuthContext.Provider value={{ user, school, token, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within an AuthProvider');
  return ctx;
};
