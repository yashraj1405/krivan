import React from 'react';
import { Search, X } from 'lucide-react';
import { cn } from '../../lib/utils';

interface SearchBarProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
}

export const SearchBar: React.FC<SearchBarProps> = ({
  value,
  onChange,
  placeholder = 'Search records...',
  className,
}) => {
  return (
    <div
      className={cn(
        'relative flex items-center bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl px-3.5 py-2 shadow-sm focus-within:border-brand-500 dark:focus-within:border-brand-400 focus-within:ring-1 focus-within:ring-brand-500 transition-all w-full max-w-sm',
        className
      )}
    >
      <Search className="h-4 w-4 text-slate-400 dark:text-slate-500 mr-2.5 shrink-0" />
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-transparent text-xs text-slate-800 dark:text-slate-100 placeholder-slate-400 dark:placeholder-slate-500 border-0 focus:outline-none"
      />
      {value && (
        <button
          onClick={() => onChange('')}
          className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-full transition-colors"
          title="Clear search"
        >
          <X size={14} />
        </button>
      )}
    </div>
  );
};
