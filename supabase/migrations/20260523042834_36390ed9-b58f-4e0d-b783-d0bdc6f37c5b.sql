
-- 1. Private schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO postgres, service_role;

-- 2. has_role in private
CREATE OR REPLACE FUNCTION private.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER
SET search_path = public
AS $$ SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role) $$;
REVOKE ALL ON FUNCTION private.has_role(uuid, public.app_role) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION private.has_role(uuid, public.app_role) TO authenticated, service_role;

-- 3. Storage policies (recreate against private.has_role; drop unwanted ones)
DROP POLICY IF EXISTS "admins upload product_samples" ON storage.objects;
DROP POLICY IF EXISTS "admins update product_samples" ON storage.objects;
DROP POLICY IF EXISTS "admins delete product_samples" ON storage.objects;
DROP POLICY IF EXISTS "public read product_samples" ON storage.objects;
DROP POLICY IF EXISTS "anyone upload customer_uploads" ON storage.objects;
DROP POLICY IF EXISTS "public read customer_uploads" ON storage.objects;

CREATE POLICY "admins upload product_samples" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (bucket_id = 'product_samples' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins update product_samples" ON storage.objects
  FOR UPDATE TO authenticated
  USING (bucket_id = 'product_samples' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins delete product_samples" ON storage.objects
  FOR DELETE TO authenticated
  USING (bucket_id = 'product_samples' AND private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins read customer_uploads" ON storage.objects
  FOR SELECT TO authenticated
  USING (bucket_id = 'customer_uploads' AND private.has_role(auth.uid(), 'admin'::public.app_role));

UPDATE storage.buckets SET public = false WHERE id = 'customer_uploads';

-- 4. Rebuild table policies against private.has_role
DROP POLICY IF EXISTS "admins read order items" ON public.order_items;
DROP POLICY IF EXISTS "anyone can insert order items" ON public.order_items;
CREATE POLICY "admins read order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins read all orders" ON public.orders;
DROP POLICY IF EXISTS "admins update orders" ON public.orders;
DROP POLICY IF EXISTS "anyone can create order" ON public.orders;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS user_id uuid;
CREATE POLICY "admins read all orders" ON public.orders
  FOR SELECT TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "admins update orders" ON public.orders
  FOR UPDATE TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "users read own orders" ON public.orders
  FOR SELECT TO authenticated
  USING (user_id IS NOT NULL AND user_id = auth.uid());
CREATE POLICY "users read own order items" ON public.order_items
  FOR SELECT TO authenticated
  USING (EXISTS (SELECT 1 FROM public.orders o WHERE o.id = order_id AND o.user_id = auth.uid()));

DROP POLICY IF EXISTS "admins manage products" ON public.products;
DROP POLICY IF EXISTS "anyone reads active products" ON public.products;
CREATE POLICY "admins manage products" ON public.products
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));
CREATE POLICY "anyone reads active products" ON public.products
  FOR SELECT
  USING ((active = true) OR private.has_role(auth.uid(), 'admin'::public.app_role));

DROP POLICY IF EXISTS "admins manage roles" ON public.user_roles;
CREATE POLICY "admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (private.has_role(auth.uid(), 'admin'::public.app_role))
  WITH CHECK (private.has_role(auth.uid(), 'admin'::public.app_role));

-- 5. Drop legacy public API functions
DROP FUNCTION IF EXISTS public.lookup_order(uuid, text);
DROP FUNCTION IF EXISTS public.has_role(uuid, public.app_role);
