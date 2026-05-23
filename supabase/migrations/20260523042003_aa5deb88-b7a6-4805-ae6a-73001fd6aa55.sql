
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tracking_number text;

CREATE OR REPLACE FUNCTION public.lookup_order(p_order_id uuid, p_email text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order public.orders;
  v_items jsonb;
BEGIN
  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id AND lower(user_email) = lower(p_email);

  IF NOT FOUND THEN
    RETURN NULL;
  END IF;

  SELECT COALESCE(jsonb_agg(to_jsonb(oi.*) ORDER BY oi.created_at), '[]'::jsonb)
    INTO v_items
  FROM public.order_items oi
  WHERE oi.order_id = v_order.id;

  RETURN jsonb_build_object(
    'id', v_order.id,
    'status', v_order.status,
    'customer_name', v_order.customer_name,
    'user_email', v_order.user_email,
    'total_amount', v_order.total_amount,
    'tracking_number', v_order.tracking_number,
    'shipping_address', v_order.shipping_address,
    'created_at', v_order.created_at,
    'updated_at', v_order.updated_at,
    'items', v_items
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.lookup_order(uuid, text) TO anon, authenticated;
