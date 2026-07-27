import React from 'react';
import { cn } from '../../lib/utils';

export type BadgeVariant =
  | 'success'
  | 'warning'
  | 'danger'
  | 'info'
  | 'neutral'
  | 'brand';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
  dot?: boolean;
}

export const Badge: React.FC<BadgeProps> = ({
  children,
  variant = 'neutral',
  className,
  dot = false,
}) => {
  const variantStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/50 dark:text-emerald-300 dark:border-emerald-800',
    warning: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/50 dark:text-amber-300 dark:border-amber-800',
    danger: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/50 dark:text-rose-300 dark:border-rose-800',
    info: 'bg-sky-50 text-sky-700 border-sky-200 dark:bg-sky-950/50 dark:text-sky-300 dark:border-sky-800',
    neutral: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:border-slate-700',
    brand: 'bg-brand-50 text-brand-700 border-brand-200 dark:bg-brand-950/50 dark:text-brand-300 dark:border-brand-800',
  };

  const dotStyles: Record<BadgeVariant, string> = {
    success: 'bg-emerald-500',
    warning: 'bg-amber-500',
    danger: 'bg-rose-500',
    info: 'bg-sky-500',
    neutral: 'bg-slate-400',
    brand: 'bg-brand-500',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center space-x-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold border transition-colors',
        variantStyles[variant],
        className
      )}
    >
      {dot && <span className={cn('h-1.5 w-1.5 rounded-full', dotStyles[variant])} />}
      <span>{children}</span>
    </span>
  );
};
