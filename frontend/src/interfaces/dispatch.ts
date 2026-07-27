import type { Dealer } from './dealer';
import type { Batch } from './batch';

export interface Dispatch {
  id: string;
  dispatch_number: string;
  dealer_id: string;
  batch_id: string;
  quantity: number;
  dispatch_date: string;
  invoice_number: string;
  transport_name: string;
  vehicle_number: string;
  lr_number?: string | null;
  remarks?: string | null;
  created_at: string;
  dealer?: Dealer;
  batch?: Batch;
}

export interface DispatchListResponse {
  items: Dispatch[];
  total: number;
  skip: number;
  limit: number;
}
