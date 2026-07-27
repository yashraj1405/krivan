import React from 'react';
import { Loader2 } from 'lucide-react';
import { cn } from '../../lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  fullPage?: boolean;
  label?: string;
}

export const LoadingSpinner: React.FC<LoadingSpinnerProps> = ({
  size = 'md',
  className,
  fullPage = false,
  label = 'Loading...',
}) => {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-6 w-6',
    lg: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const spinner = (
    <div className="flex flex-col items-center justify-center space-y-3">
      <Loader2 className={cn('animate-spin text-brand-600 dark:text-brand-400', sizeClasses[size], className)} />
      {label && <span className="text-xs font-medium text-slate-500 dark:text-slate-400">{label}</span>}
    </div>
  );

  if (fullPage) {
    return (
      <div className="min-h-[60vh] w-full flex items-center justify-center p-6">
        {spinner}
      </div>
    );
  }

  return spinner;
};
