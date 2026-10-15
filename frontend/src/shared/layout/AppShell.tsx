'use client';

import React from 'react';
import { useRequireAuth } from '@/shared/auth/useRequireAuth';
import { Header } from './Header';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { ready } = useRequireAuth();

  if (!ready) return <div className="min-h-screen bg-bg" />;

  return (
    <div className="min-h-screen bg-bg text-white flex flex-col">
      <Header />
      {children}
    </div>
  );
};
