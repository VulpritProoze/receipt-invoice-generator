'use client';

import React, { createContext, useContext, useState, useCallback } from 'react';

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
 * 
 * Current implementation: Demo/stub authentication with hardcoded user
 * 
 * TODO: Replace with real authentication implementation:
 * - NextAuth.js for session management
 * - JWT token validation
 * - OAuth providers (Google, GitHub, etc.)
 * - Secure session storage
 * 
 * The interface (AuthContextType) is designed to remain stable when
 * swapping implementations - downstream components should not need changes.
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  // Demo implementation: hardcoded user
  // In production, this would come from session/JWT validation
  const [user] = useState<AuthUser>({
    id: 'demo-user-001',
    name: 'Demo User',
    email: 'demo@example.com'
  });

  const isAuthenticated = user !== null;

  /**
   * Login stub - currently no-op
   * TODO: Implement real login flow (redirect to auth provider, handle callback)
   */
  const login = useCallback(async () => {
    console.warn('Login stub called - implement real auth flow');
    // In production: redirect to auth provider or show login modal
  }, []);

  /**
   * Logout stub - currently no-op
   * TODO: Implement real logout (clear session, redirect to login)
   */
  const logout = useCallback(async () => {
    console.warn('Logout stub called - implement real auth flow');
    // In production: clear session, invalidate tokens, redirect
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
 * 
 * @throws Error if used outside AuthProvider
 * @returns AuthContextType with user, isAuthenticated, login, logout
 * 
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, logout } = useAuth();
 *   
 *   if (!isAuthenticated) {
 *     return <div>Please log in</div>;
 *   }
 *   
 *   return <div>Welcome, {user.name}!</div>;
 * }
 * ```
 */
export function useAuth(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}

// Made with Bob
