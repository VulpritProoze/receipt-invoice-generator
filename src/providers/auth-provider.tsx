'use client';

import React, { createContext, useContext, useCallback, useMemo } from 'react';
import { useSession, signIn, signOut } from 'next-auth/react';

/**
 * Authentication user type
 */
export type AuthUser = {
  id: string;
  name: string;
  email: string;
};

/**
 * Authentication context type
 */
export type AuthContextType = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  login: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

/**
 * AuthProvider - Pluggable authentication provider
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session } = useSession();

  const user = useMemo<AuthUser | null>(() => {
    if (!session?.user) return null;
    return {
      // @ts-ignore NextAuth session.user may not have an id by default without extending the types
      id: session.user.id || session.user.email || 'unknown',
      name: session.user.name || '',
      email: session.user.email || ''
    };
  }, [session]);

  const isAuthenticated = user !== null;

  const login = useCallback(async () => {
    await signIn();
  }, []);

  const logout = useCallback(async () => {
    await signOut();
  }, []);

  const value: AuthContextType = {
    user,
    isAuthenticated,
    login,
    logout
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * useAuth hook - Access authentication context
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Made with Bob
