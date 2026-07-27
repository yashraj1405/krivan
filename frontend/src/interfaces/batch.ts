import type { Product } from './product';

export type BatchStatus =
  | 'Draft'
  | 'Production'
  | 'QR Generated'
  | 'Printed'
  | 'Packed'
  | 'Dispatched'
  | 'Completed';

export interface Batch {
  id: string;
  product_id: string;
  batch_number: string;
  manufacturing_date: string;
  expiry_date: string;
  quantity: number;
  net_content?: string | null;
  mrp?: number | null;
  status: BatchStatus;
  qr_token?: string | null;
  qr_image_path?: string | null;
  qr_generated_at?: string | null;
  scan_count?: number;
  dispatched_quantity?: number;
  remaining_quantity?: number;
  remarks?: string | null;
  created_at: string;
  updated_at: string;
  product?: Product;
}

export interface BatchListResponse {
  items: Batch[];
  total: number;
  skip: number;
  limit: number;
}
