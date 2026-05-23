import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { CheckCircle2 } from "lucide-react";
import { lookupOrder } from "@/lib/orders.functions";

type ConfirmationStub = {
  orderId: string;
  customerName: string;
  email: string;
  total: number;
  placedAt: string;
};

type OrderItem = {
  product_name: string;
  quantity: number;
  unit_price: number;
  customization_details: Record<string, any>;
  uploaded_image_url?: string | null;
};

type OrderDetails = {
  id: string;
  status: string;
  total_amount: number;
  items: OrderItem[];
};

export const Route = createFileRoute("/order-confirmation")({
  head: () => ({ meta: [{ title: "Order Confirmed · WhimsyCraft" }] }),
  component: OrderConfirmation,
});

function OrderConfirmation() {
  const [stub, setStub] = useState<ConfirmationStub | null>(null);
  const [order, setOrder] = useState<OrderDetails | null>(null);
  const lookup = useServerFn(lookupOrder);

  useEffect(() => {
    const raw = sessionStorage.getItem("whimsycraft-last-order");
    if (!raw) return;
    try {
      const parsed = JSON.parse(raw) as ConfirmationStub;
      setStub(parsed);
      lookup({ data: { orderId: parsed.orderId, email: parsed.email } })
        .then((data) => {
          if (data) setOrder(data as OrderDetails);
        })
        .catch(() => {
          /* silent — stub still shown */
        });
    } catch {
      /* ignore */
    }
  }, [lookup]);

  if (!stub) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <h1 className="text-3xl font-display font-bold">No recent order found</h1>
        <p className="text-muted-foreground mt-2">Head back to the shop to start a new order.</p>
        <Link to="/shop" className="btn-gold inline-flex mt-6">Shop now</Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <div className="text-center">
        <CheckCircle2 className="w-16 h-16 mx-auto text-primary" />
        <h1 className="text-4xl font-display font-bold mt-3">Order Confirmed!</h1>
        <p className="text-muted-foreground mt-2">
          Thank you, {stub.customerName}. A confirmation will arrive at {stub.email}.
        </p>
      </div>

      <div className="whimsy-card p-5 mt-8">
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <div>
            <div className="text-muted-foreground">Order ID</div>
            <div className="font-mono font-semibold break-all">{stub.orderId}</div>
          </div>
          <div className="text-right">
            <div className="text-muted-foreground">Placed</div>
            <div className="font-medium">{new Date(stub.placedAt).toLocaleString()}</div>
          </div>
        </div>
      </div>

      {order && (
        <div className="whimsy-card p-5 mt-5">
          <h2 className="font-display text-xl mb-4">Your customizations</h2>
          <div className="space-y-4">
            {order.items.map((it, idx) => (
              <div key={idx} className="border-b border-border last:border-b-0 pb-4 last:pb-0">
                <div className="flex justify-between gap-3">
                  <div>
                    <div className="font-semibold">{it.product_name}</div>
                    <div className="text-xs text-muted-foreground">
                      Qty: {it.quantity} · ${Number(it.unit_price).toFixed(2)} each
                    </div>
                  </div>
                  <div className="font-semibold">${(Number(it.unit_price) * it.quantity).toFixed(2)}</div>
                </div>
                {it.customization_details && Object.keys(it.customization_details).length > 0 && (
                  <dl className="mt-2 text-sm grid sm:grid-cols-2 gap-x-4 gap-y-1">
                    {Object.entries(it.customization_details).map(([k, v]) => {
                      if (k === "uploaded_photos" && Array.isArray(v)) {
                        return (
                          <div key={k} className="sm:col-span-2">
                            <dt className="text-muted-foreground capitalize">Uploaded photos ({v.length})</dt>
                            <dd className="flex flex-wrap gap-2 mt-1">
                              {v.map((url: string, i: number) => (
                                <img key={i} src={url} alt={`Upload ${i + 1}`} className="w-14 h-14 rounded object-cover border border-border" />
                              ))}
                            </dd>
                          </div>
                        );
                      }
                      if (k === "uploaded_photo" && typeof v === "string") {
                        return (
                          <div key={k} className="sm:col-span-2">
                            <dt className="text-muted-foreground">Uploaded photo</dt>
                            <dd className="mt-1"><img src={v} alt="Uploaded" className="w-20 h-20 rounded object-cover border border-border" /></dd>
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
      )}

      <div className="flex gap-3 justify-center mt-8 flex-wrap">
        <Link to="/track-order" className="btn-gold">Track this order</Link>
        <Link to="/shop" className="px-5 py-2 rounded-full bg-accent hover:bg-accent/70 font-medium">Keep shopping</Link>
        <Link to="/" className="px-5 py-2 rounded-full bg-muted hover:bg-muted/70 font-medium">Home</Link>
      </div>
    </div>
  );
}
