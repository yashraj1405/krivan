import React from 'react';
import { AlertTriangle, AlertOctagon, Info, Loader2 } from 'lucide-react';
import { Modal } from './Modal';
import { cn } from '../../lib/utils';

interface ConfirmationDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  variant?: 'danger' | 'warning' | 'info';
  isLoading?: boolean;
}

export const ConfirmationDialog: React.FC<ConfirmationDialogProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  variant = 'danger',
  isLoading = false,
}) => {
  const iconMap = {
    danger: <AlertOctagon className="h-6 w-6 text-rose-600 dark:text-rose-400" />,
    warning: <AlertTriangle className="h-6 w-6 text-amber-600 dark:text-amber-400" />,
    info: <Info className="h-6 w-6 text-sky-600 dark:text-sky-400" />,
  };

  const bgMap = {
    danger: 'bg-rose-100 dark:bg-rose-950/60 border-rose-200 dark:border-rose-900',
    warning: 'bg-amber-100 dark:bg-amber-950/60 border-amber-200 dark:border-amber-900',
    info: 'bg-sky-100 dark:bg-sky-950/60 border-sky-200 dark:border-sky-900',
  };

  const buttonMap = {
    danger: 'bg-rose-600 hover:bg-rose-500 text-white shadow-rose-600/20',
    warning: 'bg-amber-600 hover:bg-amber-500 text-white shadow-amber-600/20',
    info: 'bg-brand-600 hover:bg-brand-500 text-white shadow-brand-600/20',
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title={title} maxWidth="sm">
      <div className="space-y-6">
        <div className="flex items-start space-x-3.5">
          <div className={cn('p-3 rounded-2xl border shrink-0', bgMap[variant])}>
            {iconMap[variant]}
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed pt-1">
            {message}
          </p>
        </div>

        <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={cn(
              'flex items-center space-x-1.5 px-4 py-2 text-xs font-semibold rounded-xl transition-all shadow-md disabled:opacity-50',
              buttonMap[variant]
            )}
          >
            {isLoading && <Loader2 className="animate-spin h-4 w-4" />}
            <span>{confirmLabel}</span>
          </button>
        </div>
      </div>
    </Modal>
  );
};
