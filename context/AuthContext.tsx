import React, { createContext, useContext, useState } from 'react';
import { api } from '@/services/api';

type User = {
  id: string;
  username: string;
  email: string;
};

type AuthContextType = {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  signup: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);

  async function login(email: string, password: string) {
    const data = await api.login(email, password);
    setToken(data.token);
    setUser(data.user);
  }

  async function signup(username: string, email: string, password: string) {
    const data = await api.signup(username, email, password);
    setToken(data.token);
    setUser(data.user);
  }

  function logout() {
    setToken(null);
    setUser(null);
  }

  return (
    <AuthContext.Provider value={{ token, user, login, signup, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth has to be used inside AuthProvider');
  return ctx;
}
