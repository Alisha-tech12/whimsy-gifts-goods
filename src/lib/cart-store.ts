import { create } from "zustand";
import { persist } from "zustand/middleware";

export type CartItem = {
  id: string; // local cart id
  productId: string;
  productName: string;
  category: string;
  unitPrice: number;
  quantity: number;
  customization: Record<string, any>;
  uploadedImagePath?: string;
  previewImage?: string;
};

type CartState = {
  items: CartItem[];
  isOpen: boolean;
  add: (item: Omit<CartItem, "id">) => void;
  remove: (id: string) => void;
  clear: () => void;
  setQty: (id: string, qty: number) => void;
  open: () => void;
  close: () => void;
  toggle: () => void;
  total: () => number;
};

export const useCart = create<CartState>()(
  persist(
    (set, get) => ({
      items: [],
      isOpen: false,
      add: (item) =>
        set((s) => ({
          items: [...s.items, { ...item, id: crypto.randomUUID() }],
          isOpen: true,
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
      setQty: (id, qty) =>
        set((s) => ({
          items: s.items.map((i) => (i.id === id ? { ...i, quantity: Math.max(1, qty) } : i)),
        })),
      open: () => set({ isOpen: true }),
      close: () => set({ isOpen: false }),
      toggle: () => set((s) => ({ isOpen: !s.isOpen })),
      total: () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
    }),
    { name: "whimsycraft-cart", partialize: (s) => ({ items: s.items }) },
  ),
);
