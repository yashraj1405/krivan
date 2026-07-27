import React from 'react';
import { Menu, Sun, Moon, LogOut, User as UserIcon } from 'lucide-react';
import { Breadcrumb } from './Breadcrumb';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../hooks/useAuth';

interface NavbarProps {
  onMenuClick: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onMenuClick }) => {
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();

  return (
    <header className="h-16 bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-4 sm:px-6 flex items-center justify-between sticky top-0 z-30 transition-colors">
      <div className="flex items-center space-x-3">
        <button
          className="lg:hidden p-2 text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          onClick={onMenuClick}
          title="Open Menu"
        >
          <Menu size={20} />
        </button>

        {/* Dynamic Breadcrumbs */}
        <div className="hidden sm:block">
          <Breadcrumb />
        </div>
      </div>

      <div className="flex items-center space-x-3">
        {/* Dark Mode Toggle */}
        <button
          onClick={toggleTheme}
          className="p-2 text-slate-500 dark:text-slate-400 hover:text-slate-800 dark:hover:text-slate-100 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          title={`Switch to ${theme === 'dark' ? 'Light' : 'Dark'} Mode`}
        >
          {theme === 'dark' ? <Sun size={18} className="text-amber-400" /> : <Moon size={18} />}
        </button>

        <div className="h-4 w-px bg-slate-200 dark:bg-slate-800 hidden sm:block" />

        {/* Admin Quick Profile */}
        <div className="flex items-center space-x-2">
          <div className="hidden sm:flex flex-col text-right">
            <span className="text-xs font-bold text-slate-800 dark:text-slate-200 leading-none">
              {user?.full_name || 'Admin'}
            </span>
            <span className="text-[10px] text-slate-400 dark:text-slate-500 leading-tight">
              {user?.email || 'admin@fertilizer.com'}
            </span>
          </div>
          <div className="h-8 w-8 rounded-xl bg-brand-50 dark:bg-brand-950 text-brand-600 dark:text-brand-400 flex items-center justify-center font-bold text-xs border border-brand-100 dark:border-brand-900">
            {user?.full_name?.charAt(0) || <UserIcon size={14} />}
          </div>
          <button
            onClick={logout}
            className="sm:hidden p-1.5 text-slate-400 hover:text-rose-600 rounded-xl"
            title="Log Out"
          >
            <LogOut size={16} />
          </button>
        </div>
      </div>
    </header>
  );
};
