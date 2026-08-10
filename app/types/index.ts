export type UserRole = 'admin' | 'distributor_pending' | 'distributor_approved' | 'distributor_rejected';

export type OrderStatus =
  | 'draft'
  | 'pending_approval'
  | 'awaiting_payment'
  | 'paid'
  | 'processing'
  | 'dispatched'
  | 'completed'
  | 'cancelled';

export type PaymentMethod =
  | 'cash_on_delivery'
  | 'wire_transfer'
  | 'credit_30_days'
  | 'credit_60_days';

export type ShippingCalcType = 'flat_rate' | 'quote_required' | 'distance_based';

export interface Profile {
  id: string;
  company_id: string | null;
  full_name: string;
  role: UserRole;
  tax_doc_url?: string;
  mercantile_doc_url?: string;
  created_at: string;
}

export interface Company {
  id: string;
  legal_name: string;
  tax_id: string;
  phone: string;
  contact_person: string;
  address: string;
  price_list_id?: string | null;
  credit_limit?: number;
  used_credit?: number;
  created_at?: string;
}

export interface ProductTier {
  id?: string;
  product_id?: string;
  min_quantity: number;
  discount_percentage: number;
}

export interface Product {
  id: string;
  sku: string;
  name: string;
  slug: string;
  category: string;
  description: string;
  technical_sheet_url?: string;
  images: string[];
  stock: number;
  min_order_qty: number; // MOQ
  qty_step: number;     // Pack increment step (e.g., 24)
  base_price: number;
  effective_price?: number;
  is_active: boolean;
  tiers?: ProductTier[];
  created_at?: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
  unit_price: number;
  subtotal: number;
}

export interface Order {
  id: string;
  order_number: number;
  company_id: string;
  user_id: string;
  status: OrderStatus;
  subtotal: number;
  tax_amount: number;
  shipping_cost: number;
  total: number;
  payment_method: PaymentMethod;
  shipping_calc_type: ShippingCalcType;
  shipping_address?: string;
  payment_receipt_url?: string;
  pdf_invoice_url?: string;
  notes?: string;
  created_at: string;
  company?: Company;
  profile?: Profile;
  items?: OrderItem[];
}

export interface OrderItem {
  id: string;
  order_id: string;
  product_id: string;
  quantity: number;
  unit_price: number;
  total_price: number;
  product?: Product;
}

export interface Message {
  id: string;
  order_id: string;
  sender_id: string;
  content: string;
  is_support_ticket: boolean;
  read_by_admin: boolean;
  read_by_user: boolean;
  created_at: string;
  sender_name?: string;
}

export interface Banner {
  id: string;
  title: string;
  subtitle?: string;
  image_url: string;
  link_url?: string;
  cta_text?: string;
  is_active: boolean;
  position: number;
}
