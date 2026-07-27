import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Batch, BatchListResponse, ProductListResponse } from '../interfaces';
import { DataTable, type Column } from '../components/ui/DataTable';
import { SearchBar } from '../components/ui/SearchBar';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { useToast } from '../components/ui/Toast';
import { formatDate, formatDateTime } from '../lib/utils';
import {
  QrCode, Download, Eye, Layers, Copy, Check, RefreshCw,
  Printer, ExternalLink, Sparkles
} from 'lucide-react';

const getBackendUrl = () => {
  const host = typeof window !== 'undefined' && window.location.hostname ? window.location.hostname : 'localhost';
  return `http://${host}:8000`;
};

export const QRCodes: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Filter & Pagination state
  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState('');
  const [qrStatusFilter, setQrStatusFilter] = useState<'all' | 'generated' | 'pending'>('all');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // UI States
  const [copiedToken, setCopiedToken] = useState<string | null>(null);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [regenerateTarget, setRegenerateTarget] = useState<Batch | null>(null);

  const backendUrl = getBackendUrl();
  const frontendOrigin = typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5173';

  // Fetch Products for filter
  const { data: productsData } = useQuery<ProductListResponse>({
    queryKey: ['products-filter-list'],
    queryFn: async () => {
      const res = await api.get<ProductListResponse>('/products/', {
        params: { limit: 100, sort_by: 'product_name', sort_order: 'asc' },
      });
      return res.data;
    },
  });

  // Fetch Batches
  const { data, isLoading } = useQuery<BatchListResponse>({
    queryKey: ['qr-batches', page, pageSize, search, productFilter, sortBy, sortOrder],
    queryFn: async () => {
      const skip = (page - 1) * pageSize;
      const params: Record<string, any> = { skip, limit: pageSize, sort_by: sortBy, sort_order: sortOrder };
      if (search) params.search = search;
      if (productFilter) params.product_id = productFilter;
      const res = await api.get<BatchListResponse>('/batches/', { params });
      return res.data;
    },
  });

  // Filter items by QR generation status client-side if selected
  const items = React.useMemo(() => {
    if (!data?.items) return [];
    if (qrStatusFilter === 'generated') {
      return data.items.filter((b) => !!b.qr_token);
    }
    if (qrStatusFilter === 'pending') {
      return data.items.filter((b) => !b.qr_token);
    }
    return data.items;
  }, [data?.items, qrStatusFilter]);

  // Generate / Regenerate Mutation
  const generateMutation = useMutation({
    mutationFn: async ({ id, force }: { id: string; force: boolean }) => {
      const res = await api.post(`/batches/${id}/generate-qr`, { force_regenerate: force }, {
        params: { force },
      });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['qr-batches'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({
        variant: 'success',
        title: variables.force ? 'QR Code Regenerated' : 'QR Code Generated',
        message: 'New secure token and PNG generated successfully.',
      });
      setRegenerateTarget(null);
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || 'Failed to generate QR Code';
      toast({
        variant: 'error',
        title: 'Generation Failed',
        message: typeof detail === 'string' ? detail : JSON.stringify(detail),
      });
      setRegenerateTarget(null);
    },
  });

  const handleCopyLink = (token: string) => {
    const url = `${frontendOrigin}/verify/${token}`;
    navigator.clipboard.writeText(url);
    setCopiedToken(token);
    toast({ variant: 'info', title: 'Link Copied', message: 'Verification link copied to clipboard.' });
    setTimeout(() => setCopiedToken(null), 2000);
  };

  // Printable QR Label window trigger
  const handlePrintQR = (batch: Batch) => {
    if (!batch.qr_token) return;
    const verifyUrl = `${frontendOrigin}/verify/${batch.qr_token}`;
    const qrImageUrl = `${backendUrl}/static/qrcodes/${batch.qr_token}.png`;

    const printWindow = window.open('', '_blank', 'width=600,height=700');
    if (!printWindow) {
      toast({ variant: 'error', title: 'Print Error', message: 'Pop-up blocker prevented opening print window.' });
      return;
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>QR Label - ${batch.batch_number}</title>
          <style>
            body { font-family: system-ui, -apple-system, sans-serif; margin: 0; padding: 20px; background: #fff; color: #000; }
            .label-card { border: 2px solid #000; border-radius: 12px; padding: 20px; text-align: center; max-width: 400px; margin: 0 auto; }
            .brand { font-size: 18px; font-weight: 900; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 4px; }
            .subtitle { font-size: 10px; text-transform: uppercase; color: #555; margin-bottom: 16px; font-weight: 700; }
            .qr-img { width: 180px; height: 180px; margin: 10px auto; display: block; border: 1px solid #ddd; padding: 6px; border-radius: 8px; }
            .token { font-family: monospace; font-size: 14px; font-weight: 700; background: #f0f0f0; padding: 4px 8px; border-radius: 4px; display: inline-block; margin-top: 6px; }
            .info-grid { text-align: left; font-size: 11px; margin-top: 16px; border-top: 1px border-dashed #ccc; padding-top: 12px; line-height: 1.6; }
            .info-grid strong { font-weight: 700; }
            @media print {
              body { padding: 0; }
              .label-card { border-width: 2px; }
            }
          </style>
        </head>
        <body>
          <div class="label-card">
            <div class="brand">KRIVAN AGRI-INPUTS</div>
            <div class="subtitle">Official Product Authenticity QR Label</div>
            <img src="${qrImageUrl}" class="qr-img" alt="QR Code" />
            <div class="token">TOKEN: ${batch.qr_token}</div>
            <div class="info-grid">
              <div><strong>Product:</strong> ${batch.product?.product_name || 'N/A'}</div>
              <div><strong>Batch Number:</strong> ${batch.batch_number}</div>
              <div><strong>MFG Date:</strong> ${formatDate(batch.manufacturing_date)} | <strong>EXP:</strong> ${formatDate(batch.expiry_date)}</div>
              <div><strong>Net Content:</strong> ${batch.net_content || 'N/A'} ${batch.mrp ? `| <strong>MRP:</strong> ₹${batch.mrp}` : ''}</div>
              <div style="margin-top: 6px; font-size: 9px; color: #666; text-align: center;">Scan to verify at: ${verifyUrl}</div>
            </div>
          </div>
          <script>
            window.onload = function() {
              window.print();
            }
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // Table Columns
  const columns: Column<Batch>[] = [
    {
      key: 'product',
      header: 'Product Line',
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
            {item.product?.product_name || '—'}
          </span>
          <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
            {item.product?.product_code || '—'}
          </span>
        </div>
      ),
    },
    {
      key: 'batch_number',
      header: 'Batch Number',
      sortable: true,
      render: (item) => (
        <div className="flex items-center space-x-2">
          <div className="p-1.5 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-lg shrink-0">
            <Layers size={14} />
          </div>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200 text-xs">
            {item.batch_number}
          </span>
        </div>
      ),
    },
    {
      key: 'qr_token',
      header: 'QR Token & Status',
      render: (item) => {
        if (!item.qr_token) {
          return <Badge variant="neutral" dot>Not Generated</Badge>;
        }
        return (
          <div className="space-y-1">
            <div className="flex items-center space-x-2">
              <Badge variant="success" dot>Generated</Badge>
              <span className="font-mono text-xs font-bold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-950/50 px-2 py-0.5 rounded border border-brand-200 dark:border-brand-900">
                {item.qr_token}
              </span>
              <button
                onClick={() => handleCopyLink(item.qr_token!)}
                className="p-1 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 rounded transition-colors"
                title="Copy verification URL"
              >
                {copiedToken === item.qr_token ? <Check size={12} className="text-emerald-500" /> : <Copy size={12} />}
              </button>
            </div>
            {item.scan_count != null && item.scan_count > 0 && (
              <span className="text-[10px] text-slate-500 dark:text-slate-400 block font-medium">
                Scanned {item.scan_count} {item.scan_count === 1 ? 'time' : 'times'}
              </span>
            )}
          </div>
        );
      },
    },
    {
      key: 'created_at',
      header: 'QR Generated Date',
      sortable: true,
      render: (item) =>
        item.qr_generated_at ? (
          <span className="text-xs text-slate-600 dark:text-slate-400">
            {formatDateTime(item.qr_generated_at)}
          </span>
        ) : (
          <span className="text-xs text-slate-400 dark:text-slate-600 font-mono">—</span>
        ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
          {!item.qr_token ? (
            <button
              onClick={() => generateMutation.mutate({ id: item.id, force: false })}
              disabled={generateMutation.isPending}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs rounded-xl shadow-sm transition-all"
            >
              <Sparkles size={13} />
              <span>Generate QR</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => {
                  setSelectedBatch(item);
                  setIsModalOpen(true);
                }}
                className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Preview & Print QR Code"
              >
                <Eye size={16} />
              </button>

              <a
                href={`${backendUrl}/api/v1/batches/qr-codes/download/${item.qr_token}`}
                target="_blank"
                rel="noreferrer"
                className="p-1.5 text-slate-400 hover:text-sky-600 dark:hover:text-sky-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Download PNG"
              >
                <Download size={16} />
              </a>

              <button
                onClick={() => handlePrintQR(item)}
                className="p-1.5 text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Print QR Label / Download PDF"
              >
                <Printer size={16} />
              </button>

              <button
                onClick={() => setRegenerateTarget(item)}
                className="p-1.5 text-slate-400 hover:text-amber-600 dark:hover:text-amber-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
                title="Regenerate QR Code"
              >
                <RefreshCw size={15} />
              </button>
            </>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Batch QR Code Registry
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Single QR per production batch architecture. Generate, inspect, download PNG/PDF, and print authentic verification labels.
          </p>
        </div>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Filter by batch number or product name..."
        />

        <div className="flex items-center space-x-3">
          <select
            value={productFilter}
            onChange={(e) => {
              setProductFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500 max-w-[180px]"
          >
            <option value="">All Products</option>
            {(productsData?.items || []).map((p) => (
              <option key={p.id} value={p.id}>
                {p.product_name}
              </option>
            ))}
          </select>

          <select
            value={qrStatusFilter}
            onChange={(e) => {
              setQrStatusFilter(e.target.value as any);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="all">All Batches</option>
            <option value="generated">QR Generated</option>
            <option value="pending">Pending Generation</option>
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={items}
        loading={isLoading}
        emptyTitle="No production batches found"
        emptyDescription="No manufacturing batches match your current filter parameters."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={(field) => {
          if (sortBy === field) setSortOrder((p) => (p === 'asc' ? 'desc' : 'asc'));
          else {
            setSortBy(field);
            setSortOrder('desc');
          }
        }}
        page={page}
        pageSize={pageSize}
        totalItems={qrStatusFilter !== 'all' ? items.length : (data?.total || 0)}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setPage(1);
        }}
      />

      {/* Preview Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title={selectedBatch ? `Batch QR Preview — ${selectedBatch.batch_number}` : 'Batch QR Preview'}
        subtitle={`Verification link: ${frontendOrigin}/verify/{token}`}
        maxWidth="lg"
      >
        {selectedBatch && selectedBatch.qr_token && (
          <div className="space-y-6 text-xs text-center flex flex-col items-center">
            <div className="p-4 bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-inner inline-flex flex-col items-center space-y-3">
              <img
                src={`${backendUrl}/static/qrcodes/${selectedBatch.qr_token}.png`}
                alt="QR Code"
                className="w-48 h-48 rounded-xl border border-slate-100 dark:border-slate-800"
              />
              <span className="font-mono font-bold text-brand-600 dark:text-brand-400 text-sm">
                TOKEN: {selectedBatch.qr_token}
              </span>
            </div>

            <div className="w-full bg-slate-50 dark:bg-slate-800/50 p-4 rounded-2xl border border-slate-200/60 dark:border-slate-800 text-left space-y-2">
              <div className="flex justify-between items-center text-slate-700 dark:text-slate-300">
                <span className="font-bold text-slate-900 dark:text-white">{selectedBatch.product?.product_name}</span>
                <span className="font-mono font-semibold text-slate-500">{selectedBatch.batch_number}</span>
              </div>
              <div className="text-slate-500 dark:text-slate-400 flex items-center justify-between">
                <span>MFG: {formatDate(selectedBatch.manufacturing_date)} | EXP: {formatDate(selectedBatch.expiry_date)}</span>
                <a
                  href={`${frontendOrigin}/verify/${selectedBatch.qr_token}`}
                  target="_blank"
                  rel="noreferrer"
                  className="text-brand-600 dark:text-brand-400 hover:underline flex items-center gap-1 font-semibold"
                >
                  <span>Open Verification Page</span>
                  <ExternalLink size={12} />
                </a>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800 w-full">
              <button
                onClick={() => handleCopyLink(selectedBatch.qr_token!)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl hover:bg-slate-200 transition-colors"
              >
                <Copy size={14} />
                <span>Copy Link</span>
              </button>

              <a
                href={`${backendUrl}/api/v1/batches/qr-codes/download/${selectedBatch.qr_token}`}
                target="_blank"
                rel="noreferrer"
                className="flex items-center gap-1.5 px-3.5 py-2 bg-sky-600 hover:bg-sky-500 text-white font-semibold rounded-xl transition-all shadow-sm"
              >
                <Download size={14} />
                <span>Download PNG</span>
              </a>

              <button
                onClick={() => handlePrintQR(selectedBatch)}
                className="flex items-center gap-1.5 px-4 py-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold rounded-xl transition-all shadow-md shadow-brand-600/20"
              >
                <Printer size={14} />
                <span>Print QR / PDF</span>
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Confirmation Dialog for Regenerate */}
      <ConfirmationDialog
        isOpen={!!regenerateTarget}
        onClose={() => setRegenerateTarget(null)}
        onConfirm={() => {
          if (regenerateTarget) {
            generateMutation.mutate({ id: regenerateTarget.id, force: true });
          }
        }}
        title="Regenerate Batch QR Code"
        message={`Are you sure you want to regenerate the QR code for batch "${regenerateTarget?.batch_number}"? The previous QR token will become invalid.`}
        confirmLabel="Regenerate QR"
        isLoading={generateMutation.isPending}
      />
    </div>
  );
};
