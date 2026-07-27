export interface Dealer {
  id: string;
  dealer_code: string;
  dealer_name: string;
  owner_name: string;
  contact_person?: string | null;
  phone: string;
  email?: string | null;
  gst_number: string;
  address: string;
  city: string;
  state: string;
  pincode?: string | null;
  status: 'Active' | 'Inactive';
  created_at: string;
}

export interface DealerListResponse {
  items: Dealer[];
  total: number;
  skip: number;
  limit: number;
}
