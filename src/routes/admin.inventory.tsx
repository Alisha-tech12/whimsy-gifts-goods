import { createFileRoute } from "@tanstack/react-router";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Edit, Plus, Trash2 } from "lucide-react";
import type { Product } from "@/lib/types";

export const Route = createFileRoute("/admin/inventory")({ component: AdminInventory });

function AdminInventory() {
  const qc = useQueryClient();
  const { data: products } = useQuery({
    queryKey: ["admin", "products"],
    queryFn: async () => {
      const { data, error } = await supabase.from("products").select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as unknown as Product[];
    },
  });

  const [editing, setEditing] = useState<Product | null>(null);
  const [open, setOpen] = useState(false);

  async function del(id: string) {
    if (!confirm("Delete this product?")) return;
    const { error } = await supabase.from("products").delete().eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success("Deleted"); qc.invalidateQueries({ queryKey: ["admin", "products"] }); }
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-display font-bold">Inventory</h2>
        <Button onClick={() => { setEditing(null); setOpen(true); }} className="btn-gold"><Plus className="w-4 h-4 mr-1" /> New product</Button>
      </div>
      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {products?.map((p) => (
          <div key={p.id} className="whimsy-card p-4 flex gap-3">
            <img src={p.sample_image_url ?? ""} alt={p.name} className="w-20 h-20 rounded-lg object-cover" />
            <div className="flex-1">
              <div className="text-xs text-primary font-semibold uppercase">{p.category}</div>
              <div className="font-semibold">{p.name}</div>
              <div className="text-sm">${Number(p.base_price).toFixed(2)}</div>
              <div className="flex gap-2 mt-2">
                <button onClick={() => { setEditing(p); setOpen(true); }} className="text-xs px-2 py-1 rounded bg-muted hover:bg-muted/70 inline-flex items-center gap-1"><Edit className="w-3 h-3" /> Edit</button>
                <button onClick={() => del(p.id)} className="text-xs px-2 py-1 rounded bg-muted hover:bg-destructive hover:text-destructive-foreground inline-flex items-center gap-1"><Trash2 className="w-3 h-3" /> Delete</button>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ProductEditor open={open} onOpenChange={setOpen} product={editing} onSaved={() => qc.invalidateQueries({ queryKey: ["admin", "products"] })} />
    </div>
  );
}

function ProductEditor({
  open, onOpenChange, product, onSaved,
}: { open: boolean; onOpenChange: (v: boolean) => void; product: Product | null; onSaved: () => void }) {
  const [form, setForm] = useState(() => ({
    name: product?.name ?? "",
    description: product?.description ?? "",
    category: product?.category ?? "Frame",
    base_price: product?.base_price ?? 0,
    sample_image_url: product?.sample_image_url ?? "",
    custom_options: JSON.stringify(product?.custom_options ?? {}, null, 2),
  }));
  const [busy, setBusy] = useState(false);

  // reset state when dialog opens with new product
  useState(() => {
    setForm({
      name: product?.name ?? "",
      description: product?.description ?? "",
      category: product?.category ?? "Frame",
      base_price: product?.base_price ?? 0,
      sample_image_url: product?.sample_image_url ?? "",
      custom_options: JSON.stringify(product?.custom_options ?? {}, null, 2),
    });
  });

  async function save() {
    let parsedOptions: any;
    try {
      parsedOptions = JSON.parse(form.custom_options || "{}");
    } catch {
      toast.error("Custom options must be valid JSON");
      return;
    }
    setBusy(true);
    const payload = {
      name: form.name,
      description: form.description,
      category: form.category,
      base_price: Number(form.base_price),
      sample_image_url: form.sample_image_url,
      custom_options: parsedOptions,
    };
    const { error } = product
      ? await supabase.from("products").update(payload).eq("id", product.id)
      : await supabase.from("products").insert(payload);
    setBusy(false);
    if (error) toast.error(error.message);
    else { toast.success("Saved!"); onSaved(); onOpenChange(false); }
  }

  async function uploadSample(file: File) {
    const name = `${crypto.randomUUID()}.${file.name.split(".").pop()}`;
    const { error } = await supabase.storage.from("product_samples").upload(name, file);
    if (error) return toast.error(error.message);
    const { data } = supabase.storage.from("product_samples").getPublicUrl(name);
    setForm((f) => ({ ...f, sample_image_url: data.publicUrl }));
    toast.success("Sample uploaded");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader><DialogTitle>{product ? "Edit" : "New"} product</DialogTitle></DialogHeader>
        <div className="space-y-3">
          <div><Label>Name</Label><Input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} /></div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <Label>Category</Label>
              <Input value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })} placeholder="Frame / Scrunchie / Bouquet / Magazine / Arm Cuff / Basket" />
            </div>
            <div><Label>Base price</Label><Input type="number" step="0.01" value={form.base_price} onChange={(e) => setForm({ ...form, base_price: parseFloat(e.target.value) })} /></div>
          </div>
          <div><Label>Description</Label><Textarea value={form.description ?? ""} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
          <div>
            <Label>Sample image URL</Label>
            <Input value={form.sample_image_url} onChange={(e) => setForm({ ...form, sample_image_url: e.target.value })} placeholder="https://… or upload below" />
            <input type="file" accept="image/*" className="mt-2 text-sm" onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadSample(f); }} />
            {form.sample_image_url && <img src={form.sample_image_url} alt="" className="mt-2 w-32 h-32 rounded-lg object-cover border border-border" />}
          </div>
          <div>
            <Label>Custom options (JSON)</Label>
            <Textarea value={form.custom_options} onChange={(e) => setForm({ ...form, custom_options: e.target.value })} rows={10} className="font-mono text-xs" />
            <p className="text-xs text-muted-foreground mt-1">
              Schema: <code>{`{ sizes:[], designs:[{name,sample_image}], colors:[{name,sample_image}], themes:[{name,sample_image}], addons:[], engravable:bool, requires_upload:bool, note:bool }`}</code>
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button onClick={save} disabled={busy} className="btn-gold">{busy ? "Saving…" : "Save"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
