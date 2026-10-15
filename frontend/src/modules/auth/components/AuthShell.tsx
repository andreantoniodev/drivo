import React from 'react';
import Link from 'next/link';
import { AuthHero, AuthHeroProps } from './AuthHero';

export interface AuthShellProps {
  hero: AuthHeroProps;
  footer: { question: string; linkLabel: string; href: string };
  children: React.ReactNode;
}

export const AuthShell: React.FC<AuthShellProps> = ({ hero, footer, children }) => {
  return (
    <div className="min-h-screen h-screen w-full flex bg-bg text-white overflow-hidden">
      <AuthHero {...hero} />

      <div className="w-full lg:w-1/2 h-full flex flex-col overflow-y-auto">
        <div className="flex-1 flex items-center justify-center p-6">{children}</div>

        <div className="shrink-0 flex justify-center gap-1.5 text-sm pt-6 pb-[63px]">
          <p className="text-fg-muted">{footer.question}</p>
          <Link
            href={footer.href}
            className="text-accent hover:text-accent-hover font-medium transition-colors"
          >
            {footer.linkLabel}
          </Link>
        </div>
      </div>
    </div>
  );
};
