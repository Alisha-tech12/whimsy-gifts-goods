import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useState } from "react";
import { Upload } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-store";
import type { Product, OptionWithImage } from "@/lib/types";

export function CustomizerDialog({
  product,
  open,
  onOpenChange,
}: {
  product: Product | null;
  open: boolean;
  onOpenChange: (v: boolean) => void;
}) {
  if (!product) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-display text-2xl">Customize · {product.name}</DialogTitle>
        </DialogHeader>
        <CustomizerBody product={product} onDone={() => onOpenChange(false)} />
      </DialogContent>
    </Dialog>
  );
}

function CustomizerBody({ product, onDone }: { product: Product; onDone: () => void }) {
  const opts = product.custom_options ?? {};
  const isFrameLike = !!opts.designs;
  const hasColors = !!opts.colors;
  const hasThemes = !!opts.themes;
  const requiresUpload = !!opts.requires_upload;

  const [size, setSize] = useState<string>(opts.sizes?.[0] ?? "");
  const [design, setDesign] = useState<OptionWithImage | null>(opts.designs?.[0] ?? null);
  const [color, setColor] = useState<OptionWithImage | null>(opts.colors?.[0] ?? null);
  const [theme, setTheme] = useState<OptionWithImage | null>(opts.themes?.[0] ?? null);
  const [addons, setAddons] = useState<string[]>([]);
  const [note, setNote] = useState("");
  const [engraving, setEngraving] = useState("");
  const [uploading, setUploading] = useState(false);
  const [uploadedUrl, setUploadedUrl] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);

  const add = useCart((s) => s.add);

  async function handleUpload(file: File) {
    setUploading(true);
    try {
      const ext = file.name.split(".").pop();
      const name = `${crypto.randomUUID()}.${ext}`;
      const { error } = await supabase.storage.from("customer_uploads").upload(name, file, {
        cacheControl: "3600",
        upsert: false,
      });
      if (error) throw error;
      const { data } = supabase.storage.from("customer_uploads").getPublicUrl(name);
      setUploadedUrl(data.publicUrl);
      toast.success("Photo uploaded!");
    } catch (e: any) {
      toast.error(e.message ?? "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleAdd() {
    if (requiresUpload && !uploadedUrl) {
      toast.error("Please upload a photo first");
      return;
    }
    const customization: Record<string, any> = {};
    if (size) customization.size = size;
    if (design) customization.design = design.name;
    if (color) customization.color = color.name;
    if (theme) customization.theme = theme.name;
    if (addons.length) customization.addons = addons;
    if (note) customization.note = note;
    if (engraving) customization.engraving = engraving;

    add({
      productId: product.id,
      productName: product.name,
      category: product.category,
      unitPrice: product.base_price,
      quantity,
      customization,
      uploadedImagePath: uploadedUrl ?? undefined,
      previewImage: design?.sample_image ?? color?.sample_image ?? theme?.sample_image ?? product.sample_image_url ?? undefined,
    });
    toast.success("Added to cart!");
    onDone();
  }

  return (
    <div className="space-y-5">
      {/* Live preview */}
      <div className="bg-muted rounded-2xl p-4 flex items-center justify-center min-h-[200px] relative overflow-hidden">
        {isFrameLike && design ? (
          <div className="relative w-56 h-56">
            <img src={design.sample_image} alt={design.name} className="absolute inset-0 w-full h-full object-cover rounded-lg" />
            {uploadedUrl && (
              <img src={uploadedUrl} alt="Your upload" className="absolute inset-6 w-44 h-44 object-cover rounded shadow-lg" />
            )}
          </div>
        ) : (
          <img
            src={color?.sample_image ?? theme?.sample_image ?? product.sample_image_url ?? ""}
            alt="Preview"
            className="max-h-48 rounded-xl object-cover"
          />
        )}
      </div>

      {opts.sizes && (
        <div>
          <Label>Size</Label>
          <Select value={size} onValueChange={setSize}>
            <SelectTrigger className="mt-1.5"><SelectValue /></SelectTrigger>
            <SelectContent>
              {opts.sizes.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      )}

      {opts.designs && (
        <div>
          <Label>Design</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            {opts.designs.map((d) => (
              <button
                key={d.name}
                type="button"
                onClick={() => setDesign(d)}
                className={`rounded-xl overflow-hidden border-2 transition ${design?.name === d.name ? "border-primary shadow-lg" : "border-transparent hover:border-border"}`}
              >
                <img src={d.sample_image} alt={d.name} className="w-full h-20 object-cover" />
                <div className="text-xs py-1.5 font-medium">{d.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {hasColors && (
        <div>
          <Label>Color</Label>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mt-2">
            {opts.colors!.map((c) => (
              <button
                key={c.name}
                type="button"
                onClick={() => setColor(c)}
                className={`rounded-xl overflow-hidden border-2 transition ${color?.name === c.name ? "border-primary shadow-lg" : "border-transparent hover:border-border"}`}
              >
                <img src={c.sample_image} alt={c.name} className="w-full h-20 object-cover" />
                <div className="text-xs py-1.5 font-medium">{c.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {hasThemes && (
        <div>
          <Label>Theme</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-2">
            {opts.themes!.map((t) => (
              <button
                key={t.name}
                type="button"
                onClick={() => setTheme(t)}
                className={`rounded-xl overflow-hidden border-2 transition ${theme?.name === t.name ? "border-primary shadow-lg" : "border-transparent hover:border-border"}`}
              >
                <img src={t.sample_image} alt={t.name} className="w-full h-20 object-cover" />
                <div className="text-xs py-1.5 font-medium">{t.name}</div>
              </button>
            ))}
          </div>
        </div>
      )}

      {opts.addons && (
        <div>
          <Label>Add-ons</Label>
          <div className="grid grid-cols-2 gap-2 mt-2">
            {opts.addons.map((a) => (
              <label key={a} className="flex items-center gap-2 p-2 rounded-lg bg-muted/60 cursor-pointer">
                <Checkbox
                  checked={addons.includes(a)}
                  onCheckedChange={(v) =>
                    setAddons((prev) => (v ? [...prev, a] : prev.filter((x) => x !== a)))
                  }
                />
                <span className="text-sm">{a}</span>
              </label>
            ))}
          </div>
        </div>
      )}

      {requiresUpload && (
        <div>
          <Label>Upload your photo</Label>
          <label className="mt-1.5 flex flex-col items-center justify-center w-full h-28 border-2 border-dashed border-border rounded-xl cursor-pointer hover:bg-muted/60 transition">
            <Upload className="w-6 h-6 mb-1 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {uploading ? "Uploading…" : uploadedUrl ? "Photo uploaded ✓ (click to replace)" : "Click to upload (JPG/PNG)"}
            </span>
            <input
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleUpload(f);
              }}
            />
          </label>
        </div>
      )}

      {opts.engravable && (
        <div>
          <Label>Engraving / Message on back (optional)</Label>
          <Input value={engraving} onChange={(e) => setEngraving(e.target.value)} maxLength={120} placeholder="e.g., Forever ours · 2024" className="mt-1.5" />
        </div>
      )}

      {opts.note && (
        <div>
          <Label>Personalized note (optional)</Label>
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} maxLength={300} placeholder="Wishing you all the joy in the world…" className="mt-1.5" />
        </div>
      )}

      <div>
        <Label>Quantity</Label>
        <Input type="number" min={1} max={20} value={quantity} onChange={(e) => setQuantity(parseInt(e.target.value) || 1)} className="mt-1.5 w-24" />
      </div>

      <DialogFooter>
        <div className="flex w-full items-center justify-between">
          <div className="font-semibold text-lg">${(product.base_price * quantity).toFixed(2)}</div>
          <Button onClick={handleAdd} className="btn-gold">Add to Cart</Button>
        </div>
      </DialogFooter>
    </div>
  );
}
