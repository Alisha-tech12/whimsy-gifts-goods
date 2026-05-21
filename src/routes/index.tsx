import { createFileRoute, Link } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import type { Product } from "@/lib/types";
import { useState } from "react";
import { CustomizerDialog } from "@/components/CustomizerDialog";
import { Sparkles, Heart, Package } from "lucide-react";

export const Route = createFileRoute("/")({ component: Index });

function Index() {
  const { data: products } = useQuery({
    queryKey: ["products", "featured"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("active", true)
        .limit(6);
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  const [active, setActive] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="max-w-6xl mx-auto px-4 py-20 md:py-28 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent text-accent-foreground text-xs font-semibold mb-6">
            <Sparkles className="w-3.5 h-3.5" /> Handmade with love
          </div>
          <h1 className="font-display text-5xl md:text-7xl font-bold leading-tight">
            Capture the magic,<br />
            <span className="bg-gradient-to-r from-primary via-secondary to-accent bg-clip-text text-transparent">
              one detail at a time.
            </span>
          </h1>
          <p className="mt-6 max-w-xl mx-auto text-muted-foreground text-lg">
            Custom photo frames, themed magazines, silk scrunchies, gift bouquets & baskets — all personalized just for you.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link to="/shop"><button className="btn-gold">Shop the garden →</button></Link>
          </div>
        </div>
      </section>

      {/* Featured */}
      <section className="max-w-6xl mx-auto px-4 py-12">
        <h2 className="text-3xl font-display font-bold mb-8">Featured creations</h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {products?.map((p) => (
            <article key={p.id} className="whimsy-card overflow-hidden flex flex-col">
              <img src={p.sample_image_url ?? ""} alt={p.name} className="w-full aspect-square object-cover" />
              <div className="p-5 flex-1 flex flex-col">
                <div className="text-xs font-semibold text-primary uppercase tracking-wide">{p.category}</div>
                <h3 className="font-display text-xl mt-1">{p.name}</h3>
                <p className="text-sm text-muted-foreground mt-1 flex-1">{p.description}</p>
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
      </section>

      {/* How it works */}
      <section className="max-w-6xl mx-auto px-4 py-20">
        <h2 className="text-3xl font-display font-bold text-center mb-12">How it works</h2>
        <div className="grid md:grid-cols-3 gap-6">
          {[
            { icon: Heart, title: "1. Select", desc: "Choose a gift that speaks to your heart." },
            { icon: Sparkles, title: "2. Customize", desc: "Pick sizes, colors, designs & upload photos." },
            { icon: Package, title: "3. Checkout", desc: "We craft, pack and ship with love." },
          ].map(({ icon: Icon, title, desc }) => (
            <div key={title} className="whimsy-card p-6 text-center">
              <div className="w-12 h-12 mx-auto rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
                <Icon className="w-6 h-6 text-foreground" />
              </div>
              <h3 className="font-display text-xl mt-4">{title}</h3>
              <p className="text-sm text-muted-foreground mt-2">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <CustomizerDialog product={active} open={open} onOpenChange={setOpen} />
    </div>
  );
}
