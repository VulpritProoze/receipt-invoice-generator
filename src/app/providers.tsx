"use client";

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
