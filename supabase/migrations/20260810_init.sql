-- ==============================================================================
-- MANPA B2B ECOSYSTEM & CMS - COMPLETE DATABASE SCHEMA, RLS & RPC FUNCTIONS
-- Target DB: PostgreSQL 15+ (Supabase)
-- ==============================================================================

-- 1. ENUMS DEFINITIONS
CREATE TYPE public.user_role AS ENUM (
  'admin',
  'distributor_pending',
  'distributor_approved',
  'distributor_rejected'
);

CREATE TYPE public.order_status AS ENUM (
  'draft',
  'pending_approval',
  'awaiting_payment',
  'paid',
  'processing',
  'dispatched',
  'completed',
  'cancelled'
);

CREATE TYPE public.payment_method AS ENUM (
  'cash_on_delivery',
  'wire_transfer',
  'credit_30_days',
  'credit_60_days'
);

CREATE TYPE public.shipping_calc_type AS ENUM (
  'flat_rate',
  'quote_required',
  'distance_based'
);

CREATE TYPE public.discount_type AS ENUM (
  'percentage',
  'fixed_amount',
  'free_shipping'
);

-- 2. TABLES & STRUCTURE

-- PRICE LISTS
CREATE TABLE public.price_lists (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  is_default BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- COMPANIES (Distributors)
CREATE TABLE public.companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  legal_name TEXT NOT NULL,
  tax_id TEXT UNIQUE NOT NULL, -- RIF / NIT
  phone TEXT NOT NULL,
  contact_person TEXT NOT NULL,
  address TEXT NOT NULL,
  price_list_id UUID REFERENCES public.price_lists(id) ON DELETE SET NULL,
  credit_limit NUMERIC(12, 2) DEFAULT 0.00,
  used_credit NUMERIC(12, 2) DEFAULT 0.00,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PROFILES (Users linked to Auth)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  full_name TEXT NOT NULL,
  role user_role DEFAULT 'distributor_pending',
  tax_doc_url TEXT, -- Path in private bucket registration-docs
  mercantile_doc_url TEXT, -- Path in private bucket registration-docs
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- PRODUCTS
CREATE TABLE public.products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sku TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  category TEXT DEFAULT 'General',
  description TEXT,
  technical_sheet_url TEXT,
  images TEXT[] DEFAULT '{}',
  stock INT NOT NULL DEFAULT 0,
  min_order_qty INT NOT NULL DEFAULT 1, -- MOQ
  qty_step INT NOT NULL DEFAULT 1, -- Increments (e.g. 24, 48, 72)
  base_price NUMERIC(10, 2) NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CUSTOM PRICES PER PRICE LIST
CREATE TABLE public.custom_prices (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  price_list_id UUID REFERENCES public.price_lists(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  price NUMERIC(10, 2) NOT NULL,
  UNIQUE(price_list_id, product_id)
);

-- VOLUME PRICE TIERS (Bulk Discounts)
CREATE TABLE public.price_tiers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
  min_quantity INT NOT NULL,
  discount_percentage NUMERIC(5, 2) NOT NULL
);

-- ORDERS
CREATE TABLE public.orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number SERIAL UNIQUE,
  company_id UUID REFERENCES public.companies(id) ON DELETE SET NULL,
  user_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  status order_status DEFAULT 'pending_approval',
  subtotal NUMERIC(10, 2) NOT NULL,
  tax_amount NUMERIC(10, 2) DEFAULT 0.00,
  shipping_cost NUMERIC(10, 2) DEFAULT 0.00,
  total NUMERIC(10, 2) NOT NULL,
  payment_method payment_method NOT NULL,
  shipping_calc_type shipping_calc_type DEFAULT 'quote_required',
  shipping_address TEXT,
  payment_receipt_url TEXT,
  pdf_invoice_url TEXT,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ORDER ITEMS
CREATE TABLE public.order_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  quantity INT NOT NULL,
  unit_price NUMERIC(10, 2) NOT NULL,
  total_price NUMERIC(10, 2) NOT NULL
);

-- MESSAGES & SUPPORT TICKETS
CREATE TABLE public.messages (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_support_ticket BOOLEAN DEFAULT false,
  read_by_admin BOOLEAN DEFAULT false,
  read_by_user BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- CMS BANNERS
CREATE TABLE public.banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title TEXT,
  subtitle TEXT,
  image_url TEXT NOT NULL,
  link_url TEXT,
  cta_text TEXT DEFAULT 'Ver Catálogo',
  is_active BOOLEAN DEFAULT true,
  position INT DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SYSTEM SETTINGS (For BCV Exchange Rate, Tax Rate, etc.)
CREATE TABLE public.system_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. INDEXES FOR PERFORMANCE
CREATE INDEX idx_products_slug ON public.products(slug);
CREATE INDEX idx_products_active ON public.products(is_active);
CREATE INDEX idx_orders_company ON public.orders(company_id);
CREATE INDEX idx_orders_user ON public.orders(user_id);
CREATE INDEX idx_orders_status ON public.orders(status);
CREATE INDEX idx_messages_order ON public.messages(order_id);

-- 4. RPC FUNCTION FOR PRICE RESOLUTION
-- Determines effective unit price taking into account:
-- 1. Assigned Company Price List (custom_prices)
-- 2. Base Price as fallback
-- 3. Volume Tier Discount based on quantity ordered
CREATE OR REPLACE FUNCTION public.get_effective_product_price(
  p_product_id UUID,
  p_user_id UUID,
  p_qty INT
)
RETURNS NUMERIC(10, 2)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_base_price NUMERIC(10, 2);
  v_list_price NUMERIC(10, 2) := NULL;
  v_company_id UUID;
  v_price_list_id UUID;
  v_effective_base NUMERIC(10, 2);
  v_tier_discount NUMERIC(5, 2) := 0.00;
  v_final_price NUMERIC(10, 2);
BEGIN
  -- Get base price of product
  SELECT base_price INTO v_base_price
  FROM public.products
  WHERE id = p_product_id;

  IF v_base_price IS NULL THEN
    RETURN 0.00;
  END IF;

  -- Determine user's company and price list if authenticated
  IF p_user_id IS NOT NULL THEN
    SELECT company_id INTO v_company_id
    FROM public.profiles
    WHERE id = p_user_id;

    IF v_company_id IS NOT NULL THEN
      SELECT price_list_id INTO v_price_list_id
      FROM public.companies
      WHERE id = v_company_id;

      IF v_price_list_id IS NOT NULL THEN
        SELECT price INTO v_list_price
        FROM public.custom_prices
        WHERE price_list_id = v_price_list_id AND product_id = p_product_id;
      END IF;
    END IF;
  END IF;

  -- Fallback to default price list if no custom price found
  IF v_list_price IS NULL THEN
    SELECT cp.price INTO v_list_price
    FROM public.custom_prices cp
    JOIN public.price_lists pl ON pl.id = cp.price_list_id
    WHERE pl.is_default = true AND cp.product_id = p_product_id
    LIMIT 1;
  END IF;

  -- Set working unit price
  v_effective_base := COALESCE(v_list_price, v_base_price);

  -- Check for highest matching volume tier discount for quantity
  SELECT COALESCE(MAX(discount_percentage), 0.00) INTO v_tier_discount
  FROM public.price_tiers
  WHERE product_id = p_product_id AND min_quantity <= p_qty;

  -- Apply tier discount
  v_final_price := v_effective_base * (1.0 - (v_tier_discount / 100.0));

  RETURN ROUND(v_final_price, 2);
END;
$$;

-- 5. ROW LEVEL SECURITY (RLS) POLICIES

-- Enable RLS on all tables
ALTER TABLE public.price_lists ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.custom_prices ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.price_tiers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.banners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

-- Helper function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE SECURITY DEFINER
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'
  );
$$;

-- PRODUCTS: Publicly readable for active items, admins have full access
CREATE POLICY "Products are readable by everyone" ON public.products
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Products editable by admin only" ON public.products
  FOR ALL USING (is_admin());

-- PRICE TIERS: Readable by authenticated users, full access for admins
CREATE POLICY "Price tiers readable by authenticated users" ON public.price_tiers
  FOR SELECT USING (auth.role() = 'authenticated' OR is_admin());

CREATE POLICY "Price tiers editable by admin" ON public.price_tiers
  FOR ALL USING (is_admin());

-- PRICE LISTS & CUSTOM PRICES: Admins full control, users read assigned
CREATE POLICY "Price lists read by admin or assigned company" ON public.price_lists
  FOR SELECT USING (is_admin() OR auth.role() = 'authenticated');

CREATE POLICY "Price lists admin manage" ON public.price_lists
  FOR ALL USING (is_admin());

CREATE POLICY "Custom prices read by authenticated" ON public.custom_prices
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Custom prices admin manage" ON public.custom_prices
  FOR ALL USING (is_admin());

-- PROFILES: Users read/update own profile; Admins full control
CREATE POLICY "Profiles read own or admin" ON public.profiles
  FOR SELECT USING (auth.uid() = id OR is_admin());

CREATE POLICY "Profiles insert own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "Profiles update own or admin" ON public.profiles
  FOR UPDATE USING (auth.uid() = id OR is_admin());

-- COMPANIES: Distributors read own company; Admins manage all
CREATE POLICY "Companies read own or admin" ON public.companies
  FOR SELECT USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR is_admin()
  );

CREATE POLICY "Companies insert authenticated" ON public.companies
  FOR INSERT WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Companies update own or admin" ON public.companies
  FOR UPDATE USING (
    id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR is_admin()
  );

-- ORDERS: Users see their own orders; Admins manage all
CREATE POLICY "Orders select own or admin" ON public.orders
  FOR SELECT USING (
    user_id = auth.uid() OR
    company_id IN (SELECT company_id FROM public.profiles WHERE id = auth.uid()) OR
    is_admin()
  );

CREATE POLICY "Orders insert own" ON public.orders
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Orders update own or admin" ON public.orders
  FOR UPDATE USING (
    user_id = auth.uid() OR is_admin()
  );

-- ORDER ITEMS: Users see items for their orders; Admins full control
CREATE POLICY "Order items select own or admin" ON public.order_items
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid() OR is_admin()
    )
  );

CREATE POLICY "Order items insert own" ON public.order_items
  FOR INSERT WITH CHECK (
    order_id IN (SELECT id FROM public.orders WHERE user_id = auth.uid())
  );

-- MESSAGES: Accessible by order owner or admin
CREATE POLICY "Messages select own order or admin" ON public.messages
  FOR SELECT USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    ) OR is_admin()
  );

CREATE POLICY "Messages insert own order or admin" ON public.messages
  FOR INSERT WITH CHECK (
    sender_id = auth.uid() OR is_admin()
  );

CREATE POLICY "Messages update read status" ON public.messages
  FOR UPDATE USING (
    order_id IN (
      SELECT id FROM public.orders WHERE user_id = auth.uid()
    ) OR is_admin()
  );

-- BANNERS: Publicly readable for active banners, full control for admin
CREATE POLICY "Banners readable by all" ON public.banners
  FOR SELECT USING (is_active = true OR is_admin());

CREATE POLICY "Banners admin manage" ON public.banners
  FOR ALL USING (is_admin());

-- SYSTEM SETTINGS: Readable by all, manageable by admin
CREATE POLICY "System settings select all" ON public.system_settings
  FOR SELECT USING (true);

CREATE POLICY "System settings admin manage" ON public.system_settings
  FOR ALL USING (is_admin());

-- 6. INITIAL SEED DATA FOR TESTING & PRODUCTION READINESS

-- Default Price List
INSERT INTO public.price_lists (id, name, is_default)
VALUES ('00000000-0000-0000-0000-000000000001', 'Lista General B2B', true)
ON CONFLICT DO NOTHING;

-- Initial Settings
INSERT INTO public.system_settings (key, value)
VALUES 
  ('ves_exchange_rate', '{"rate": 36.50, "currency": "VES"}'::jsonb),
  ('tax_rate', '{"percentage": 16.00, "name": "IVA"}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Products Seed (Manpa Core Industrial & B2B Products)
INSERT INTO public.products (id, sku, name, slug, category, description, stock, min_order_qty, qty_step, base_price, is_active, images)
VALUES
  (
    '11111111-1111-1111-1111-111111111111',
    'MNP-PHI-500',
    'Papel Higiénico Industrial Manpa Jumbo 500m (Caja 6 Rollos)',
    'papel-higienico-industrial-manpa-jumbo-500m',
    'Institucional',
    'Papel higiénico hoja doble de alta resistencia y suavidad para alto tráfico industrial e institucional. Cada caja contiene 6 rollos de 500 metros.',
    2500,
    12,
    12,
    28.50,
    true,
    ARRAY['https://images.unsplash.com/photo-1584556812952-905ffd0c611a?auto=format&fit=crop&w=800&q=80']
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'MNP-PTR-300',
    'Papel Toalla en Rollo Manpa Autocorte 300m (Caja 6 Rollos)',
    'papel-toalla-rollo-manpa-autocorte-300m',
    'Institucional',
    'Toalla de papel blanca absorbente para dispensador autocorte. Ideal para sectores alimentarios, médicos y corporativos.',
    1800,
    24,
    24,
    34.00,
    true,
    ARRAY['https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?auto=format&fit=crop&w=800&q=80']
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'MNP-SRV-200',
    'Servilletas de Mesa Manpa B2B Mesa Chica (Caja 36 Paquetes x 200 ud)',
    'servilletas-manpa-b2b-mesa-chica',
    'Alimentos & Horeca',
    'Servilletas de alta blancura y absorción para restaurantes, cadenas de comida rápida y hoteles.',
    3200,
    48,
    24,
    18.90,
    true,
    ARRAY['https://images.unsplash.com/photo-1563291074-2bf8677ac0e5?auto=format&fit=crop&w=800&q=80']
  ),
  (
    '44444444-4444-4444-4444-444444444444',
    'MNP-BND-75G',
    'Papel Bond Resma Manpa Carta 75g (Caja 5 Resmas)',
    'papel-bond-resma-manpa-carta-75g',
    'Oficina & Imprenta',
    'Papel fotocopia de la más alta blancura (98% ISO) y gramaje uniforme para impresoras de alto rendimiento y multifuncionales.',
    4500,
    50,
    10,
    21.00,
    true,
    ARRAY['https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=800&q=80']
  )
ON CONFLICT DO NOTHING;

-- Seed Price Tiers for Bulk Volume Discounts
INSERT INTO public.price_tiers (product_id, min_quantity, discount_percentage)
VALUES
  ('11111111-1111-1111-1111-111111111111', 48, 5.00),   -- 5% discount starting at 48 units
  ('11111111-1111-1111-1111-111111111111', 120, 10.00), -- 10% discount starting at 120 units
  ('22222222-2222-2222-2222-222222222222', 72, 6.00),   -- 6% discount starting at 72 units
  ('22222222-2222-2222-2222-222222222222', 144, 12.00)  -- 12% discount starting at 144 units
ON CONFLICT DO NOTHING;

-- Seed Homepage Banner
INSERT INTO public.banners (title, subtitle, image_url, link_url, cta_text, is_active, position)
VALUES (
  'Abastecimiento Papelero Directo de Fábrica',
  'Precios corporativos al mayor para distribuidores, cadenas e instituciones.',
  'https://images.unsplash.com/photo-1586075010923-2dd4570fb338?auto=format&fit=crop&w=1600&q=80',
  '/catalog',
  'Explorar Productos',
  true,
  1
) ON CONFLICT DO NOTHING;
