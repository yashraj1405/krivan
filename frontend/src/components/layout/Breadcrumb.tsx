import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { ChevronRight, Home } from 'lucide-react';

const routeNames: Record<string, string> = {
  '': 'Home',
  products: 'Products Catalogue',
  batches: 'Manufacturing Batches',
  dealers: 'Dealer Network',
  dispatch: 'Logistics Dispatch',
  'qr-codes': 'QR Code Registry',
  settings: 'System Settings',
};

export const Breadcrumb: React.FC = () => {
  const location = useLocation();
  const pathnames = location.pathname.split('/').filter((x) => x);

  return (
    <nav className="flex items-center space-x-2 text-xs text-slate-500 dark:text-slate-400">
      <Link
        to="/"
        className="flex items-center space-x-1 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
      >
        <Home size={14} />
        <span>Dashboard</span>
      </Link>

      {pathnames.map((value, index) => {
        const to = `/${pathnames.slice(0, index + 1).join('/')}`;
        const isLast = index === pathnames.length - 1;
        const displayName = routeNames[value] || value.charAt(0).toUpperCase() + value.slice(1);

        return (
          <React.Fragment key={to}>
            <ChevronRight size={12} className="text-slate-300 dark:text-slate-600" />
            {isLast ? (
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {displayName}
              </span>
            ) : (
              <Link
                to={to}
                className="hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
              >
                {displayName}
              </Link>
            )}
          </React.Fragment>
        );
      })}
    </nav>
  );
};
