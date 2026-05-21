import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/admin/")({ component: Dashboard });

function Dashboard() {
  const { data } = useQuery({
    queryKey: ["admin", "stats"],
    queryFn: async () => {
      const [orders, pending, products] = await Promise.all([
        supabase.from("orders").select("total_amount, status"),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "Pending"),
        supabase.from("products").select("id", { count: "exact", head: true }),
      ]);
      const totalSales = (orders.data ?? []).reduce((s, o: any) => s + Number(o.total_amount), 0);
      return {
        totalOrders: orders.data?.length ?? 0,
        totalSales,
        pending: pending.count ?? 0,
        products: products.count ?? 0,
      };
    },
  });

  const cards = [
    { label: "Total Orders", value: data?.totalOrders ?? "—" },
    { label: "Total Sales", value: data ? `$${data.totalSales.toFixed(2)}` : "—" },
    { label: "Pending Orders", value: data?.pending ?? "—" },
    { label: "Products", value: data?.products ?? "—" },
  ];

  return (
    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
      {cards.map((c) => (
        <div key={c.label} className="whimsy-card p-6">
          <div className="text-sm text-muted-foreground">{c.label}</div>
          <div className="text-3xl font-display font-bold mt-2">{c.value}</div>
        </div>
      ))}
    </div>
  );
}
