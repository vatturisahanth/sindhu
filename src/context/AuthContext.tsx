import React, { createContext, useContext, useEffect, useState } from 'react';

interface User {
  uid: string;
  email: string | null;
  displayName: string | null;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, pass: string) => Promise<void>;
  googleLogin: () => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const MOCK_USER: User = {
  uid: 'mock-user-123',
  email: 'demo@example.com',
  displayName: 'Demo User',
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('smartbudget_auth');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, pass: string) => {
    // Mock login
    const user = { ...MOCK_USER, email };
    setUser(user);
    localStorage.setItem('smartbudget_auth', JSON.stringify(user));
  };

  const googleLogin = async () => {
    // Mock Google login
    setUser(MOCK_USER);
    localStorage.setItem('smartbudget_auth', JSON.stringify(MOCK_USER));
  };

  const logout = async () => {
    setUser(null);
    localStorage.removeItem('smartbudget_auth');
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, googleLogin, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
