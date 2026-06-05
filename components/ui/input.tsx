import * as React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, ...props }, ref) => (
    <input
      type={type}
      className={cn(
        'flex h-12 w-full rounded-xl border border-app-border bg-app-surface px-4',
        'text-base text-app-text placeholder:text-app-muted/60',
        'focus-visible:outline-none focus-visible:border-ps-blue focus-visible:ring-2 focus-visible:ring-ps-blue/20',
        'transition-all duration-150 disabled:cursor-not-allowed disabled:opacity-50',
        className
      )}
      ref={ref}
      {...props}
    />
  )
);
Input.displayName = 'Input';
export { Input };
