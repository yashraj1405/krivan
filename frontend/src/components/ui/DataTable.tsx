import React from 'react';
import { ArrowUpDown, ArrowUp, ArrowDown } from 'lucide-react';
import { LoadingSpinner } from './LoadingSpinner';
import { EmptyState } from './EmptyState';
import { Pagination } from './Pagination';
import { cn } from '../../lib/utils';

export interface Column<T> {
  key: string;
  header: React.ReactNode;
  render?: (item: T) => React.ReactNode;
  sortable?: boolean;
  className?: string;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  loading?: boolean;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (item: T) => void;
  // Sort properties
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  onSortChange?: (field: string) => void;
  // Pagination properties
  page?: number;
  pageSize?: number;
  totalItems?: number;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  keyExtractor?: (item: T, index: number) => string | number;
}

export function DataTable<T extends Record<string, any>>({
  columns,
  data,
  loading = false,
  emptyTitle = 'No records found',
  emptyDescription = 'There are no records matching your request at this moment.',
  onRowClick,
  sortBy,
  sortOrder,
  onSortChange,
  page,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  keyExtractor,
}: DataTableProps<T>) {
  const handleSort = (key: string, sortable?: boolean) => {
    if (sortable && onSortChange) {
      onSortChange(key);
    }
  };

  return (
    <div className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm overflow-hidden flex flex-col">
      <div className="overflow-x-auto relative">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="border-b border-slate-200 dark:border-slate-800 bg-slate-50/70 dark:bg-slate-800/40 text-[11px] font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
              {columns.map((col) => (
                <th
                  key={col.key}
                  className={cn(
                    'px-6 py-4 transition-colors',
                    col.sortable && 'cursor-pointer hover:text-slate-800 dark:hover:text-slate-200 select-none',
                    col.className
                  )}
                  onClick={() => handleSort(col.key, col.sortable)}
                >
                  <div className="flex items-center space-x-1.5">
                    <span>{col.header}</span>
                    {col.sortable && (
                      <span className="text-slate-400">
                        {sortBy === col.key ? (
                          sortOrder === 'asc' ? (
                            <ArrowUp size={12} className="text-brand-600 dark:text-brand-400" />
                          ) : (
                            <ArrowDown size={12} className="text-brand-600 dark:text-brand-400" />
                          )
                        ) : (
                          <ArrowUpDown size={12} />
                        )}
                      </span>
                    )}
                  </div>
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-xs text-slate-700 dark:text-slate-300">
            {loading ? (
              <tr>
                <td colSpan={columns.length} className="py-16 text-center">
                  <LoadingSpinner size="lg" label="Fetching live records..." />
                </td>
              </tr>
            ) : data.length > 0 ? (
              data.map((item, index) => {
                const rowKey = keyExtractor ? keyExtractor(item, index) : item.id || index;
                return (
                  <tr
                    key={rowKey}
                    onClick={() => onRowClick && onRowClick(item)}
                    className={cn(
                      'transition-colors duration-150',
                      onRowClick ? 'cursor-pointer hover:bg-slate-50 dark:hover:bg-slate-800/60' : 'hover:bg-slate-50/50 dark:hover:bg-slate-800/30'
                    )}
                  >
                    {columns.map((col) => (
                      <td key={col.key} className={cn('px-6 py-4', col.className)}>
                        {col.render ? col.render(item) : item[col.key] ?? '—'}
                      </td>
                    ))}
                  </tr>
                );
              })
            ) : (
              <tr>
                <td colSpan={columns.length} className="p-4">
                  <EmptyState title={emptyTitle} description={emptyDescription} />
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Container */}
      {page !== undefined && pageSize !== undefined && totalItems !== undefined && onPageChange && (
        <Pagination
          currentPage={page}
          pageSize={pageSize}
          totalItems={totalItems}
          onPageChange={onPageChange}
          onPageSizeChange={onPageSizeChange}
        />
      )}
    </div>
  );
}
