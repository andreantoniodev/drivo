'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/shared/auth/AuthContext';
import { cn } from '@/lib/utils';
import { DrivoLogo } from '@/shared/design-system';
import { getInitials } from '@/shared/utils/initials';

export interface HeaderProps {
  className?: string;
}

const navItems = [
  {
    href: '/',
    label: 'Meus veículos',
    isActive: (path: string) => path === '/' || path.startsWith('/veiculos'),
  },
  { href: '/perfil', label: 'Perfil', isActive: (path: string) => path.startsWith('/perfil') },
];

export const Header: React.FC<HeaderProps> = ({ className }) => {
  const pathname = usePathname();
  const { user } = useAuth();

  return (
    <header
      className={cn(
        'sticky top-0 z-40 w-full h-16 shrink-0 bg-bg px-6 md:px-10 flex items-center justify-between select-none',
        className,
      )}
    >
      <Link href="/" className="flex items-center gap-2.5 text-fg hover:opacity-90">
        <DrivoLogo width={58} height={18} />
        <span className="text-[17px] font-semibold tracking-[-0.4px]">Drivo</span>
      </Link>

      <nav className="absolute left-1/2 -translate-x-1/2 flex items-center gap-0.5 p-[3px] rounded-[11px] bg-surface">
        {navItems.map(({ href, label, isActive }) => (
          <Link
            key={href}
            href={href}
            aria-current={isActive(pathname) ? 'page' : undefined}
            className={cn(
              'px-4 py-1.5 rounded-lg text-sm font-medium whitespace-nowrap transition-colors',
              isActive(pathname) ? 'bg-surface-3 text-fg' : 'text-fg-muted hover:text-fg',
            )}
          >
            {label}
          </Link>
        ))}
      </nav>

      <Link
        href="/perfil"
        className="flex items-center gap-3 text-sm text-fg-muted hover:text-fg transition-colors"
      >
        <span className="hidden sm:block">{user?.name}</span>
        <span className="w-8 h-8 rounded-full bg-avatar flex items-center justify-center text-xs font-semibold text-white">
          {getInitials(user?.name)}
        </span>
      </Link>
    </header>
  );
};
