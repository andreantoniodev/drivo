'use client';

import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { deleteCookie, getCookie, setCookie } from 'cookies-next';
import { authService } from './auth.service';
import { AuthResponse, User } from './auth.types';

const TOKEN_KEY = 'drivo_token';
const USER_KEY = 'drivo_user';
const SESSION_MAX_AGE = 60 * 60 * 24 * 7;

interface AuthContextType {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (name: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const router = useRouter();
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const startSession = useCallback(
    ({ accessToken, user: sessionUser }: AuthResponse) => {
      setCookie(TOKEN_KEY, accessToken, { maxAge: SESSION_MAX_AGE, path: '/' });
      localStorage.setItem(TOKEN_KEY, accessToken);
      localStorage.setItem(USER_KEY, JSON.stringify(sessionUser));
      setToken(accessToken);
      setUser(sessionUser);
      router.push('/');
    },
    [router],
  );

  useEffect(() => {
    const restoreSession = async () => {
      try {
        const storedToken = (getCookie(TOKEN_KEY) as string) || localStorage.getItem(TOKEN_KEY);
        const storedUser = localStorage.getItem(USER_KEY);

        if (storedToken && storedUser) {
          setToken(storedToken);
          setUser(JSON.parse(storedUser));

          try {
            const freshUser = await authService.me();
            setUser(freshUser);
            localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
          } catch {}
        }
      } finally {
        setIsLoading(false);
      }
    };

    void restoreSession();
  }, []);

  const login = useCallback(
    async (email: string, password: string) =>
      startSession(await authService.login(email, password)),
    [startSession],
  );

  const register = useCallback(
    async (name: string, email: string, password: string) =>
      startSession(await authService.register(name, email, password)),
    [startSession],
  );

  const logout = useCallback(() => {
    deleteCookie(TOKEN_KEY, { path: '/' });
    localStorage.removeItem(TOKEN_KEY);
    localStorage.removeItem(USER_KEY);
    setToken(null);
    setUser(null);
    router.push('/login');
  }, [router]);

  const refreshUser = useCallback(async () => {
    const freshUser = await authService.me();
    setUser(freshUser);
    localStorage.setItem(USER_KEY, JSON.stringify(freshUser));
  }, []);

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(user),
        isLoading,
        login,
        register,
        logout,
        refreshUser,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth deve ser usado dentro de <AuthProvider>');
  return context;
}
