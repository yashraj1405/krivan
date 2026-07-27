import type { Product } from './product';

export interface BatchQRInfo {
  batch_id: string;
  batch_number: string;
  qr_token: string;
  qr_image_path?: string | null;
  image_url: string;
  verify_url: string;
  download_url: str;
  qr_generated_at?: string | null;
  scan_count: number;
  product?: Product;
}

export interface DealerContactInfo {
  dealer_name?: string | null;
  owner_name?: string | null;
  phone?: string | null;
  email?: string | null;
  address?: string | null;
  city?: string | null;
  state?: string | null;
}

export interface VerificationSuccess {
  verified: true;
  product_name: string;
  product_code: string;
  batch_number: str;
  manufacturing_date: string;
  expiry_date: string;
  net_content?: string | null;
  mrp?: number | null;
  category: string;
  composition?: string | null;
  recommended_crops?: string | null;
  dosage?: string | null;
  benefits?: string | null;
  description?: string | null;
  image_url?: string | null;
  dealer?: DealerContactInfo | null;
  manufacturer_name: string;
  company_address: string;
  customer_care: string;
  support_email: string;
  scan_count: number;
  first_scanned: boolean;
}

export interface VerificationFailure {
  verified: false;
  title: string;
  message: string;
  detail: string;
}

export type VerificationResponse = VerificationSuccess | VerificationFailure;
