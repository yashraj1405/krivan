import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import api from '../services/api';
import type { Product, ProductListResponse } from '../interfaces';
import { DataTable, type Column } from '../components/ui/DataTable';
import { SearchBar } from '../components/ui/SearchBar';
import { Badge } from '../components/ui/Badge';
import { Modal } from '../components/ui/Modal';
import { ConfirmationDialog } from '../components/ui/ConfirmationDialog';
import { useToast } from '../components/ui/Toast';
import { formatDate } from '../lib/utils';
import {
  Sprout, Plus, Edit3, Trash2, Tag, Eye, Save, X, Loader2,
  FileText, Beaker, Leaf, ShieldCheck, Info,
} from 'lucide-react';

/* ────────────────────────────────────────────
   Zod validation schema
   ──────────────────────────────────────────── */
const productSchema = z.object({
  product_code: z.string().min(1, 'Product code is required').max(100),
  product_name: z.string().min(1, 'Product name is required').max(255),
  category: z.string().min(1, 'Category is required').max(100),
  composition: z.string().max(500).optional().or(z.literal('')),
  description: z.string().optional().or(z.literal('')),
  dosage: z.string().max(255).optional().or(z.literal('')),
  benefits: z.string().optional().or(z.literal('')),
  recommended_crops: z.string().max(500).optional().or(z.literal('')),
  image_url: z.string().max(1024).optional().or(z.literal('')),
  is_active: z.boolean().default(true),
});

type ProductFormData = z.infer<typeof productSchema>;

/* ────────────────────────────────────────────
   Category list
   ──────────────────────────────────────────── */
const CATEGORIES = [
  'NPK Granular',
  'Water Soluble',
  'Micronutrient',
  'Bio-Fertilizer',
  'Organic',
  'Urea',
  'DAP',
  'Potash',
  'Sulphur Based',
  'Specialty',
];

/* ────────────────────────────────────────────
   Form Field component
   ──────────────────────────────────────────── */
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
   View Product Detail Modal
   ──────────────────────────────────────────── */
const ProductDetailView: React.FC<{ product: Product; onClose: () => void; onEdit: () => void }> = ({
  product,
  onClose,
  onEdit,
}) => {
  const detailRow = (label: string, value: string | undefined | null, icon?: React.ReactNode) => (
    <div className="flex items-start gap-3 py-2.5">
      {icon && <div className="shrink-0 mt-0.5 text-slate-400 dark:text-slate-500">{icon}</div>}
      <div className="flex-1 min-w-0">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 dark:text-slate-500">{label}</span>
        <span className="block text-sm text-slate-800 dark:text-slate-200 mt-0.5 whitespace-pre-wrap">{value || '—'}</span>
      </div>
    </div>
  );

  return (
    <div className="space-y-1">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-6 divide-y sm:divide-y-0 divide-slate-100 dark:divide-slate-800">
        <div className="space-y-0.5">
          {detailRow('Product Code', product.product_code, <Tag size={14} />)}
          {detailRow('Product Name', product.product_name, <Sprout size={14} />)}
          {detailRow('Category', product.category, <FileText size={14} />)}
          {detailRow('Composition', product.composition, <Beaker size={14} />)}
        </div>
        <div className="space-y-0.5">
          {detailRow('Dosage', product.dosage, <Info size={14} />)}
          {detailRow('Recommended Crops', product.recommended_crops, <Leaf size={14} />)}
          {detailRow('Status', product.is_active ? 'Active' : 'Inactive', <ShieldCheck size={14} />)}
          {detailRow('Created', formatDate(product.created_at))}
        </div>
      </div>
      {(product.benefits || product.description) && (
        <div className="pt-3 border-t border-slate-100 dark:border-slate-800 space-y-0.5">
          {detailRow('Benefits', product.benefits)}
          {detailRow('Description', product.description)}
        </div>
      )}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
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
          Edit Product
        </button>
      </div>
    </div>
  );
};

/* ────────────────────────────────────────────
   Product Form (Create / Edit)
   ──────────────────────────────────────────── */
const ProductForm: React.FC<{
  product: Product | null;
  onSuccess: () => void;
  onCancel: () => void;
}> = ({ product, onSuccess, onCancel }) => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const isEditing = !!product;

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      product_code: '',
      product_name: '',
      category: '',
      composition: '',
      description: '',
      dosage: '',
      benefits: '',
      recommended_crops: '',
      image_url: '',
      is_active: true,
    },
  });

  // Populate form for edit mode
  useEffect(() => {
    if (product) {
      reset({
        product_code: product.product_code || '',
        product_name: product.product_name || '',
        category: product.category || '',
        composition: product.composition || '',
        description: product.description || '',
        dosage: product.dosage || '',
        benefits: product.benefits || '',
        recommended_crops: product.recommended_crops || '',
        image_url: product.image_url || '',
        is_active: product.is_active,
      });
    }
  }, [product, reset]);

  const createMutation = useMutation({
    mutationFn: (data: ProductFormData) => api.post('/products/', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ variant: 'success', title: 'Product Created', message: 'The new product has been added to the catalog.' });
      onSuccess();
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || 'Failed to create product. Please try again.';
      toast({ variant: 'error', title: 'Creation Failed', message: typeof detail === 'string' ? detail : JSON.stringify(detail) });
    },
  });

  const updateMutation = useMutation({
    mutationFn: (data: ProductFormData) => api.put(`/products/${product!.id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ variant: 'success', title: 'Product Updated', message: 'Product details have been saved successfully.' });
      onSuccess();
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || 'Failed to update product. Please try again.';
      toast({ variant: 'error', title: 'Update Failed', message: typeof detail === 'string' ? detail : JSON.stringify(detail) });
    },
  });

  const onSubmit = (data: ProductFormData) => {
    // Clean empty optional strings to null/undefined for the backend
    const cleaned: Record<string, any> = { ...data };
    for (const key of ['composition', 'description', 'dosage', 'benefits', 'recommended_crops', 'image_url']) {
      if (cleaned[key] === '') cleaned[key] = null;
    }

    if (isEditing) {
      updateMutation.mutate(cleaned as ProductFormData);
    } else {
      createMutation.mutate(cleaned as ProductFormData);
    }
  };

  const busy = isSubmitting || createMutation.isPending || updateMutation.isPending;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
      {/* Two-column grid for main fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <FormField label="Product Code" htmlFor="product_code" error={errors.product_code?.message} required>
          <input
            id="product_code"
            {...register('product_code')}
            placeholder="e.g. FERT-NPK-2024"
            className={inputBaseClass}
            disabled={busy}
          />
        </FormField>

        <FormField label="Product Name" htmlFor="product_name" error={errors.product_name?.message} required>
          <input
            id="product_name"
            {...register('product_name')}
            placeholder="e.g. NPK 19-19-19 Balanced Fertilizer"
            className={inputBaseClass}
            disabled={busy}
          />
        </FormField>

        <FormField label="Category" htmlFor="category" error={errors.category?.message} required>
          <select
            id="category"
            {...register('category')}
            className={inputBaseClass}
            disabled={busy}
          >
            <option value="">Select a category</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </FormField>

        <FormField label="Composition" htmlFor="composition" error={errors.composition?.message}>
          <input
            id="composition"
            {...register('composition')}
            placeholder="e.g. Nitrogen 19%, Phosphorus 19%, Potassium 19%"
            className={inputBaseClass}
            disabled={busy}
          />
        </FormField>

        <FormField label="Dosage" htmlFor="dosage" error={errors.dosage?.message}>
          <input
            id="dosage"
            {...register('dosage')}
            placeholder="e.g. 50 kg per acre"
            className={inputBaseClass}
            disabled={busy}
          />
        </FormField>

        <FormField label="Recommended Crops" htmlFor="recommended_crops" error={errors.recommended_crops?.message}>
          <input
            id="recommended_crops"
            {...register('recommended_crops')}
            placeholder="e.g. Wheat, Rice, Maize, Sugarcane"
            className={inputBaseClass}
            disabled={busy}
          />
        </FormField>
      </div>

      {/* Full-width text areas */}
      <FormField label="Benefits" htmlFor="benefits" error={errors.benefits?.message}>
        <textarea
          id="benefits"
          {...register('benefits')}
          placeholder="Describe the agronomic benefits of this product..."
          rows={3}
          className={textareaBaseClass}
          disabled={busy}
        />
      </FormField>

      <FormField label="Description" htmlFor="description" error={errors.description?.message}>
        <textarea
          id="description"
          {...register('description')}
          placeholder="Detailed product description and application instructions..."
          rows={3}
          className={textareaBaseClass}
          disabled={busy}
        />
      </FormField>

      <FormField label="Product Image URL" htmlFor="image_url" error={errors.image_url?.message}>
        <input
          id="image_url"
          {...register('image_url')}
          placeholder="https://example.com/product-image.jpg"
          className={inputBaseClass}
          disabled={busy}
        />
      </FormField>

      {/* Status toggle */}
      <div className="flex items-center gap-3 p-4 bg-slate-50 dark:bg-slate-800/40 rounded-xl border border-slate-100 dark:border-slate-800">
        <label htmlFor="is_active" className="flex items-center gap-3 cursor-pointer select-none flex-1">
          <div className="relative">
            <input
              type="checkbox"
              id="is_active"
              {...register('is_active')}
              className="sr-only peer"
              disabled={busy}
            />
            <div className="w-10 h-6 bg-slate-300 dark:bg-slate-600 rounded-full peer-checked:bg-emerald-500 transition-colors" />
            <div className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow-sm peer-checked:translate-x-4 transition-transform" />
          </div>
          <div>
            <span className="text-sm font-semibold text-slate-800 dark:text-slate-200">Active Status</span>
            <span className="block text-[11px] text-slate-500 dark:text-slate-400">
              Active products are visible in the system catalog
            </span>
          </div>
        </label>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center justify-end space-x-3 pt-4 border-t border-slate-100 dark:border-slate-800">
        <button
          type="button"
          onClick={onCancel}
          disabled={busy}
          className="flex items-center gap-1.5 px-4 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-xl transition-colors disabled:opacity-50"
        >
          <X size={14} />
          Cancel
        </button>
        <button
          type="submit"
          disabled={busy}
          className="flex items-center gap-1.5 px-5 py-2.5 text-xs font-semibold bg-brand-600 hover:bg-brand-500 text-white rounded-xl shadow-md shadow-brand-600/20 transition-all disabled:opacity-60"
        >
          {busy ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
          {isEditing ? 'Update Product' : 'Save Product'}
        </button>
      </div>
    </form>
  );
};

/* ────────────────────────────────────────────
   Products Page
   ──────────────────────────────────────────── */
export const Products: React.FC = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Table state
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState<string>('');
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);
  const [sortBy, setSortBy] = useState('created_at');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('desc');

  // Modal states
  const [modalMode, setModalMode] = useState<'closed' | 'create' | 'edit' | 'view'>('closed');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [deleteProductTarget, setDeleteProductTarget] = useState<Product | null>(null);

  // Fetch products
  const { data, isLoading } = useQuery<ProductListResponse>({
    queryKey: ['products', page, pageSize, search, categoryFilter, sortBy, sortOrder],
    queryFn: async () => {
      const skip = (page - 1) * pageSize;
      const params: Record<string, any> = { skip, limit: pageSize, sort_by: sortBy, sort_order: sortOrder };
      if (search) params.search = search;
      if (categoryFilter) params.category = categoryFilter;

      const res = await api.get<ProductListResponse>('/products/', { params });
      return res.data;
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['products'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard'] });
      toast({ variant: 'success', title: 'Product Deleted', message: 'The product has been permanently removed.' });
      setDeleteProductTarget(null);
    },
    onError: (err: any) => {
      const detail = err?.response?.data?.detail || 'Failed to delete product.';
      toast({ variant: 'error', title: 'Delete Failed', message: typeof detail === 'string' ? detail : JSON.stringify(detail) });
      setDeleteProductTarget(null);
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

  const openCreate = () => {
    setSelectedProduct(null);
    setModalMode('create');
  };

  const openEdit = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('edit');
  };

  const openView = (product: Product) => {
    setSelectedProduct(product);
    setModalMode('view');
  };

  const closeModal = () => {
    setModalMode('closed');
    setSelectedProduct(null);
  };

  /* ── Table columns ── */
  const columns: Column<Product>[] = [
    {
      key: 'product_code',
      header: 'Product Code',
      sortable: true,
      render: (item) => (
        <span className="font-mono font-bold text-slate-800 dark:text-slate-200">
          {item.product_code}
        </span>
      ),
    },
    {
      key: 'product_name',
      header: 'Product Line',
      sortable: true,
      render: (item) => (
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-brand-50 dark:bg-brand-950/60 text-brand-600 dark:text-brand-400 rounded-xl shrink-0">
            <Sprout size={16} />
          </div>
          <div>
            <span className="font-bold text-slate-900 dark:text-slate-100 block">{item.product_name}</span>
            {item.composition && (
              <span className="text-[11px] text-slate-500 dark:text-slate-400 block mt-0.5">
                {item.composition}
              </span>
            )}
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Category',
      sortable: true,
      render: (item) => (
        <span className="inline-flex items-center px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
          <Tag size={12} className="mr-1.5 text-slate-400" />
          {item.category}
        </span>
      ),
    },
    {
      key: 'dosage',
      header: 'Dosage / Application',
      render: (item) => <span className="text-slate-600 dark:text-slate-400">{item.dosage || '—'}</span>,
    },
    {
      key: 'is_active',
      header: 'Status',
      render: (item) => (
        <Badge variant={item.is_active ? 'success' : 'neutral'} dot>
          {item.is_active ? 'Active' : 'Inactive'}
        </Badge>
      ),
    },
    {
      key: 'created_at',
      header: 'Created Date',
      sortable: true,
      render: (item) => formatDate(item.created_at),
    },
    {
      key: 'actions',
      header: 'Actions',
      className: 'text-right',
      render: (item) => (
        <div className="flex items-center justify-end space-x-1.5" onClick={(e) => e.stopPropagation()}>
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
            onClick={() => setDeleteProductTarget(item)}
            className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/50 rounded-lg transition-colors"
            title="Delete"
          >
            <Trash2 size={16} />
          </button>
        </div>
      ),
    },
  ];

  /* ── Modal title mapping ── */
  const modalTitle =
    modalMode === 'create'
      ? 'Add New Product'
      : modalMode === 'edit'
        ? 'Edit Product'
        : selectedProduct?.product_name || 'Product Details';

  const modalSubtitle =
    modalMode === 'view'
      ? 'Product catalog entry details'
      : 'Fill in the fertilizer product details below';

  return (
    <div className="space-y-6">
      {/* Action Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-slate-100 tracking-tight">
            Fertilizer Products
          </h1>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Manage catalog definitions, NPK formulas, application dosages, and active status
          </p>
        </div>

        <button
          onClick={openCreate}
          className="flex items-center space-x-2 bg-brand-600 hover:bg-brand-500 text-white font-semibold text-xs px-4 py-2.5 rounded-xl transition-all shadow-md shadow-brand-600/20 w-max"
        >
          <Plus size={16} />
          <span>Add New Product</span>
        </button>
      </div>

      {/* Toolbar Controls */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white dark:bg-slate-900 p-4 border border-slate-200 dark:border-slate-800 rounded-3xl shadow-sm">
        <SearchBar
          value={search}
          onChange={(val) => {
            setSearch(val);
            setPage(1);
          }}
          placeholder="Filter by product name, code, composition..."
        />

        <div className="flex items-center space-x-3">
          <select
            value={categoryFilter}
            onChange={(e) => {
              setCategoryFilter(e.target.value);
              setPage(1);
            }}
            className="bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs text-slate-700 dark:text-slate-300 font-medium rounded-xl px-3 py-2 focus:outline-none focus:border-brand-500"
          >
            <option value="">All Categories</option>
            {CATEGORIES.map((cat) => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Data Table */}
      <DataTable
        columns={columns}
        data={data?.items || []}
        loading={isLoading}
        emptyTitle="No product lines found"
        emptyDescription="No fertilizer products match the current search filters."
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

      {/* Create / Edit / View Modal */}
      <Modal
        isOpen={modalMode !== 'closed'}
        onClose={closeModal}
        title={modalTitle}
        subtitle={modalSubtitle}
        maxWidth={modalMode === 'view' ? 'xl' : '2xl'}
      >
        {modalMode === 'view' && selectedProduct ? (
          <ProductDetailView
            product={selectedProduct}
            onClose={closeModal}
            onEdit={() => {
              setModalMode('edit');
            }}
          />
        ) : (
          <ProductForm
            product={modalMode === 'edit' ? selectedProduct : null}
            onSuccess={closeModal}
            onCancel={closeModal}
          />
        )}
      </Modal>

      {/* Delete Confirmation */}
      <ConfirmationDialog
        isOpen={!!deleteProductTarget}
        onClose={() => setDeleteProductTarget(null)}
        onConfirm={() => {
          if (deleteProductTarget) {
            deleteMutation.mutate(deleteProductTarget.id);
          }
        }}
        title="Delete Product Line"
        message={`Are you sure you want to delete "${deleteProductTarget?.product_name}"? This action cannot be undone. All associated batches, QR codes, and dispatch records will be permanently removed.`}
        confirmLabel="Delete Product"
        isLoading={deleteMutation.isPending}
      />
    </div>
  );
};
