import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useCart } from "@/lib/cart-store";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { z } from "zod";
import { placeOrder } from "@/lib/orders.functions";

export const Route = createFileRoute("/checkout")({
  head: () => ({ meta: [{ title: "Checkout · WhimsyCraft" }] }),
  component: Checkout,
});

const schema = z.object({
  name: z.string().trim().min(2).max(100),
  email: z.string().trim().email().max(255),
  phone: z.string().trim().min(5).max(30),
  address: z.string().trim().min(8).max(500),
  notes: z.string().max(500).optional(),
});

function Checkout() {
  const { items, total, clear } = useCart();
  const navigate = useNavigate();
  const [form, setForm] = useState({ name: "", email: "", phone: "", address: "", notes: "" });
  const [submitting, setSubmitting] = useState(false);
  const submitOrder = useServerFn(placeOrder);

  async function placeOrderHandler() {
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    if (items.length === 0) {
      toast.error("Cart is empty");
      return;
    }
    setSubmitting(true);
    try {
      const result = await submitOrder({
        data: {
          name: form.name,
          email: form.email,
          phone: form.phone,
          address: form.address,
          notes: form.notes,
          items: items.map((i) => ({
            productId: i.productId,
            productName: i.productName,
            quantity: i.quantity,
            unitPrice: i.unitPrice,
            customization: i.customization,
            uploadedImagePath: i.uploadedImagePath ?? null,
          })),
        },
      });

      sessionStorage.setItem(
        "whimsycraft-last-order",
        JSON.stringify({
          orderId: result.orderId,
          customerName: form.name,
          email: form.email,
          total: total(),
          placedAt: new Date().toISOString(),
        }),
      );

      clear();
      toast.success("Order placed successfully! 🌸");
      navigate({ to: "/order-confirmation" });
    } catch (e: any) {
      toast.error(e.message ?? "Failed to place order");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-display font-bold">Checkout</h1>

      <div className="grid md:grid-cols-2 gap-8 mt-8">
        <div className="space-y-4">
          <h2 className="font-display text-xl">Your details</h2>
          {(["name", "email", "phone", "address"] as const).map((k) => (
            <div key={k}>
              <Label className="capitalize">{k}</Label>
              {k === "address" ? (
                <Textarea value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1.5" />
              ) : (
                <Input value={form[k]} onChange={(e) => setForm({ ...form, [k]: e.target.value })} className="mt-1.5" />
              )}
            </div>
          ))}
          <div>
            <Label>Order notes (optional)</Label>
            <Textarea value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} className="mt-1.5" />
          </div>
        </div>

        <div className="whimsy-card p-5 h-fit">
          <h2 className="font-display text-xl mb-4">Review</h2>
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {items.map((i) => (
              <div key={i.id} className="text-sm border-b border-border pb-2">
                <div className="font-semibold">{i.productName} × {i.quantity}</div>
                <div className="text-xs text-muted-foreground">
                  {Object.entries(i.customization).map(([k, v]) => (
                    <div key={k}><span className="capitalize">{k}:</span> {Array.isArray(v) ? v.join(", ") : String(v)}</div>
                  ))}
                </div>
                <div className="text-right font-medium">${(i.unitPrice * i.quantity).toFixed(2)}</div>
              </div>
            ))}
          </div>
          <div className="flex justify-between font-bold text-lg mt-4 pt-4 border-t border-border">
            <span>Total</span>
            <span>${total().toFixed(2)}</span>
          </div>
          <Button onClick={placeOrder} disabled={submitting} className="btn-gold w-full mt-5">
            {submitting ? "Placing…" : "Place Order"}
          </Button>
        </div>
      </div>
    </div>
  );
}
