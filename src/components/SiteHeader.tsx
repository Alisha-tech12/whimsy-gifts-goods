import { Link } from "@tanstack/react-router";
import { ShoppingBag, Flower2 } from "lucide-react";
import { useCart } from "@/lib/cart-store";

export function SiteHeader() {
  const { items, toggle } = useCart();
  const count = items.reduce((s, i) => s + i.quantity, 0);
  return (
    <header className="sticky top-0 z-40 backdrop-blur-md bg-background/70 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 py-3 flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2 group">
          <Flower2 className="w-7 h-7 text-primary group-hover:rotate-12 transition-transform" />
          <span className="font-display text-2xl font-bold tracking-tight">
            Whimsy<span className="text-primary">Craft</span>
          </span>
        </Link>
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link to="/" className="hover:text-primary [&.active]:text-primary">Home</Link>
          <Link to="/shop" className="hover:text-primary [&.active]:text-primary">Shop</Link>
          <Link to="/track-order" className="hover:text-primary [&.active]:text-primary">Track Order</Link>
          <Link to="/admin" className="hover:text-primary [&.active]:text-primary">Admin</Link>
        </nav>
        <button
          onClick={toggle}
          className="relative px-4 py-2 rounded-full bg-accent hover:bg-accent/80 transition flex items-center gap-2"
          aria-label="Open cart"
        >
          <ShoppingBag className="w-4 h-4" />
          <span className="text-sm font-semibold">Cart</span>
          {count > 0 && (
            <span className="absolute -top-1 -right-1 bg-primary text-primary-foreground text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold">
              {count}
            </span>
          )}
        </button>
      </div>
    </header>
  );
}

export function SiteFooter() {
  return (
    <footer className="mt-24 py-12 border-t border-border bg-card/40">
      <div className="max-w-6xl mx-auto px-4 grid md:grid-cols-3 gap-8 text-sm">
        <div>
          <div className="font-display text-xl font-bold mb-2">WhimsyCraft</div>
          <p className="text-muted-foreground">
            Capture the magic, one detail at a time. Handmade gifts made with love.
          </p>
        </div>
        <div>
          <div className="font-semibold mb-2">Contact</div>
          <p className="text-muted-foreground">hello@whimsycraft.shop</p>
          <p className="text-muted-foreground">+1 (555) 010-2024</p>
        </div>
        <div>
          <div className="font-semibold mb-2">Help</div>
          <p><Link to="/track-order" className="text-muted-foreground hover:text-primary">Track your order</Link></p>
          <p className="text-muted-foreground mt-1">Instagram · Pinterest · TikTok</p>
        </div>
      </div>
      <div className="text-center text-xs text-muted-foreground mt-8">
        © {new Date().getFullYear()} WhimsyCraft. All petals reserved.
      </div>
    </footer>
  );
}
