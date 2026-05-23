import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { supabaseAdmin } from "@/integrations/supabase/client.server";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

const SIGNED_URL_TTL = 60 * 60; // 1 hour
const MAX_ITEMS = 50;

const customizationSchema = z.record(z.string().min(1).max(64), z.any());

const itemSchema = z.object({
  productId: z.string().uuid().nullable().optional(),
  productName: z.string().trim().min(1).max(255),
  quantity: z.number().int().min(1).max(100),
  unitPrice: z.number().min(0).max(100000),
  customization: customizationSchema.default({}),
  uploadedImagePath: z.string().max(512).optional().nullable(),
});

const placeOrderSchema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(5).max(30),
  address: z.string().trim().min(8).max(500),
  notes: z.string().max(500).optional().default(""),
  items: z.array(itemSchema).min(1).max(MAX_ITEMS),
});

export const placeOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => placeOrderSchema.parse(input))
  .handler(async ({ data }) => {
    const total = data.items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);

    const { data: order, error: orderErr } = await supabaseAdmin
      .from("orders")
      .insert({
        user_email: data.email,
        customer_name: data.name,
        phone: data.phone,
        shipping_address: data.address,
        notes: data.notes ?? null,
        total_amount: total,
        status: "Pending",
      })
      .select("id")
      .single();
    if (orderErr || !order) throw new Error(orderErr?.message ?? "Failed to create order");

    const rows = data.items.map((i) => ({
      order_id: order.id,
      product_id: i.productId ?? null,
      product_name: i.productName,
      quantity: i.quantity,
      unit_price: i.unitPrice,
      customization_details: i.customization ?? {},
      uploaded_image_path: i.uploadedImagePath ?? null,
    }));
    const { error: itemsErr } = await supabaseAdmin.from("order_items").insert(rows);
    if (itemsErr) {
      // best-effort rollback
      await supabaseAdmin.from("orders").delete().eq("id", order.id);
      throw new Error(itemsErr.message);
    }

    return { orderId: order.id as string };
  });

const lookupSchema = z.object({
  orderId: z.string().uuid(),
  email: z.string().trim().email().max(255),
});

async function signPaths(paths: string[]): Promise<Record<string, string>> {
  const unique = Array.from(new Set(paths.filter(Boolean)));
  if (unique.length === 0) return {};
  const { data, error } = await supabaseAdmin.storage
    .from("customer_uploads")
    .createSignedUrls(unique, SIGNED_URL_TTL);
  if (error || !data) return {};
  const map: Record<string, string> = {};
  for (const row of data) {
    if (row.path && row.signedUrl) map[row.path] = row.signedUrl;
  }
  return map;
}

function collectPaths(customization: any, fallback?: string | null): string[] {
  const out: string[] = [];
  if (fallback) out.push(fallback);
  if (customization && typeof customization === "object") {
    if (typeof customization.uploaded_photo === "string") out.push(customization.uploaded_photo);
    if (Array.isArray(customization.uploaded_photos)) {
      for (const p of customization.uploaded_photos) if (typeof p === "string") out.push(p);
    }
  }
  return out;
}

function rewriteCustomizationUrls(customization: any, map: Record<string, string>) {
  if (!customization || typeof customization !== "object") return customization;
  const c = { ...customization };
  if (typeof c.uploaded_photo === "string" && map[c.uploaded_photo]) {
    c.uploaded_photo = map[c.uploaded_photo];
  }
  if (Array.isArray(c.uploaded_photos)) {
    c.uploaded_photos = c.uploaded_photos.map((p: string) => (typeof p === "string" && map[p] ? map[p] : p));
  }
  return c;
}

export const lookupOrder = createServerFn({ method: "POST" })
  .inputValidator((input: unknown) => lookupSchema.parse(input))
  .handler(async ({ data }) => {
    const { data: order, error } = await supabaseAdmin
      .from("orders")
      .select("id, status, customer_name, user_email, total_amount, tracking_number, shipping_address, created_at, updated_at")
      .eq("id", data.orderId)
      .ilike("user_email", data.email)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!order) return null;

    const { data: items, error: itemsErr } = await supabaseAdmin
      .from("order_items")
      .select("product_name, quantity, unit_price, customization_details, uploaded_image_path, created_at")
      .eq("order_id", order.id)
      .order("created_at", { ascending: true });
    if (itemsErr) throw new Error(itemsErr.message);

    const allPaths: string[] = [];
    for (const it of items ?? []) {
      allPaths.push(...collectPaths(it.customization_details, it.uploaded_image_path));
    }
    const signed = await signPaths(allPaths);

    return {
      id: order.id,
      status: order.status,
      customer_name: order.customer_name,
      total_amount: order.total_amount,
      tracking_number: order.tracking_number,
      shipping_address: order.shipping_address,
      created_at: order.created_at,
      updated_at: order.updated_at,
      items: (items ?? []).map((it) => ({
        product_name: it.product_name,
        quantity: it.quantity,
        unit_price: it.unit_price,
        customization_details: rewriteCustomizationUrls(it.customization_details, signed),
        uploaded_image_url: it.uploaded_image_path ? signed[it.uploaded_image_path] ?? null : null,
      })),
    };
  });

// Admin-only: list all orders with signed image URLs
export const adminListOrders = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }) => {
    const { data: isAdmin, error: roleErr } = await supabaseAdmin.rpc as any; // not used
    void roleErr;
    // Verify admin via private.has_role
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const { data: orders, error } = await supabaseAdmin
      .from("orders")
      .select("*, order_items(*)")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);

    const paths: string[] = [];
    for (const o of orders ?? []) {
      for (const it of (o as any).order_items ?? []) {
        paths.push(...collectPaths(it.customization_details, it.uploaded_image_path));
      }
    }
    const signed = await signPaths(paths);

    return (orders ?? []).map((o: any) => ({
      ...o,
      order_items: (o.order_items ?? []).map((it: any) => ({
        ...it,
        customization_details: rewriteCustomizationUrls(it.customization_details, signed),
        uploaded_image_url: it.uploaded_image_path ? signed[it.uploaded_image_path] ?? null : null,
      })),
    }));
  });

const updateStatusSchema = z.object({
  orderId: z.string().uuid(),
  status: z.enum(["Pending", "Printing", "Shipped", "Delivered"]),
});

export const adminUpdateOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: unknown) => updateStatusSchema.parse(input))
  .handler(async ({ context, data }) => {
    const { data: roleRow } = await supabaseAdmin
      .from("user_roles")
      .select("role")
      .eq("user_id", context.userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!roleRow) throw new Error("Forbidden");

    const { error } = await supabaseAdmin
      .from("orders")
      .update({ status: data.status, updated_at: new Date().toISOString() })
      .eq("id", data.orderId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
