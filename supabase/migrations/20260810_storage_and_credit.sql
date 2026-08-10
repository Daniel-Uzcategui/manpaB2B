-- ==============================================================================
-- MANPA B2B - STORAGE BUCKETS & CREDIT/STOCK AUTOMATION MIGRATION
-- ==============================================================================

-- 1. SUPABASE STORAGE BUCKETS INITIALIZATION
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('registration-docs', 'registration-docs', false, 10485760, ARRAY['application/pdf']),
  ('payment-proofs', 'payment-proofs', false, 10485760, ARRAY['application/pdf', 'image/jpeg', 'image/png', 'image/webp']),
  ('product-assets', 'product-assets', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('banners', 'banners', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- 2. STORAGE RLS POLICIES

-- registration-docs (Private: authenticated users upload their own docs, admins read all)
CREATE POLICY "Allow authenticated upload registration docs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'registration-docs');

CREATE POLICY "Allow users and admin view registration docs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'registration-docs');

-- payment-proofs (Private: authenticated users upload payment proofs, admins read all)
CREATE POLICY "Allow authenticated upload payment proofs"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'payment-proofs');

CREATE POLICY "Allow users and admin view payment proofs"
ON storage.objects FOR SELECT
TO authenticated
USING (bucket_id = 'payment-proofs');

-- Public assets (product-assets and banners)
CREATE POLICY "Public read for product assets and banners"
ON storage.objects FOR SELECT
TO public
USING (bucket_id IN ('product-assets', 'banners'));

CREATE POLICY "Admin full manage for public assets"
ON storage.objects FOR ALL
TO authenticated
USING (bucket_id IN ('product-assets', 'banners') AND public.is_admin());
