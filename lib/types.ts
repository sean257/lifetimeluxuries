export type Category = "watch" | "accessory";

export type ProductImage = {
  id: string;
  storage_path: string;
  alt: string | null;
  position: number;
  width: number | null;
  height: number | null;
  url: string;
};

export type Spec = { label: string; value: string };

export type Product = {
  id: string;
  slug: string;
  name: string;
  category: Category;
  subtitle: string | null;
  description: string | null;
  specs: Spec[];
  price: number;
  stock: number;
  badge: string | null;
  is_featured: boolean;
  sort_order: number;
  images: ProductImage[];
};

export const CATEGORY_LABEL: Record<Category, string> = { watch: "Watch", accessory: "Accessory" };

/** Just what a grid card needs (keeps the page payload small). */
export type CardProduct = Pick<Product, "id" | "slug" | "name" | "category" | "subtitle" | "price" | "stock" | "badge" | "sort_order"> & {
  images: Product["images"];
};

export function toCard(p: Product): CardProduct {
  return {
    id: p.id,
    slug: p.slug,
    name: p.name,
    category: p.category,
    subtitle: p.subtitle,
    price: p.price,
    stock: p.stock,
    badge: p.badge,
    sort_order: p.sort_order,
    images: p.images.slice(0, 1),
  };
}
