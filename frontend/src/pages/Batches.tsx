import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import type { Batch, BatchListResponse, BatchStatus } from '../interfaces';
import type { ProductListResponse } from '../interfaces';
import { DataTable, type Column } from '../components/ui/DataTable';
import { SearchBar } from '../components/ui/SearchBar';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/utils';
import {
  Layers, Plus, Edit3, Trash2, Eye, Save, X, Loader2,
  Calendar, Package, Hash, QrCode, FileText, ClipboardList, IndianRupee, Tag,
  History, Truck, CheckCircle2, QrCode as QrIcon, ArrowRight
} from 'lucide-react';

const BATCH_STATUS_OPTIONS: BatchStatus[] = [
  'Draft',
  'Production',
  'QR Generated',
  'Printed',
  'Packed',
  'Dispatched',
  'Completed',
];

const statusVariantMap: Record<BatchStatus, 'neutral' | 'info' | 'warning' | 'success' | 'danger'> = {
  Draft: 'neutral',
  Production: 'info',
  'QR Generated': 'info',
  Printed: 'warning',
  Packed: 'warning',
  Dispatched: 'warning',
  Completed: 'success',
};

/* ────────────────────────────────────────────
   Zod validation schema
   ──────────────────────────────────────────── */
const batchSchema = z.object({
  product_id: z.string().min(1, 'Product selection is required'),
  batch_number: z.string().min(1, 'Batch number is required').max(100),
  manufacturing_date: z.string().min(1, 'Manufacturing date is required'),
  expiry_date: z.string().min(1, 'Expiry date is required'),
  quantity: z.coerce.number().int().min(1, 'Quantity must be greater than 0'),
  net_content: z.string().max(100).optional().or(z.literal('')),
  mrp: z.coerce.number().min(0, 'MRP cannot be negative').optional().or(z.nan()),
  status: z.enum(['Draft', 'Production', 'QR Generated', 'Printed', 'Packed', 'Dispatched', 'Completed'] as const).default('Draft'),
  remarks: z.string().optional().or(z.literal('')),
}).refine(
  (data) => {
    if (data.manufacturing_date && data.expiry_date) {
      return new Date(data.expiry_date) > new Date(data.manufacturing_date);
    }
    return true;
  },
  { message: 'Expiry date must be after manufacturing date', path: ['expiry_date'] }
);

type BatchFormData = z.infer<typeof batchSchema>;

const FormField: React.FC<{
  label: string;
  htmlFor: string;
  error?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, htmlFor, error, required, children }) => (
  <div className="space-y-1.5">
    <label htmlFor={htmlFor} className="block text-[11px] font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
      {label}
      {required && <span className="text-rose-500 ml-0.5">*</span>}
    </label>
    {children}
    {error && <p className="text-[11px] text-rose-500 font-medium mt-1">{error}</p>}
  </div>
);

const inputBaseClass =
  'w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all';

const textareaBaseClass =
  'w-full bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 text-sm text-slate-900 dark:text-slate-100 rounded-xl px-3.5 py-2.5 placeholder:text-slate-400 dark:placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500 transition-all resize-none';

/* ────────────────────────────────────────────
   View Batch Detail Modal
   ──────────────────────────────────────────── */
const BatchDetailView: React.FC<{ batch: Batch; onClose: () => void; onEdit: () => void }> = ({
  batch,
  onClose,
  onEdit,
}) => {
  const detailRow = (label: string, value: string | number | undefined | null, icon?: React.ReactNode) => (
    <div className="flex items-start gap-3 py-2.5">
      {icon && <div className="shrink-0 mt-0.5 text-slate-400 dark:text-slate-500">{icon}</div>}
      <div className="flex-1 min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
        <span className="block text-sm text-slate-800 dark:text-slate-200 mt-0.5">{value ?? '—'}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6">
        <div className="space-y-0.5">
          {detailRow('Batch Number', batch.batch_number, <Hash size={14} />)}
          {detailRow('Product', batch.product?.product_name, <Package size={14} />)}
          {detailRow('Product Code', batch.product?.product_code, <Layers size={14} />)}
          {detailRow('Category', batch.product?.category, <FileText size={14} />)}
          {detailRow('Net Content', batch.net_content, <Tag size={14} />)}
        </div>
        <div className="space-y-0.5">
          {detailRow('Manufacturing Date', formatDate(batch.manufacturing_date), <Calendar size={14} />)}
          {detailRow('Expiry Date', formatDate(batch.expiry_date), <Calendar size={14} />)}
          {detailRow('Produced Quantity', `${batch.quantity.toLocaleString()} Units`, <ClipboardList size={14} />)}
          {detailRow('Dispatched Quantity', `${(batch.dispatched_quantity || 0).toLocaleString()} Units`, <Truck size={14} />)}
          {detailRow('Remaining Inventory', `${(batch.remaining_quantity ?? batch.quantity).toLocaleString()} Units`, <Package size={14} />)}
          {detailRow('MRP', batch.mrp ? `₹${batch.mrp.toLocaleString('en-IN')}` : '—', <IndianRupee size={14} />)}
          {detailRow('QR Token', batch.qr_token || 'Not Generated', <QrCode size={14} />)}
        </div>
      </div>

      {batch.remarks && (
        <div className="p-3 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800 text-xs">
          <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1">Remarks</span>
          <p className="text-slate-700 dark:text-slate-300">{batch.remarks}</p>
        </div>
      )}

      <div className="flex items-center justify-between pt-3 border-t border-slate-100 dark:border-slate-800">
        <div className="flex items-center gap-2">
          <Badge variant={statusVariantMap[batch.status] || 'neutral'} dot>{batch.status}</Badge>
          <span className="text-[11px] text-slate-400">Created {formatDate(batch.created_at)}</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors"
          >
            Close
          </button>
          <button
            onClick={onEdit}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-600/20 transition-all"
          >
            <Edit3 size={14} />
            Edit Batch
          </button>
        </div>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────
   Batch History Timeline Modal
   ──────────────────────────────────────────── */
const BatchHistoryModal: React.FC<{ batchId: string | null; onClose: () => void }> = ({ batchId, onClose }) => {
  const { data: history, isLoading } = useQuery({
    queryKey: ['batch-history', batchId],
    queryFn: async () => {
      if (!batchId) return null;
      const res = await api.get(`/batches/${batchId}/history`);
      return res.data;
    },
    enabled: !!batchId,
  });

  if (!batchId) return null;

  return (
    <Modal isOpen={!!batchId} onClose={onClose} title="Batch Lifecycle Timeline" subtitle="Manufactured → QR Generated → Dispatched → Customer Scans">
      {isLoading ? (
        <div className="p-8 text-center text-slate-400 flex flex-col items-center justify-center space-y-2">
          <Loader2 size={24} className="animate-spin text-brand-500" />
          <span className="text-xs">Loading batch timeline...</span>
        </div>
      ) : history ? (
        <div className="space-y-6 text-xs">
          {/* Header Summary Card */}
          <div className="p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Batch Number</span>
              <span className="font-mono font-bold text-slate-900 dark:text-slate-100">{history.batch_number}</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Total Produced</span>
              <span className="font-bold text-slate-900 dark:text-slate-100">{history.total_quantity.toLocaleString()} units</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Total Dispatched</span>
              <span className="font-bold text-blue-600 dark:text-blue-400">{history.dispatched_quantity.toLocaleString()} units</span>
            </div>
            <div>
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Remaining Stock</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{history.remaining_quantity.toLocaleString()} units</span>
            </div>
          </div>

          {/* Timeline */}
          <div className="relative pl-6 space-y-6 before:absolute before:left-2.5 before:top-2 before:bottom-2 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800">
            {/* Step 1: Manufacturing */}
            <div className="relative flex items-start space-x-3">
              <div className="absolute -left-6 top-0 p-1 bg-emerald-500 text-white rounded-full ring-4 ring-white dark:ring-slate-900">
                <CheckCircle2 size={12} />
              </div>
              <div className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">1. Manufacturing Completed</span>
                  <span className="text-[11px] text-slate-400">{formatDate(history.manufacturing_date)}</span>
                </div>
                <p className="text-slate-500 mt-1">Batch #{history.batch_number} produced with {history.total_quantity.toLocaleString()} units.</p>
              </div>
            </div>

            {/* Step 2: QR Code Generation */}
            <div className="relative flex items-start space-x-3">
              <div className={`absolute -left-6 top-0 p-1 rounded-full ring-4 ring-white dark:ring-slate-900 ${history.qr_generated_at ? 'bg-brand-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                <QrIcon size={12} />
              </div>
              <div className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">2. Single QR Code Generated</span>
                  <span className="text-[11px] text-slate-400">{history.qr_generated_at ? formatDate(history.qr_generated_at) : 'Pending'}</span>
                </div>
                <p className="text-slate-500 mt-1">
                  {history.qr_generated_at ? 'Unique QR Token assigned to this batch.' : 'QR Code generation pending.'}
                </p>
              </div>
            </div>

            {/* Step 3: Dealer Dispatches */}
            <div className="relative flex items-start space-x-3">
              <div className={`absolute -left-6 top-0 p-1 rounded-full ring-4 ring-white dark:ring-slate-900 ${history.dispatches.length > 0 ? 'bg-blue-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                <Truck size={12} />
              </div>
              <div className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">3. Dealer Dispatches ({history.dispatches.length})</span>
                </div>
                {history.dispatches.length === 0 ? (
                  <p className="text-slate-400">No dispatches recorded yet for this batch.</p>
                ) : (
                  <div className="space-y-2">
                    {history.dispatches.map((d: any, idx: number) => (
                      <div key={idx} className="p-2.5 bg-slate-50 dark:bg-slate-800/60 rounded-lg flex items-center justify-between text-xs">
                        <div>
                          <span className="font-bold text-slate-800 dark:text-slate-200 block">{d.dealer_name} ({d.dealer_code})</span>
                          <span className="text-[11px] text-slate-500 block">Inv: {d.invoice_number} | {d.transport_name} ({d.vehicle_number})</span>
                        </div>
                        <div className="text-right">
                          <span className="font-black text-blue-600 dark:text-blue-400 block">{d.quantity.toLocaleString()} units</span>
                          <span className="text-[10px] text-slate-400">{formatDate(d.dispatch_date)}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* Step 4: Customer Scans */}
            <div className="relative flex items-start space-x-3">
              <div className={`absolute -left-6 top-0 p-1 rounded-full ring-4 ring-white dark:ring-slate-900 ${history.scans.length > 0 ? 'bg-purple-500 text-white' : 'bg-slate-300 text-slate-600'}`}>
                <Eye size={12} />
              </div>
              <div className="flex-1 bg-white dark:bg-slate-900 p-3 rounded-xl border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-center justify-between">
                  <span className="font-bold text-slate-900 dark:text-slate-100">4. Customer Verification Scans</span>
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">{history.scans.length} Scans</span>
                </div>
                <p className="text-slate-500 mt-1">Total public verification scans recorded for this batch.</p>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-slate-100 dark:border-slate-800">
            <button onClick={onClose} className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl">
              Close History
            </button>
          </div>
        </div>
      ) : null}
    </Modal>
  );
};

/* ────────────────────────────────────────────
   Batch Form (Create / Edit)
   ──────────────────────────────────────────── */
const BatchForm: React.FC<{
  batch: Batch | null;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ batch, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!batch;

  const { data: productsData } = useQuery<ProductListResponse>({
    queryKey: ['products-dropdown'],
    queryFn: async () => {
      const res = await api.get<ProductListResponse>('/products/', { params: { limit: 100, sort_by: 'product_name', sort_order: 'asc' } });
      return res.data;
    },
  });

  const products = productsData?.items || [];

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<BatchFormData>({
    resolver: zodResolver(batchSchema),
    defaultValues: {
      product_id: '',
      batch_number: '',
      manufacturing_date: '',
      expiry_date: '',
      quantity: 0,
      net_content: '',
      mrp: undefined,
      status: 'Draft',
      remarks: '',
    },
  });

  useEffect(() => {
    if (batch) {
      reset({
        product_id: batch.product_id || '',
        batch_number: batch.batch_number || '',
        manufacturing_date: batch.manufacturing_date ? batch.manufacturing_date.split('T')[0] : '',
        expiry_date: batch.expiry_date ? batch.expiry_date.split('T')[0] : '',
        quantity: batch.quantity || 0,
        net_content: batch.net_content || '',
        mrp: batch.mrp ?? undefined,
        status: batch.status || 'Draft',
        remarks: batch.remarks || '',
      });
    }
  }, [batch, reset]);

  const createMutation = useMutation({
    mutationFn: (data: Record<string, any>) => api.post('/batches/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ variant: 'success', title: 'Batch Created', message: 'New production batch has been registered.' });
      onSuccess();
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || 'Failed to create batch.';
      toast({ variant: 'error', title: 'Creation Failed', message: typeof detail === 'string' ? detail : JSON.stringify(detail) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: Record<string, any>) => api.put(`/batches/${batch!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ variant: 'success', title: 'Batch Updated', message: 'Batch details have been saved successfully.' });
      onSuccess();
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || 'Failed to update batch.';
      toast({ variant: 'error', title: 'Update Failed', message: typeof detail === 'string' ? detail : JSON.stringify(detail) });
    },
  });

  const onSubmit = (data: BatchFormData) => {
    const payload: Record<string, any> = {
      product_id: data.product_id,
      batch_number: data.batch_number,
      manufacturing_date: new Date(data.manufacturing_date).toISOString(),
      expiry_date: new Date(data.expiry_date).toISOString(),
      quantity: Number(data.quantity),
      net_content: data.net_content || null,
      mrp: data.mrp && !isNaN(data.mrp) ? Number(data.mrp) : null,
      status: data.status,
      remarks: data.remarks || null,
    };

    if (isEditing) {
      updateMutation.mutate(payload);
    } else {
      createMutation.mutate(payload);
    }
  };

  const busy = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      <FormField label="Select Product" htmlFor="product_id" error={errors.product_id?.message} required>
        <select id="product_id" {...register('product_id')} className={inputBaseClass} disabled={busy}>
          <option value="">Choose a product...</option>
          {products.map((p) => (
            <option key={p.id} value={p.id}>
              {p.product_code} — {p.product_name}
            </option>
          ))}
        </select>
      </FormField>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Batch Number" htmlFor="batch_number" error={errors.batch_number?.message} required>
          <input id="batch_number" {...register('batch_number')} placeholder="e.g. BATCH-2026-001" className={inputBaseClass} disabled={busy} />
        </FormField>

        <FormField label="Quantity Produced" htmlFor="quantity" error={errors.quantity?.message} required>
          <input id="quantity" type="number" {...register('quantity')} placeholder="e.g. 5000" min={1} className={inputBaseClass} disabled={busy} />
        </FormField>

        <FormField label="Manufacturing Date" htmlFor="manufacturing_date" error={errors.manufacturing_date?.message} required>
          <input id="manufacturing_date" type="date" {...register('manufacturing_date')} className={inputBaseClass} disabled={busy} />
        </FormField>

        <FormField label="Expiry Date" htmlFor="expiry_date" error={errors.expiry_date?.message} required>
          <input id="expiry_date" type="date" {...register('expiry_date')} className={inputBaseClass} disabled={busy} />
        </FormField>

        <FormField label="Net Content" htmlFor="net_content" error={errors.net_content?.message}>
          <input id="net_content" {...register('net_content')} placeholder="e.g. 50 kg / 1 L" className={inputBaseClass} disabled={busy} />
        </FormField>

        <FormField label="MRP (₹)" htmlFor="mrp" error={errors.mrp?.message}>
          <input id="mrp" type="number" step="0.01" {...register('mrp')} placeholder="e.g. 1499.00" className={inputBaseClass} disabled={busy} />
        </FormField>
      </div>

      <FormField label="Batch Status" htmlFor="status" error={errors.status?.message} required>
        <select id="status" {...register('status')} className={inputBaseClass} disabled={busy}>
          {BATCH_STATUS_OPTIONS.map((st) => (
            <option key={st} value={st}>{st}</option>
          ))}
        </select>
      </FormField>

      <FormField label="Remarks" htmlFor="remarks" error={errors.remarks?.message}>
        <textarea id="remarks" {...register('remarks')} placeholder="Additional batch notes..." rows={3} className={textareaBaseClass} disabled={busy} />
      </FormField>

      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button type="button" onClick={onCancel} disabled={busy} className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors">
          <X size={14} /> Cancel
        </button>
        <button type="submit" disabled={busy} className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-600/20 transition-all">
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isEditing ? 'Update Batch' : 'Save Batch'}
        </button>
      </div>
    </form>
  );
};

/* ────────────────────────────────────────────
   Batches Page Component
   ──────────────────────────────────────────── */
export const Batches: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [productFilter, setProductFilter] = useState<string>('');
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  const [modalMode, setModalMode] = useState<'closed' | 'create' | 'edit' | 'view'>('closed');
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [historyBatchId, setHistoryBatchId] = useState<string | null>(null);
  const [deleteBatchTarget, setDeleteBatchTarget] = useState<Batch | null>(null);

  const { data: productsForFilter } = useQuery<ProductListResponse>({
    queryKey: ['products-filter-list'],
    queryFn: async () => {
      const res = await api.get<ProductListResponse>('/products/', { params: { limit: 100, sort_by: 'product_name', sort_order: 'asc' } });
      return res.data;
    },
  });

  const { data, isLoading } = useQuery<BatchListResponse>({
    queryKey: ['batches', page, pageSize, search, productFilter, statusFilter, sortBy, sortOrder],
    queryFn: async () => {
      const skip = (page - 1) * pageSize;
      const params: Record<string, any> = { skip, limit: pageSize, sort_by: sortBy, sort_order: sortOrder };
      if (search) params.search = search;
      if (productFilter) params.product_id = productFilter;
      if (statusFilter) params.status = statusFilter;
      const res = await api.get<BatchListResponse>('/batches/', { params });
      return res.data;
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/batches/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ variant: 'success', title: 'Batch Deleted', message: 'The batch has been permanently removed.' });
      setDeleteBatchTarget(null);
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || 'Failed to delete batch.';
      toast({ variant: 'error', title: 'Delete Failed', message: typeof detail === 'string' ? detail : JSON.stringify(detail) });
      setDeleteBatchTarget(null);
    },
  });

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const openCreate = () => { setSelectedBatch(null); setModalMode('create'); };
  const openEdit = (batch: Batch) => { setSelectedBatch(batch); setModalMode('edit'); };
  const openView = (batch: Batch) => { setSelectedBatch(batch); setModalMode('view'); };
  const closeModal = () => { setModalMode('closed'); setSelectedBatch(null); };

  const columns: Column<Batch>[] = [
    {
      key: 'batch_number',
      header: 'Batch Number',
      sortable: true,
      render: (item) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-sky-50 dark:bg-sky-950/60 text-sky-600 dark:text-sky-400 rounded-xl shrink-0">
            <Layers size={16} />
          </div>
          <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
            {item.batch_number}
          </span>
        </div>
      ),
    },
    {
      key: 'product',
      header: 'Product Name',
      render: (item) => (
        <div>
          <span className="font-semibold text-slate-900 dark:text-slate-100 block">
            {item.product?.product_name || '—'}
          </span>
          {item.product?.product_code && (
            <span className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              {item.product.product_code}
            </span>
          )}
        </div>
      ),
    },
    {
      key: 'inventory',
      header: 'Stock Inventory',
      render: (item) => (
        <div className="space-y-0.5 text-xs">
          <div className="font-bold text-slate-800 dark:text-slate-200">
            Total: {item.quantity.toLocaleString()}
          </div>
          <div className="flex items-center space-x-2 text-[11px]">
            <span className="text-blue-600 dark:text-blue-400 font-semibold">Disp: {(item.dispatched_quantity || 0).toLocaleString()}</span>
            <span className="text-slate-300">|</span>
            <span className="text-emerald-600 dark:text-emerald-400 font-bold">Rem: {(item.remaining_quantity ?? item.quantity).toLocaleString()}</span>
          </div>
        </div>
      ),
    },
    {
      key: 'dates',
      header: 'MFG / EXP Date',
      render: (item) => (
        <div className="text-xs space-y-0.5 text-slate-600 dark:text-slate-400">
          <div>MFG: {formatDate(item.manufacturing_date)}</div>
          <div className="text-[11px] text-slate-400">EXP: {formatDate(item.expiry_date)}</div>
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      sortable: true,
      render: (item) => (
        <Badge variant={statusVariantMap[item.status] || 'neutral'} dot>
          {item.status}
        </Badge>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setHistoryBatchId(item.id)}
            className="p-1.5 text-slate-400 hover:text-purple-600 dark:hover:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-950/50 rounded-lg transition-colors"
            title="View History Timeline"
          >
            <History size={16} />
          </button>
          <button
            onClick={() => openView(item)}
            className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => openEdit(item)}
            className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="Edit"
          >
            <Edit3 size={16} />
          </button>
          <button
            onClick={() => setDeleteBatchTarget(item)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Production Batches
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage manufacturing batch records, QR generation status, and dealer dispatch inventory
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20 w-max"
        >
          <Plus size={16} />
          <span>New Production Batch</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <SearchBar
          value={search}
          onChange={(val) => { setSearch(val); setPage(1); }}
          placeholder="Search by batch number or product name..."
        />

        <div className="flex items-center space-x-3">
          <select
            value={productFilter}
            onChange={(e) => { setProductFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none"
          >
            <option value="">All Products</option>
            {productsForFilter?.items.map((p) => (
              <option key={p.id} value={p.id}>{p.product_name}</option>
            ))}
          </select>

          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 text-xs rounded-xl px-3 py-2 font-medium focus:outline-none"
          >
            <option value="">All Statuses</option>
            {BATCH_STATUS_OPTIONS.map((st) => (
              <option key={st} value={st}>{st}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={isLoading}
        emptyTitle="No batches found"
        emptyDescription="No production batches match your search query."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        page={page}
        pageSize={pageSize}
        totalItems={data?.total || 0}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(sz) => { setPageSize(sz); setPage(1); }}
      />

      {/* Form Modal */}
      <Modal
        isOpen={modalMode === 'create' || modalMode === 'edit'}
        onClose={closeModal}
        title={modalMode === 'edit' ? 'Edit Production Batch' : 'New Production Batch'}
        subtitle={modalMode === 'edit' ? `Updating batch ${selectedBatch?.batch_number}` : 'Register a new manufacturing batch'}
      >
        <BatchForm batch={selectedBatch} onSuccess={closeModal} onCancel={closeModal} />
      </Modal>

      {/* View Detail Modal */}
      <Modal
        isOpen={modalMode === 'view'}
        onClose={closeModal}
        title="Batch Details"
        subtitle={`Viewing ${selectedBatch?.batch_number}`}
      >
        {selectedBatch && (
          <BatchDetailView
            batch={selectedBatch}
            onClose={closeModal}
            onEdit={() => setModalMode('edit')}
          />
        )}
      </Modal>

      {/* History Timeline Modal */}
      <BatchHistoryModal batchId={historyBatchId} onClose={() => setHistoryBatchId(null)} />

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteBatchTarget}
        onClose={() => setDeleteBatchTarget(null)}
        onConfirm={() => deleteBatchTarget && deleteMutation.mutate(deleteBatchTarget.id)}
        title="Delete Batch"
        message={`Are you sure you want to delete batch "${deleteBatchTarget?.batch_number}"?`}
        confirmLabel="Delete Batch"
        isDanger
      />
    </div>
  );
};
