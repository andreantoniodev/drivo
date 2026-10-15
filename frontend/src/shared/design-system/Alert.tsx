import React from 'react';
import { AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface AlertProps {
  children: React.ReactNode;
  className?: string;
}

export const Alert: React.FC<AlertProps> = ({ children, className }) => (
  <div
    role="alert"
    className={cn(
      'flex items-center gap-2.5 p-3 rounded-xl bg-danger/10 border border-danger/20 text-[13px] leading-relaxed text-danger',
      className,
    )}
  >
    <AlertCircle className="w-4 h-4 shrink-0" aria-hidden />
    <span>{children}</span>
  </div>
);
