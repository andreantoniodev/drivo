import React, { useId, useState } from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface FieldProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  fieldVariant?: 'default' | 'password';
  rightElement?: React.ReactNode;
}

export const Field = React.forwardRef<HTMLInputElement, FieldProps>(
  (
    {
      id: customId,
      className,
      label,
      error,
      fieldVariant = 'default',
      type = 'text',
      rightElement,
      disabled,
      ...props
    },
    ref,
  ) => {
    const generatedId = useId();
    const inputId = customId || generatedId;
    const errorId = `${inputId}-error`;
    const [showPassword, setShowPassword] = useState(false);

    const isPassword = fieldVariant === 'password';
    const computedType = isPassword ? (showPassword ? 'text' : 'password') : type;

    return (
      <div className={cn('w-full flex flex-col gap-2 text-left', disabled && 'opacity-40')}>
        <label htmlFor={inputId} className="text-[13px] font-medium text-fg-muted">
          {label}
        </label>

        <div className="relative flex items-center">
          <input
            ref={ref}
            id={inputId}
            type={computedType}
            disabled={disabled}
            aria-invalid={Boolean(error)}
            aria-describedby={error ? errorId : undefined}
            className={cn(
              'w-full h-11 pl-3.5 pr-10 rounded-xl bg-surface-2 text-[15px] text-fg placeholder:text-fg-subtle',
              'border border-transparent transition-colors focus:outline-none',
              'disabled:cursor-not-allowed',
              error ? 'border-danger focus:border-danger' : 'focus:border-accent',
              className,
            )}
            {...props}
          />

          <div className="absolute right-3 flex items-center text-fg-subtle">
            {isPassword ? (
              <button
                type="button"
                onClick={() => setShowPassword((visible) => !visible)}
                aria-label={showPassword ? 'Ocultar senha' : 'Exibir senha'}
                className="p-0.5 hover:text-fg transition-colors focus:outline-none"
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            ) : (
              rightElement
            )}
          </div>
        </div>

        {error && (
          <p id={errorId} role="alert" className="text-xs text-danger">
            {error}
          </p>
        )}
      </div>
    );
  },
);

Field.displayName = 'Field';
