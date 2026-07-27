export interface Product {
  id: string;
  product_code: string;
  product_name: string;
  category: string;
  composition?: string;
  description?: string;
  dosage?: string;
  benefits?: string;
  recommended_crops?: string;
  image_url?: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface ProductListResponse {
  items: Product[];
  total: number;
  skip: number;
  limit: number;
}
