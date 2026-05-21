import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { useState } from "react";
import { CustomizerDialog } from "@/components/CustomizerDialog";

export const Route = createFileRoute("/shop")({
  head: () => ({
    meta: [{ title: "Shop · WhimsyCraft" }, { name: "description", content: "Browse all our personalized handmade gifts." }],
  }),
  component: Shop,
});

function Shop() {
  const { data: products, isLoading } = useQuery({
    queryKey: ["products", "all"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").eq("active", true).order("created_at");
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  const [active, setActive] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);
  const [filter, setFilter] = useState<string>("All");

  const categories = ["All", ...Array.from(new Set(products?.map((p) => p.category) ?? []))];
  const visible = filter === "All" ? products : products?.filter((p) => p.category === filter);

  return (
    <div className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-4xl font-display font-bold">Shop the whole garden</h1>
      <p className="text-muted-foreground mt-2">Every piece is made by hand with whimsy and care.</p>

      <div className="flex flex-wrap gap-2 mt-6">
        {categories.map((c) => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium transition ${filter === c ? "bg-primary text-primary-foreground" : "bg-muted hover:bg-muted/70"}`}
          >
            {c}
          </button>
        ))}
      </div>

      {isLoading && <div className="text-center py-20 text-muted-foreground">Loading the garden…</div>}

      <div className="mt-8 grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {visible?.map((p) => (
          <article key={p.id} className="whimsy-card overflow-hidden flex flex-col">
            <img src={p.sample_image_url ?? ""} alt={p.name} className="w-full aspect-square object-cover" />
            <div className="p-5 flex-1 flex flex-col">
              <div className="text-xs font-semibold text-primary uppercase tracking-wide">{p.category}</div>
              <h3 className="font-display text-xl mt-1">{p.name}</h3>
              <p className="text-sm text-muted-foreground mt-1 flex-1 line-clamp-2">{p.description}</p>
              <div className="mt-4 flex items-center justify-between">
                <span className="font-semibold text-lg">${Number(p.base_price).toFixed(2)}</span>
                <button
                  onClick={() => { setActive(p); setOpen(true); }}
                  className="px-4 py-2 rounded-full bg-primary text-primary-foreground hover:opacity-90 text-sm font-semibold"
                >
                  Customize & Buy
                </button>
              </div>
            </div>
          </article>
        ))}
      </div>

      <CustomizerDialog product={active} open={open} onOpenChange={setOpen} />
    </div>
  );
}
