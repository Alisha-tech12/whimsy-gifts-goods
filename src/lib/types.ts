export type OptionWithImage = { name: string; sample_image?: string; price?: number };

export type SizeOption = string | { name: string; price?: number };

export type AddonOption = string | { name: string; price?: number };

export type CustomOptions = {
  sizes?: SizeOption[];
  designs?: OptionWithImage[];
  colors?: OptionWithImage[];
  themes?: OptionWithImage[];
  addons?: AddonOption[];
  engravable?: boolean;
  requires_upload?: boolean;
  multi_upload?: boolean;
  max_uploads?: number;
  note?: boolean;
};

export function sizeName(s: SizeOption): string {
  return typeof s === "string" ? s : s.name;
}
export function sizePrice(s: SizeOption | null | undefined): number | undefined {
  if (!s || typeof s === "string") return undefined;
  return s.price;
}
export function addonName(a: AddonOption): string {
  return typeof a === "string" ? a : a.name;
}
export function addonPrice(a: AddonOption): number {
  return typeof a === "string" ? 0 : a.price ?? 0;
}

export type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string;
  base_price: number;
  sample_image_url: string | null;
  custom_options: CustomOptions;
  active: boolean;
};
