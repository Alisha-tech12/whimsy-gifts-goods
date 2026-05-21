export type OptionWithImage = { name: string; sample_image?: string };

export type CustomOptions = {
  sizes?: string[];
  designs?: OptionWithImage[];
  colors?: OptionWithImage[];
  themes?: OptionWithImage[];
  addons?: string[];
  engravable?: boolean;
  requires_upload?: boolean;
  note?: boolean;
};

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
