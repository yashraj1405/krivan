import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../services/api';
import type { Dispatch as IDispatch, DispatchListResponse, BatchListResponse, DealerListResponse } from '../interfaces';
import { DataTable, type Column } from '../components/ui/DataTable';
import { SearchBar } from '../components/ui/SearchBar';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { formatDate } from '../lib/utils';
import { Plus, Truck, Package, Building, Eye, Trash2, Calendar, FileText, AlertCircle } from 'lucide-react';

export const DispatchPage: React.FC = () => {
  const queryClient = useQueryClient();

  const [search, setSearch] = useState('');
  const [batchFilter] = useState('');
  const [dealerFilter] = useState('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modals
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedDispatch, setSelectedDispatch] = useState<IDispatch | null>(null);
  const [deleteDispatchTarget, setDeleteDispatchTarget] = useState<IDispatch | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    batch_id: '',
    dealer_id: '',
    quantity: '',
    invoice_number: '',
    transport_name: '',
    vehicle_number: '',
    lr_number: '',
    remarks: '',
  });
  const [formError, setFormError] = useState<string | null>(null);

  // Query Dispatches
  const { data, isLoading } = useQuery<DispatchListResponse>({
    queryKey: ['dispatches', page, pageSize, search, batchFilter, dealerFilter, sortBy, sortOrder],
    queryFn: async () => {
      const skip = (page - 1) * pageSize;
      const params: Record<string, any> = { skip, limit: pageSize, sort_by: sortBy, sort_order: sortOrder };
      if (search) params.search = search;
      if (batchFilter) params.batch_id = batchFilter;
      if (dealerFilter) params.dealer_id = dealerFilter;

      const res = await api.get<DispatchListResponse>('/dispatches/', { params });
      return res.data;
    },
  });

  // Query Batches for Dropdown & Remaining Quantity check
  const { data: batchesData } = useQuery<BatchListResponse>({
    queryKey: ['batches-all'],
    queryFn: async () => {
      const res = await api.get<BatchListResponse>('/batches/', { params: { limit: 200 } });
      return res.data;
    },
  });

  // Query Dealers for Dropdown
  const { data: dealersData } = useQuery<DealerListResponse>({
    queryKey: ['dealers-all'],
    queryFn: async () => {
      const res = await api.get<DealerListResponse>('/dealers/', { params: { limit: 200, status: 'Active' } });
      return res.data;
    },
  });

  // Target Batch for remaining inventory calculation
  const selectedBatchObj = batchesData?.items.find((b) => b.id === formData.batch_id);
  const availableQuantity = selectedBatchObj?.remaining_quantity ?? selectedBatchObj?.quantity ?? 0;

  // Create Dispatch Mutation
  const createMutation = useMutation({
    mutationFn: async () => {
      setFormError(null);
      const qtyNum = parseInt(formData.quantity, 10);
      if (isNaN(qtyNum) || qtyNum <= 0) {
        throw new Error('Please enter a valid positive quantity');
      }
      if (qtyNum > availableQuantity) {
        throw new Error(`Quantity (${qtyNum}) exceeds available remaining inventory (${availableQuantity})`);
      }

      const payload = {
        batch_id: formData.batch_id,
        dealer_id: formData.dealer_id,
        quantity: qtyNum,
        invoice_number: formData.invoice_number,
        transport_name: formData.transport_name,
        vehicle_number: formData.vehicle_number,
        lr_number: formData.lr_number || undefined,
        remarks: formData.remarks || undefined,
      };

      await api.post('/dispatches/', payload);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['batches-all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setIsFormModalOpen(false);
      resetForm();
    },
    onError: (err: any) => {
      const msg = err.response?.data?.detail || err.message || 'Failed to create dispatch record';
      setFormError(typeof msg === 'string' ? msg : JSON.stringify(msg));
    },
  });

  // Delete Dispatch Mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      await api.delete(`/dispatches/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['dispatches'] });
      queryClient.invalidateQueries({ queryKey: ['batches'] });
      queryClient.invalidateQueries({ queryKey: ['batches-all'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      setDeleteDispatchTarget(null);
    },
  });

  const resetForm = () => {
    setFormData({
      batch_id: '',
      dealer_id: '',
      quantity: '',
      invoice_number: '',
      transport_name: '',
      vehicle_number: '',
      lr_number: '',
      remarks: '',
    });
    setFormError(null);
  };

  const handleOpenAddModal = () => {
    resetForm();
    setIsFormModalOpen(true);
  };

  const handleSortChange = (field: string) => {
    if (sortBy === field) {
      setSortOrder((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortBy(field);
      setSortOrder('desc');
    }
  };

  const columns: Column<IDispatch>[] = [
    {
      key: 'dispatch_number',
      header: 'Dispatch #',
      sortable: true,
      render: (item) => (
        <span className="font-mono text-xs font-bold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2.5 py-1 rounded-lg border border-blue-200/50 dark:border-blue-800/50">
          {item.dispatch_number}
        </span>
      ),
    },
    {
      key: 'batch',
      header: 'Batch & Product',
      render: (item) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl shrink-0">
            <Package size={16} />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block">
              {item.batch?.batch_number || 'N/A'}
            </span>
            <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
              {item.batch?.product?.product_name || 'N/A'}
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'dealer',
      header: 'Dispatched To Dealer',
      render: (item) => (
        <div className="flex items-center space-x-2">
          <Building size={14} className="text-purple-500 shrink-0" />
          <div>
            <span className="font-bold text-slate-800 dark:text-slate-200 block text-xs">
              {item.dealer?.dealer_name || 'N/A'}
            </span>
            <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block">
              {item.dealer?.dealer_code} ({item.dealer?.city})
            </span>
          </div>
        </div>
      ),
    },
    {
      key: 'quantity',
      header: 'Quantity',
      sortable: true,
      render: (item) => (
        <div className="font-black text-slate-900 dark:text-slate-100 text-sm">
          {item.quantity.toLocaleString()} <span className="text-xs font-normal text-slate-500">units</span>
        </div>
      ),
    },
    {
      key: 'invoice_number',
      header: 'Invoice & Logistics',
      render: (item) => (
        <div className="space-y-0.5 text-xs">
          <div className="flex items-center text-slate-800 dark:text-slate-200 font-semibold">
            <FileText size={12} className="mr-1 text-slate-400" />
            <span>Inv: {item.invoice_number}</span>
          </div>
          <div className="flex items-center text-slate-500 dark:text-slate-400 text-[11px]">
            <Truck size={12} className="mr-1 text-slate-400" />
            <span>{item.transport_name} ({item.vehicle_number})</span>
          </div>
        </div>
      ),
    },
    {
      key: 'dispatch_date',
      header: 'Dispatch Date',
      sortable: true,
      render: (item) => (
        <div className="flex items-center text-xs text-slate-600 dark:text-slate-400">
          <Calendar size={13} className="mr-1.5 text-slate-400 shrink-0" />
          <span>{formatDate(item.dispatch_date)}</span>
        </div>
      ),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => {
              setSelectedDispatch(item);
              setIsViewModalOpen(true);
            }}
            className="p-1.5 text-slate-400 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg transition-colors"
            title="View Details"
          >
            <Eye size={16} />
          </button>
          <button
            onClick={() => setDeleteDispatchTarget(item)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
            title="Cancel Dispatch"
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
            Batch Dispatch & Distribution
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Record batch shipments to authorized dealers with automated inventory deduction
          </p>
        </div>

        <button
          onClick={handleOpenAddModal}
          className="flex items-center space-x-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-blue-600/20 w-max"
        >
          <Plus size={16} />
          <span>Create New Dispatch</span>
        </button>
      </div>

      {/* Toolbar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Search by dispatch #, invoice #, vehicle #, or dealer name..."
        />
      </div>

      {/* Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={isLoading}
        emptyTitle="No dispatches found"
        emptyDescription="No batch dispatches match your search filters."
        sortBy={sortBy}
        sortOrder={sortOrder}
        onSortChange={handleSortChange}
        page={page}
        pageSize={pageSize}
        totalItems={data?.total || 0}
        onPageChange={(p) => setPage(p)}
        onPageSizeChange={(sz) => {
          setPageSize(sz);
          setPage(1);
        }}
      />

      {/* Create Form Modal */}
      <Modal
        isOpen={isFormModalOpen}
        onClose={() => setIsFormModalOpen(false)}
        title="Record Batch Shipment / Dispatch"
        subtitle="Specify batch, recipient dealer, and shipment quantity"
      >
        <form
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
          className="space-y-4 text-xs"
        >
          {formError && (
            <div className="p-3 bg-rose-50 dark:bg-rose-950/60 border border-rose-200 dark:border-rose-800/80 rounded-xl text-rose-700 dark:text-rose-300 text-xs font-medium flex items-start space-x-2">
              <AlertCircle size={16} className="shrink-0 mt-0.5" />
              <span>{formError}</span>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Batch <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.batch_id}
              onChange={(e) => setFormData({ ...formData, batch_id: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            >
              <option value="">-- Choose Manufacturing Batch --</option>
              {batchesData?.items.map((b) => (
                <option key={b.id} value={b.id}>
                  Batch #{b.batch_number} ({b.product?.product_name || 'N/A'}) — Avail: {b.remaining_quantity ?? b.quantity} / {b.quantity} units
                </option>
              ))}
            </select>
          </div>

          {selectedBatchObj && (
            <div className="p-3 bg-blue-50 dark:bg-blue-950/40 rounded-xl border border-blue-200/60 dark:border-blue-800/60 flex items-center justify-between text-xs">
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Selected Batch Stock:</span>
                <span className="font-bold text-slate-900 dark:text-slate-100">
                  Total Produced: {selectedBatchObj.quantity.toLocaleString()} units
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Available Remaining:</span>
                <span className="font-black text-emerald-600 dark:text-emerald-400 text-sm">
                  {availableQuantity.toLocaleString()} units
                </span>
              </div>
            </div>
          )}

          <div>
            <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
              Select Recipient Dealer <span className="text-rose-500">*</span>
            </label>
            <select
              required
              value={formData.dealer_id}
              onChange={(e) => setFormData({ ...formData, dealer_id: e.target.value })}
              className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2.5 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none font-medium"
            >
              <option value="">-- Choose Authorized Dealer --</option>
              {dealersData?.items.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.dealer_name} ({d.dealer_code}) — {d.city}, {d.state}
                </option>
              ))}
            </select>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Dispatch Quantity <span className="text-rose-500">*</span>
              </label>
              <input
                type="number"
                required
                min={1}
                max={availableQuantity > 0 ? availableQuantity : undefined}
                value={formData.quantity}
                onChange={(e) => setFormData({ ...formData, quantity: e.target.value })}
                placeholder={`Max ${availableQuantity}`}
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none font-bold"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Tax Invoice Number <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.invoice_number}
                onChange={(e) => setFormData({ ...formData, invoice_number: e.target.value })}
                placeholder="e.g. INV-2026-001"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Transport Carrier Name <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.transport_name}
                onChange={(e) => setFormData({ ...formData, transport_name: e.target.value })}
                placeholder="e.g. Blue Dart / VRL Logistics"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Vehicle Registration # <span className="text-rose-500">*</span>
              </label>
              <input
                type="text"
                required
                value={formData.vehicle_number}
                onChange={(e) => setFormData({ ...formData, vehicle_number: e.target.value.toUpperCase() })}
                placeholder="e.g. MH-12-AB-1234"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                LR / Waybill Number <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.lr_number}
                onChange={(e) => setFormData({ ...formData, lr_number: e.target.value })}
                placeholder="e.g. LR-789012"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>

            <div>
              <label className="block font-semibold text-slate-700 dark:text-slate-300 mb-1">
                Logistics Remarks <span className="text-slate-400 font-normal">(Optional)</span>
              </label>
              <input
                type="text"
                value={formData.remarks}
                onChange={(e) => setFormData({ ...formData, remarks: e.target.value })}
                placeholder="e.g. Handle with care / Fragile liquid"
                className="w-full bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-3 py-2 text-slate-900 dark:text-slate-100 focus:ring-2 focus:ring-blue-500 outline-none"
              />
            </div>
          </div>

          <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={() => setIsFormModalOpen(false)}
              className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={createMutation.isPending}
              className="px-5 py-2 bg-blue-600 hover:bg-blue-500 text-white font-semibold rounded-xl shadow-md shadow-blue-600/20"
            >
              {createMutation.isPending ? 'Processing...' : 'Confirm Dispatch'}
            </button>
          </div>
        </form>
      </Modal>

      {/* View Modal */}
      <Modal
        isOpen={isViewModalOpen}
        onClose={() => setIsViewModalOpen(false)}
        title="Dispatch Details"
        subtitle="Logistics & Dealer Fulfillment Metadata"
      >
        {selectedDispatch && (
          <div className="space-y-4 text-xs">
            <div className="flex items-center justify-between p-4 bg-slate-50 dark:bg-slate-800/50 rounded-2xl border border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Dispatch Reference</span>
                <span className="font-mono font-bold text-blue-600 dark:text-blue-400 text-base">
                  {selectedDispatch.dispatch_number}
                </span>
                <span className="text-slate-500 block text-xs mt-0.5">
                  Date: {formatDate(selectedDispatch.dispatch_date)}
                </span>
              </div>
              <div className="text-right">
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Quantity Dispatched</span>
                <span className="font-black text-slate-900 dark:text-slate-100 text-lg">
                  {selectedDispatch.quantity.toLocaleString()} units
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Manufacturing Batch</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedDispatch.batch?.batch_number || 'N/A'}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  {selectedDispatch.batch?.product?.product_name || 'N/A'}
                </span>
              </div>

              <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-1">
                <span className="text-slate-400 block font-bold text-[10px] uppercase">Recipient Dealer</span>
                <span className="font-bold text-slate-800 dark:text-slate-200">
                  {selectedDispatch.dealer?.dealer_name || 'N/A'}
                </span>
                <span className="text-slate-500 block text-[11px]">
                  {selectedDispatch.dealer?.city}, {selectedDispatch.dealer?.state}
                </span>
              </div>
            </div>

            <div className="p-3 bg-slate-50 dark:bg-slate-800/50 rounded-xl border border-slate-100 dark:border-slate-800 space-y-2">
              <span className="text-slate-400 block font-bold text-[10px] uppercase">Logistics & Invoice</span>
              <div className="grid grid-cols-2 gap-2 text-slate-700 dark:text-slate-300">
                <div>
                  <span className="text-slate-400 block text-[11px]">Tax Invoice:</span>
                  <span className="font-mono font-semibold">{selectedDispatch.invoice_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Transport:</span>
                  <span className="font-semibold">{selectedDispatch.transport_name}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">Vehicle Number:</span>
                  <span className="font-mono font-semibold">{selectedDispatch.vehicle_number}</span>
                </div>
                <div>
                  <span className="text-slate-400 block text-[11px]">LR Number:</span>
                  <span className="font-mono font-semibold">{selectedDispatch.lr_number || 'N/A'}</span>
                </div>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                onClick={() => setIsViewModalOpen(false)}
                className="px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 font-semibold rounded-xl"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Dialog */}
      <ConfirmationDialog
        isOpen={!!deleteDispatchTarget}
        onClose={() => setDeleteDispatchTarget(null)}
        onConfirm={() => {
          if (deleteDispatchTarget) {
            deleteMutation.mutate(deleteDispatchTarget.id);
          }
        }}
        title="Cancel Dispatch Record"
        message={`Are you sure you want to cancel dispatch "${deleteDispatchTarget?.dispatch_number}"?`}
        confirmLabel="Cancel Dispatch"
        variant="danger"
      />
    </div>
  );
};

export const Dispatch = DispatchPage;
