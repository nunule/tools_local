import * as React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'secondary' | 'outline' | 'success' | 'warning';
}

export function Badge({ className, variant = 'default', ...props }: BadgeProps) {
  return (
    <div
      className={cn(
        'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2',
        {
          'bg-primary/15 text-primary border border-primary/20': variant === 'default',
          'bg-secondary text-secondary-foreground border border-border': variant === 'secondary',
          'border border-border text-foreground': variant === 'outline',
          'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border border-emerald-500/20': variant === 'success',
          'bg-amber-500/15 text-amber-600 dark:text-amber-400 border border-amber-500/20': variant === 'warning',
        },
        className
      )}
      {...props}
    />
  );
}
