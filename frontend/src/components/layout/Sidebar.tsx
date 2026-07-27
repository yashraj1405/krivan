import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import {
  LayoutDashboard,
  Sprout,
  Layers,
  Users,
  Truck,
  QrCode,
  Settings as SettingsIcon,
  X,
  LogOut,
  User as UserIcon,
  ShieldCheck,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { cn } from '../../lib/utils';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  name: string;
  href: string;
  icon: React.ReactNode;
  badge?: string;
}

export const Sidebar: React.FC<SidebarProps> = ({ isOpen, onClose }) => {
  const { user, logout } = useAuth();
  const location = useLocation();

  const navigation: NavItem[] = [
    { name: 'Dashboard', href: '/', icon: <LayoutDashboard size={18} /> },
    { name: 'Products', href: '/products', icon: <Sprout size={18} /> },
    { name: 'Batches', href: '/batches', icon: <Layers size={18} /> },
    { name: 'Dealers', href: '/dealers', icon: <Users size={18} /> },
    { name: 'Dispatch', href: '/dispatch', icon: <Truck size={18} /> },
    { name: 'QR Codes', href: '/qr-codes', icon: <QrCode size={18} /> },
    { name: 'Settings', href: '/settings', icon: <SettingsIcon size={18} /> },
  ];

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-sm lg:hidden transition-opacity"
          onClick={onClose}
        />
      )}

      {/* Sidebar Container */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col transition-transform duration-300 transform lg:static lg:translate-x-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        {/* Brand Header */}
        <div className="h-16 px-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-3">
            <div className="p-2 bg-brand-50 dark:bg-brand-950/80 rounded-xl text-brand-600 dark:text-brand-400 border border-brand-100 dark:border-brand-900">
              <Sprout className="h-5 w-5" />
            </div>
            <div>
              <span className="font-extrabold text-slate-900 dark:text-slate-100 text-sm block leading-none tracking-tight">
                Fertilizer QR
              </span>
              <span className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-widest block mt-0.5">
                Traceability Admin
              </span>
            </div>
          </Link>
          <button
            className="lg:hidden p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg"
            onClick={onClose}
          >
            <X size={18} />
          </button>
        </div>

        {/* Navigation Section */}
        <nav className="flex-1 p-4 space-y-1 overflow-y-auto">
          <div className="px-3 pb-2 text-[10px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider">
            Main Navigation
          </div>
          {navigation.map((item) => {
            const active =
              item.href === '/'
                ? location.pathname === '/'
                : location.pathname.startsWith(item.href);

            return (
              <Link
                key={item.name}
                to={item.href}
                onClick={onClose}
                className={cn(
                  'flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition-all duration-150',
                  active
                    ? 'bg-brand-600 text-white shadow-md shadow-brand-600/20'
                    : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-slate-100'
                )}
              >
                <div className="flex items-center space-x-3">
                  <span className={cn(active ? 'text-white' : 'text-slate-400 dark:text-slate-500')}>
                    {item.icon}
                  </span>
                  <span>{item.name}</span>
                </div>
                {item.badge && (
                  <span className="px-2 py-0.5 text-[10px] bg-brand-100 text-brand-700 dark:bg-brand-900 dark:text-brand-300 rounded-full font-bold">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Enterprise Security Badge & User Footer */}
        <div className="p-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
          <div className="p-2.5 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 flex items-center space-x-2 text-[11px] text-slate-500 dark:text-slate-400">
            <ShieldCheck size={16} className="text-brand-600 dark:text-brand-400 shrink-0" />
            <span className="truncate">JWT Protected Session</span>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="flex items-center space-x-2.5 overflow-hidden">
              <div className="h-8 w-8 rounded-xl bg-brand-500/10 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs shrink-0 border border-brand-500/20">
                {user?.full_name?.charAt(0) || <UserIcon size={14} />}
              </div>
              <div className="overflow-hidden">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                  {user?.full_name || 'System Admin'}
                </span>
                <span className="text-[10px] text-slate-400 dark:text-slate-500 block truncate">
                  {user?.role || 'Admin'}
                </span>
              </div>
            </div>
            <button
              onClick={logout}
              className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-xl transition-colors shrink-0"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>
    </>
  );
};
