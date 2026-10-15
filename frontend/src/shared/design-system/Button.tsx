import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'tonal' | 'danger' | 'danger-soft' | 'ghost';
  size?: 'sm' | 'md';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const variants = {
  primary: 'bg-accent hover:bg-accent-hover active:bg-accent-pressed text-white',
  secondary: 'bg-surface-2 hover:bg-surface-3 active:bg-surface-4 text-fg',
  tonal: 'bg-surface-3 hover:bg-surface-4 text-fg',
  danger: 'bg-danger hover:bg-danger-hover active:bg-danger-pressed text-white',
  'danger-soft': 'bg-danger/12 hover:bg-danger/20 active:bg-danger/25 text-danger',
  ghost: 'bg-transparent hover:bg-surface-2 text-fg-muted hover:text-fg',
} as const;

const sizes = {
  md: 'h-11 px-5 rounded-xl text-[15px] gap-2',
  sm: 'h-9 px-4 rounded-[10px] text-sm gap-1.5',
} as const;

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = 'primary',
      size = 'md',
      isLoading = false,
      leftIcon,
      rightIcon,
      children,
      disabled,
      type = 'button',
      ...props
    },
    ref,
  ) => (
    <button
      ref={ref}
      type={type}
      disabled={disabled || isLoading}
      aria-busy={isLoading || undefined}
      className={cn(
        'inline-flex items-center justify-center font-semibold select-none transition-colors',
        'focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent',
        'disabled:cursor-not-allowed disabled:opacity-35',
        isLoading && 'disabled:opacity-100 cursor-progress',
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    >
      {isLoading ? (
        <Loader2 className="w-4 h-4 animate-spin text-current" aria-hidden />
      ) : (
        <>
          {leftIcon && <span className="shrink-0">{leftIcon}</span>}
          {children}
          {rightIcon && <span className="shrink-0">{rightIcon}</span>}
        </>
      )}
    </button>
  ),
);

Button.displayName = 'Button';
