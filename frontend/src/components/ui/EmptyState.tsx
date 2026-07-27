import React from 'react';
import { PackageOpen } from 'lucide-react';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: {
    label: string;
    onClick: () => void;
    icon?: React.ReactNode;
  };
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon = <PackageOpen className="h-10 w-10 text-slate-400 dark:text-slate-500" />,
  title,
  description,
  action,
}) => {
  return (
    <div className="flex flex-col items-center justify-center p-12 text-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl my-4">
      <div className="p-4 bg-slate-100 dark:bg-slate-800/80 rounded-2xl mb-4">
        {icon}
      </div>
      <h3 className="text-base font-bold text-slate-800 dark:text-slate-200 mb-1">{title}</h3>
      {description && (
        <p className="text-xs text-slate-500 dark:text-slate-400 max-w-sm mb-6 leading-relaxed">
          {description}
        </p>
      )}
      {action && (
        <button
          onClick={action.onClick}
          className="inline-flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20"
        >
          {action.icon}
          <span>{action.label}</span>
        </button>
      )}
    </div>
  );
};
