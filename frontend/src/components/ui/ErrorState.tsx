import React from 'react';
import { AlertCircle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({
  title = 'Failed to load data',
  message = 'An error occurred while connecting to the backend server. Please verify network connectivity.',
  onRetry,
}) => {
  return (
    <div className="p-6 bg-rose-50 dark:bg-rose-950/30 border border-rose-200 dark:border-rose-900/50 rounded-3xl flex flex-col sm:flex-row items-center justify-between gap-4 my-4">
      <div className="flex items-center space-x-3">
        <div className="p-3 bg-rose-100 dark:bg-rose-900/50 text-rose-600 dark:text-rose-400 rounded-2xl">
          <AlertCircle size={22} />
        </div>
        <div>
          <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">{title}</h4>
          <p className="text-xs text-rose-700 dark:text-rose-300 mt-0.5">{message}</p>
        </div>
      </div>
      {onRetry && (
        <button
          onClick={onRetry}
          className="flex items-center space-x-1.5 px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-semibold text-xs rounded-xl transition-colors shrink-0 shadow-sm"
        >
          <RefreshCw size={14} />
          <span>Retry</span>
        </button>
      )}
    </div>
  );
};
