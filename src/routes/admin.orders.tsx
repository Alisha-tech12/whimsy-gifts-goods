import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Download } from "lucide-react";

export const Route = createFileRoute("/admin/orders")({ component: AdminOrders });

const STATUSES = ["Pending", "Printing", "Shipped", "Delivered"];

function AdminOrders() {
  const qc = useQueryClient();
  const { data: orders } = useQuery({
    queryKey: ["admin", "orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, order_items(*)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });

  async function updateStatus(id: string, status: string) {
    const { error } = await supabase.from("orders").update({ status }).eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Status updated");
      qc.invalidateQueries({ queryKey: ["admin", "orders"] });
    }
  }

  return (
    <div className="whimsy-card overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-muted/60 text-left">
            <tr>
              <th className="p-3">Order ID</th>
              <th className="p-3">Customer</th>
              <th className="p-3">Items</th>
              <th className="p-3">Total</th>
              <th className="p-3">Status</th>
              <th className="p-3">Date</th>
            </tr>
          </thead>
          <tbody>
            {orders?.map((o) => (
              <tr key={o.id} className="border-t border-border align-top">
                <td className="p-3 font-mono text-xs">{o.id.slice(0, 8)}…</td>
                <td className="p-3">
                  <div className="font-semibold">{o.customer_name}</div>
                  <div className="text-xs text-muted-foreground">{o.user_email}</div>
                  <div className="text-xs text-muted-foreground">{o.phone}</div>
                </td>
                <td className="p-3 space-y-2">
                  {o.order_items?.map((it: any) => (
                    <div key={it.id} className="border-b border-border pb-2 last:border-0">
                      <div className="font-medium">{it.product_name} × {it.quantity}</div>
                      <div className="text-xs text-muted-foreground">
                        {Object.entries(it.customization_details ?? {}).map(([k, v]) => (
                          <div key={k}><span className="capitalize">{k}:</span> {Array.isArray(v) ? v.join(", ") : String(v)}</div>
                        ))}
                      </div>
                      {it.uploaded_image_path && (
                        <a href={it.uploaded_image_path} target="_blank" rel="noreferrer" download className="inline-flex items-center gap-1 text-xs text-primary mt-1 underline">
                          <Download className="w-3 h-3" /> Download photo
                        </a>
                      )}
                    </div>
                  ))}
                </td>
                <td className="p-3 font-semibold">${Number(o.total_amount).toFixed(2)}</td>
                <td className="p-3">
                  <Select value={o.status} onValueChange={(v) => updateStatus(o.id, v)}>
                    <SelectTrigger className="w-32"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {STATUSES.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </td>
                <td className="p-3 text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
            {orders?.length === 0 && (
              <tr><td colSpan={6} className="text-center p-12 text-muted-foreground">No orders yet.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
