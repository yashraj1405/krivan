import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  Sprout,
  Layers,
  Users,
  QrCode,
  Truck,
  ArrowRight,
  ShieldCheck,
  Boxes,
} from 'lucide-react';
import api from '../services/api';
import { DataTable } from '../components/ui/DataTable';
import type { Column } from '../components/ui/DataTable';
import { Badge } from '../components/ui/Badge';
import { formatDateTime, formatDate } from '../lib/utils';

interface LastGeneratedQR {
  batch_id: string;
  batch_number: string;
  product_name: string;
  qr_token: string;
  qr_generated_at: string;
}

interface DashboardMetrics {
  total_products: number;
  total_batches: number;
  total_dealers: number;
  active_dealers: number;
  total_qrs: number;
  total_scans: number;
  total_dispatches: number;
  total_manufactured: number;
  total_dispatched_qty: number;
  remaining_inventory: number;
  last_generated_qr?: LastGeneratedQR | null;
  recent_scans?: RecentScanActivity[];
  recent_dispatches?: RecentDispatchActivity[];
}

interface RecentScanActivity {
  id: string;
  qr_token: string;
  product_name: string;
  batch_number: string;
  scanned_at: string;
  status: 'Verified' | 'Duplicate' | 'Flagged';
  location: string;
  ip_address?: string;
}

interface RecentDispatchActivity {
  id: string;
  dispatch_number: string;
  batch_number: string;
  product_name: string;
  dealer_name: string;
  quantity: number;
  dispatch_date: string;
  invoice_number: string;
}

export const Dashboard: React.FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>({
    total_products: 0,
    total_batches: 0,
    total_dealers: 0,
    active_dealers: 0,
    total_qrs: 0,
    total_scans: 0,
    total_dispatches: 0,
    total_manufactured: 0,
    total_dispatched_qty: 0,
    remaining_inventory: 0,
    last_generated_qr: null,
    recent_scans: [],
    recent_dispatches: [],
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const response = await api.get('/dashboard/');
        if (response.data) {
          setMetrics(response.data);
        }
      } catch {
        // Fallback
      } finally {
        setLoading(false);
      }
    };
    fetchDashboard();
  }, []);

  const scanColumns: Column<RecentScanActivity>[] = [
    {
      key: 'qr_token',
      header: 'QR Token',
      render: (item) => (
        <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-xs">
          {item.qr_token}
        </span>
      ),
    },
    {
      key: 'product_name',
      header: 'Product',
      render: (item) => <span className="font-semibold text-slate-800 dark:text-slate-200">{item.product_name}</span>,
    },
    {
      key: 'batch_number',
      header: 'Batch Number',
      render: (item) => <span className="font-mono text-slate-600 dark:text-slate-400">{item.batch_number}</span>,
    },
    {
      key: 'scanned_at',
      header: 'Scan Time',
      render: (item) => formatDateTime(item.scanned_at),
    },
    {
      key: 'status',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.status === 'Verified' ? 'success' : 'danger'} dot>
          {item.status}
        </Badge>
      ),
    },
  ];

  const dispatchColumns: Column<RecentDispatchActivity>[] = [
    {
      key: 'dispatch_number',
      header: 'Dispatch #',
      render: (item) => (
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded border border-blue-200/50">
          {item.dispatch_number}
        </span>
      ),
    },
    {
      key: 'dealer_name',
      header: 'Recipient Dealer',
      render: (item) => <span className="font-bold text-slate-800 dark:text-slate-200">{item.dealer_name}</span>,
    },
    {
      key: 'batch_number',
      header: 'Batch & Product',
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-800 dark:text-slate-200 block">{item.batch_number}</span>
          <span className="text-[11px] text-slate-500 block">{item.product_name}</span>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Qty Dispatched',
      render: (item) => (
        <span className="font-black text-slate-900 dark:text-slate-100">
          {item.quantity.toLocaleString()} units
        </span>
      ),
    },
    {
      key: 'dispatch_date',
      header: 'Date',
      render: (item) => formatDate(item.dispatch_date),
    },
  ];

  const statCards = [
    {
      title: 'Products Catalogue',
      value: metrics.total_products,
      href: '/products',
      icon: <Sprout className="h-5 w-5" />,
      color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-400 border-emerald-200 dark:border-emerald-800',
    },
    {
      title: 'Batches Manufactured',
      value: metrics.total_batches,
      href: '/batches',
      icon: <Layers className="h-5 w-5" />,
      color: 'bg-sky-50 dark:bg-sky-950/50 text-sky-600 dark:text-sky-400 border-sky-200 dark:border-sky-800',
    },
    {
      title: 'Active Dealers',
      value: `${metrics.active_dealers} / ${metrics.total_dealers}`,
      href: '/dealers',
      icon: <Users className="h-5 w-5" />,
      color: 'bg-purple-50 dark:bg-purple-950/50 text-purple-600 dark:text-purple-400 border-purple-200 dark:border-purple-800',
    },
    {
      title: 'Total Dispatches',
      value: metrics.total_dispatches,
      href: '/dispatch',
      icon: <Truck className="h-5 w-5" />,
      color: 'bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-400 border-blue-200 dark:border-blue-800',
    },
    {
      title: 'Remaining Inventory',
      value: `${metrics.remaining_inventory.toLocaleString()} units`,
      href: '/batches',
      icon: <Boxes className="h-5 w-5" />,
      color: 'bg-amber-50 dark:bg-amber-950/50 text-amber-600 dark:text-amber-400 border-amber-200 dark:border-amber-800',
    },
    {
      title: 'Total Scans',
      value: metrics.total_scans,
      href: '/qr-codes',
      icon: <QrCode className="h-5 w-5" />,
      color: 'bg-brand-50 dark:bg-brand-950/50 text-brand-600 dark:text-brand-400 border-brand-200 dark:border-brand-800',
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-900 text-white rounded-3xl p-6 md:p-8 shadow-xl relative overflow-hidden">
        <div className="space-y-2 relative z-10">
          <div className="flex items-center space-x-2 text-brand-400 text-xs font-bold uppercase tracking-wider">
            <ShieldCheck size={16} />
            <span>Traceability System Engine</span>
          </div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight">Fertilizer Operations Dashboard</h1>
          <p className="text-slate-400 text-xs md:text-sm max-w-xl">
            Real-time batch tracking, dealer distribution logistics, and single-batch QR verification analytics.
          </p>
        </div>

        <div className="flex items-center space-x-3 relative z-10">
          <Link
            to="/dispatch"
            className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-blue-600/30"
          >
            <Truck size={16} />
            <span>Create Dispatch</span>
          </Link>
          <Link
            to="/batches"
            className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-lg shadow-brand-600/30"
          >
            <Layers size={16} />
            <span>New Batch</span>
          </Link>
        </div>
      </div>

      {/* Metrics Cards Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
        {statCards.map((card, idx) => (
          <Link
            key={idx}
            to={card.href}
            className="bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-4 rounded-2xl shadow-sm hover:shadow-md transition-all group"
          >
            <div className="flex items-center justify-between">
              <div className={`p-2.5 rounded-xl border ${card.color}`}>{card.icon}</div>
              <ArrowRight size={16} className="text-slate-300 dark:text-slate-600 group-hover:text-slate-600 dark:group-hover:text-slate-300 transition-colors" />
            </div>
            <div className="mt-3">
              <span className="text-[11px] font-bold text-slate-400 dark:text-slate-500 uppercase tracking-wider block">
                {card.title}
              </span>
              <span className="text-lg font-black text-slate-900 dark:text-slate-100 tracking-tight block mt-0.5">
                {card.value}
              </span>
            </div>
          </Link>
        ))}
      </div>

      {/* Recent Dispatches Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Recent Dealer Shipments</h2>
            <p className="text-xs text-slate-500">Latest distribution dispatches to authorized dealers</p>
          </div>
          <Link to="/dispatch" className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
            View All Dispatches <ArrowRight size={14} />
          </Link>
        </div>
        <DataTable
          columns={dispatchColumns}
          data={metrics.recent_dispatches || []}
          loading={loading}
          emptyTitle="No recent dispatches"
          emptyDescription="No batch dispatches recorded yet."
        />
      </div>

      {/* Live Verification Log Table */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-black text-slate-900 dark:text-slate-100">Live Customer Verification Scans</h2>
            <p className="text-xs text-slate-500">Real-time scan logs from mobile QR customer scans</p>
          </div>
          <Link to="/qr-codes" className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1">
            View QR Registry <ArrowRight size={14} />
          </Link>
        </div>
        <DataTable
          columns={scanColumns}
          data={metrics.recent_scans || []}
          loading={loading}
          emptyTitle="No scan activity recorded yet"
          emptyDescription="Customer scans will appear here when QR codes are scanned."
        />
      </div>
    </div>
  );
};
