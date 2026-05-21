import { useCart } from "@/lib/cart-store";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";
import { Link } from "@tanstack/react-router";

export function CartDrawer() {
  const { items, isOpen, close, remove, total } = useCart();
  return (
    <Sheet open={isOpen} onOpenChange={(v) => (v ? null : close())}>
      <SheetContent className="w-full sm:max-w-md flex flex-col">
        <SheetHeader>
          <SheetTitle className="font-display text-2xl">Your Cart</SheetTitle>
        </SheetHeader>
        <div className="flex-1 overflow-y-auto py-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center text-muted-foreground py-20">
              Your cart is empty. <br />Let's add some magic ✨
            </div>
          )}
          {items.map((item) => (
            <div key={item.id} className="flex gap-3 p-3 rounded-2xl bg-card border border-border">
              {item.previewImage && (
                <img src={item.previewImage} alt={item.productName} className="w-16 h-16 rounded-lg object-cover" />
              )}
              <div className="flex-1 min-w-0">
                <div className="font-semibold truncate">{item.productName}</div>
                <div className="text-xs text-muted-foreground space-y-0.5 mt-1">
                  {Object.entries(item.customization).map(([k, v]) => (
                    <div key={k} className="truncate">
                      <span className="capitalize">{k}:</span>{" "}
                      <span className="font-medium">{Array.isArray(v) ? v.join(", ") : String(v)}</span>
                    </div>
                  ))}
                  {item.uploadedImagePath && (
                    <a href={item.uploadedImagePath} target="_blank" rel="noreferrer" className="text-primary underline">
                      Uploaded photo
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-sm">Qty: {item.quantity}</span>
                  <span className="font-semibold">${(item.unitPrice * item.quantity).toFixed(2)}</span>
                </div>
              </div>
              <button onClick={() => remove(item.id)} className="text-muted-foreground hover:text-destructive">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
        {items.length > 0 && (
          <div className="border-t border-border pt-4 space-y-3">
            <div className="flex justify-between font-semibold text-lg">
              <span>Total</span>
              <span>${total().toFixed(2)}</span>
            </div>
            <Link to="/checkout" onClick={close} className="block">
              <Button className="btn-gold w-full">Checkout</Button>
            </Link>
          </div>
        )}
      </SheetContent>
    </Sheet>
  );
}
