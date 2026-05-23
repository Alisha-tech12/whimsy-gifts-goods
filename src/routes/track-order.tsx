import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { Package, Truck, CheckCircle2, Printer, Clock } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/track-order")({
  head: () => ({ meta: [
    { title: "Track Your Order · WhimsyCraft" },
    { name: "description", content: "Track the status of your WhimsyCraft order using your Order ID and email." },
  ] }),
  component: TrackOrderPage,
});

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  customization_details: Record<string, any>;
  uploaded_image_path?: string | null;
};

type OrderLookup = {
  id: string;
  status: string;
  customer_name: string;
  total_amount: number;
  tracking_number: string | null;
  shipping_address: string | null;
  created_at: string;
  updated_at: string;
  items: OrderItem[];
};

const STATUS_FLOW = ["Pending", "Printing", "Shipped", "Delivered"] as const;
const STATUS_ICON: Record<string, any> = {
  Pending: Clock,
  Printing: Printer,
  Shipped: Truck,
  Delivered: CheckCircle2,
};

function estimateDelivery(createdAt: string, status: string) {
  const placed = new Date(createdAt);
  const days = status === "Delivered" ? 0 : status === "Shipped" ? 3 : status === "Printing" ? 7 : 10;
  const eta = new Date(placed.getTime() + days * 86400000);
  return eta.toLocaleDateString(undefined, { weekday: "long", month: "short", day: "numeric" });
}

function TrackOrderPage() {
  const [orderId, setOrderId] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [order, setOrder] = useState<OrderLookup | null>(null);
  const [notFound, setNotFound] = useState(false);

  async function handleLookup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setNotFound(false);
    setOrder(null);
    try {
      const { data, error } = await supabase.rpc("lookup_order", {
        p_order_id: orderId.trim(),
        p_email: email.trim(),
      });
      if (error) throw error;
      if (!data) {
        setNotFound(true);
      } else {
        setOrder(data as OrderLookup);
      }
    } catch (err: any) {
      toast.error(err.message ?? "Lookup failed. Check your Order ID format.");
    } finally {
      setLoading(false);
    }
  }

  const currentStep = order ? Math.max(0, STATUS_FLOW.indexOf(order.status as any)) : -1;

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center mb-8">
        <Package className="w-12 h-12 mx-auto text-primary mb-2" />
        <h1 className="text-4xl font-display font-bold text-gradient">Track Your Order</h1>
        <p className="text-muted-foreground mt-2">Enter your Order ID and email to see live status.</p>
      </div>

      <form onSubmit={handleLookup} className="whimsy-card p-6 grid sm:grid-cols-2 gap-4">
        <div className="sm:col-span-2">
          <Label htmlFor="oid">Order ID</Label>
          <Input id="oid" required value={orderId} onChange={(e) => setOrderId(e.target.value)} placeholder="e.g. 8c4f1a8e-..." className="mt-1.5 font-mono" />
        </div>
        <div className="sm:col-span-2">
          <Label htmlFor="em">Email used at checkout</Label>
          <Input id="em" type="email" required value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" className="mt-1.5" />
        </div>
        <div className="sm:col-span-2 flex justify-end">
          <Button type="submit" disabled={loading} className="btn-gold">{loading ? "Searching…" : "Track Order"}</Button>
        </div>
      </form>

      {notFound && (
        <div className="whimsy-card p-6 mt-6 text-center">
          <p className="font-semibold">No order found</p>
          <p className="text-sm text-muted-foreground mt-1">Double-check your Order ID and email address.</p>
        </div>
      )}

      {order && (
        <div className="space-y-5 mt-6">
          <div className="whimsy-card p-5">
            <div className="flex flex-wrap justify-between gap-3 text-sm">
              <div>
                <div className="text-muted-foreground">Order ID</div>
                <div className="font-mono font-semibold break-all">{order.id}</div>
              </div>
              <div className="text-right">
                <div className="text-muted-foreground">Estimated delivery</div>
                <div className="font-semibold">{estimateDelivery(order.created_at, order.status)}</div>
              </div>
            </div>
            {order.tracking_number && (
              <div className="mt-3 text-sm">
                <span className="text-muted-foreground">Tracking #: </span>
                <span className="font-mono font-semibold">{order.tracking_number}</span>
              </div>
            )}
          </div>

          {/* Status timeline */}
          <div className="whimsy-card p-5">
            <h2 className="font-display text-xl mb-4">Status</h2>
            <ol className="grid grid-cols-4 gap-2 relative">
              {STATUS_FLOW.map((s, i) => {
                const Icon = STATUS_ICON[s];
                const done = i <= currentStep;
                const current = i === currentStep;
                return (
                  <li key={s} className="flex flex-col items-center text-center relative">
                    {i < STATUS_FLOW.length - 1 && (
                      <span className={`absolute top-5 left-1/2 w-full h-1 ${i < currentStep ? "bg-primary" : "bg-border"}`} />
                    )}
                    <div className={`relative z-10 w-10 h-10 rounded-full flex items-center justify-center ${done ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground"} ${current ? "ring-4 ring-primary/30 animate-pop" : ""}`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className={`mt-2 text-xs font-semibold ${done ? "text-foreground" : "text-muted-foreground"}`}>{s}</div>
                  </li>
                );
              })}
            </ol>
            <p className="text-xs text-muted-foreground mt-4 text-center">
              Last updated {new Date(order.updated_at).toLocaleString()}
            </p>
          </div>

          <div className="whimsy-card p-5">
            <h2 className="font-display text-xl mb-4">Items</h2>
            <div className="space-y-4">
              {order.items.map((it, idx) => (
                <div key={idx} className="border-b border-border last:border-b-0 pb-3 last:pb-0">
                  <div className="flex justify-between gap-3">
                    <div>
                      <div className="font-semibold">{it.product_name}</div>
                      <div className="text-xs text-muted-foreground">Qty: {it.quantity} · ${Number(it.unit_price).toFixed(2)} each</div>
                    </div>
                    <div className="font-semibold">${(Number(it.unit_price) * it.quantity).toFixed(2)}</div>
                  </div>
                  {it.customization_details && Object.keys(it.customization_details).length > 0 && (
                    <dl className="mt-2 text-sm grid sm:grid-cols-2 gap-x-4 gap-y-1">
                      {Object.entries(it.customization_details).map(([k, v]) => {
                        if (k === "uploaded_photos" && Array.isArray(v)) {
                          return (
                            <div key={k} className="sm:col-span-2">
                              <dt className="text-muted-foreground">Uploaded photos ({v.length})</dt>
                              <dd className="flex flex-wrap gap-2 mt-1">
                                {v.map((u: string, i: number) => (
                                  <img key={i} src={u} className="w-14 h-14 rounded object-cover border border-border" />
                                ))}
                              </dd>
                            </div>
                          );
                        }
                        if (k === "uploaded_photo" && typeof v === "string") {
                          return (
                            <div key={k} className="sm:col-span-2">
                              <dt className="text-muted-foreground">Uploaded photo</dt>
                              <dd className="mt-1"><img src={v} className="w-20 h-20 rounded object-cover border border-border" /></dd>
                            </div>
                          );
                        }
                        return (
                          <div key={k}>
                            <dt className="text-muted-foreground capitalize">{k.replace(/_/g, " ")}</dt>
                            <dd className="font-medium">{Array.isArray(v) ? v.join(", ") : String(v)}</dd>
                          </div>
                        );
                      })}
                    </dl>
                  )}
                </div>
              ))}
            </div>
            <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-border">
              <span>Total</span>
              <span>${Number(order.total_amount).toFixed(2)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
