import React, { createContext, useContext, useState, useCallback, useRef, useEffect } from 'react';
import { CheckCircle2, XCircle, AlertTriangle, Info, X } from 'lucide-react';
import { cn } from '../../lib/utils';

type ToastVariant = 'success' | 'error' | 'warning' | 'info';

interface ToastItem {
  id: string;
  variant: ToastVariant;
  title: string;
  message?: string;
  duration?: number;
}

interface ToastContextValue {
  toast: (item: Omit<ToastItem, 'id'>) => void;
}

const ToastContext = createContext<ToastContextValue | null>(null);

export const useToast = () => {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
};

const iconMap: Record<ToastVariant, React.ReactNode> = {
  success: <CheckCircle2 size={18} className="text-emerald-500" />,
  error: <XCircle size={18} className="text-rose-500" />,
  warning: <AlertTriangle size={18} className="text-amber-500" />,
  info: <Info size={18} className="text-sky-500" />,
};

const barColorMap: Record<ToastVariant, string> = {
  success: 'bg-emerald-500',
  error: 'bg-rose-500',
  warning: 'bg-amber-500',
  info: 'bg-sky-500',
};

const ToastCard: React.FC<{ item: ToastItem; onDismiss: (id: string) => void }> = ({ item, onDismiss }) => {
  const [exiting, setExiting] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout>>();

  const dismiss = useCallback(() => {
    setExiting(true);
    setTimeout(() => onDismiss(item.id), 200);
  }, [item.id, onDismiss]);

  useEffect(() => {
    const dur = item.duration ?? 4000;
    timerRef.current = setTimeout(dismiss, dur);
    return () => clearTimeout(timerRef.current);
  }, [dismiss, item.duration]);

  return (
    <div
      className={cn(
        'relative w-80 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-2xl shadow-xl overflow-hidden transition-all duration-200',
        exiting ? 'opacity-0 translate-x-8' : 'opacity-100 translate-x-0'
      )}
    >
      {/* Accent bar */}
      <div className={cn('absolute top-0 left-0 w-1 h-full rounded-l-2xl', barColorMap[item.variant])} />
      <div className="flex items-start gap-3 p-4 pl-5">
        <div className="shrink-0 mt-0.5">{iconMap[item.variant]}</div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-slate-900 dark:text-slate-100">{item.title}</p>
          {item.message && (
            <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5 leading-relaxed">{item.message}</p>
          )}
        </div>
        <button
          onClick={dismiss}
          className="shrink-0 p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
        >
          <X size={14} />
        </button>
      </div>
    </div>
  );
};

export const ToastProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const counterRef = useRef(0);

  const toast = useCallback((item: Omit<ToastItem, 'id'>) => {
    counterRef.current += 1;
    const id = `toast-${counterRef.current}-${Date.now()}`;
    setToasts((prev) => [...prev, { ...item, id }]);
  }, []);

  const dismiss = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toast }}>
      {children}
      {/* Toast container — fixed top-right */}
      <div className="fixed top-4 right-4 z-[9999] flex flex-col gap-3 pointer-events-none">
        {toasts.map((t) => (
          <div key={t.id} className="pointer-events-auto">
            <ToastCard item={t} onDismiss={dismiss} />
          </div>
        ))}
      </div>
    </ToastContext.Provider>
  );
};
