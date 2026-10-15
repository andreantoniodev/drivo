import React from 'react';
import { cn } from '@/lib/utils';

export type SearchInputProps = Omit<React.InputHTMLAttributes<HTMLInputElement>, 'type'> & {
  'aria-label': string;
};

export const SearchInput = React.forwardRef<HTMLInputElement, SearchInputProps>(
  ({ className, ...props }, ref) => (
    <input
      ref={ref}
      type="search"
      className={cn(
        'w-full h-11 px-3.5 rounded-xl bg-surface text-sm text-fg placeholder:text-fg-subtle',
        'border border-transparent transition-colors focus:outline-none focus:border-accent',
        className,
      )}
      {...props}
    />
  ),
);

SearchInput.displayName = 'SearchInput';
