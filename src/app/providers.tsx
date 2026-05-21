"use client";

/**
 * @deprecated This file is deprecated and kept for backward compatibility only.
 * Use AuthProvider from @/providers/auth-provider instead.
 *
 * This demo user context will be removed in a future version.
 * Migrate all usages of useDemoUser() to useAuth() from @/providers/auth-provider.
 */

import React, { createContext, useContext } from 'react';

type DemoUser = {
  id: string;
  name: string;
};

const DemoUserContext = createContext<DemoUser | null>(null);

export function Providers({ children }: { children: React.ReactNode }) {
  const demoUser: DemoUser = { id: 'demo-user-001', name: 'Demo User' };

  return <DemoUserContext.Provider value={demoUser}>{children}</DemoUserContext.Provider>;
}

export function useDemoUser() {
  const ctx = useContext(DemoUserContext);
  if (!ctx) throw new Error('useDemoUser must be used within Providers');
  return ctx;
}
