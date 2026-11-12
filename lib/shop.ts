import "server-only";
import { cache } from "react";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import type { Category, Product } from "@/lib/types";

export const BUCKET = "product-images";

export const PRODUCT_COLUMNS =
  "id, slug, name, category, subtitle, description, specs, price, stock, badge, is_featured, sort_order, " +
  "product_images ( id, storage_path, alt, position, width, height )";

export const imageRow = z.object({
  id: z.string(),
  storage_path: z.string(),
  alt: z.string().nullable(),
  position: z.number(),
  width: z.number().nullable(),
  height: z.number().nullable(),
});

export const productRow = z.object({
  id: z.string(),
  slug: z.string(),
  name: z.string(),
  category: z.enum(["watch", "accessory"]),
  subtitle: z.string().nullable(),
  description: z.string().nullable(),
  specs: z
    .array(z.object({ label: z.coerce.string(), value: z.coerce.string() }))
    .catch([]),
  price: z.coerce.number(),
  stock: z.number().int(),
  badge: z.string().nullable(),
  is_featured: z.boolean(),
  sort_order: z.number(),
  product_images: z.array(imageRow).default([]),
});

/** Public URL of a photo in the product-images bucket. */
export function imageUrl(path: string, supabase = createPublicClient()): string {
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
}

function toProduct(raw: unknown, supabase: ReturnType<typeof createPublicClient>): Product {
  const { product_images, ...row } = productRow.parse(raw);
  const images = [...product_images]
    .sort((a, b) => a.position - b.position)
    .map((img) => ({ ...img, url: imageUrl(img.storage_path, supabase) }));
  return { ...row, images };
}

/** Published products in shop order, optionally for one category. */
export const getProducts = cache(async (category?: Category): Promise<Product[]> => {
  const supabase = createPublicClient();
  let query = supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_published", true)
    .order("sort_order")
    .order("name");
  if (category) query = query.eq("category", category);
  const { data, error } = await query;
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data ?? []).map((r) => toProduct(r, supabase));
});

export const getProductBySlug = cache(async (slug: string): Promise<Product | null> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_published", true)
    .eq("slug", slug)
    .maybeSingle();
  if (error) throw new Error(`Could not load product: ${error.message}`);
  return data ? toProduct(data, supabase) : null;
});

/** The hero product: the featured one, else the first in shop order. */
export const getFeaturedProduct = cache(async (): Promise<Product | null> => {
  const products = await getProducts();
  return products.find((p) => p.is_featured) ?? products[0] ?? null;
});

/** Shop's WhatsApp number (international format, digits only). */
export const getWhatsAppNumber = cache(async (): Promise<string> => {
  const supabase = createPublicClient();
  const { data, error } = await supabase.from("settings").select("whatsapp_number").maybeSingle();
  if (error) throw new Error(`Could not load settings: ${error.message}`);
  return data?.whatsapp_number ?? "263770000000";
});

/** Current published details for the products in a bag (prices are never trusted from the browser). */
export async function getProductsByIds(ids: string[]): Promise<Product[]> {
  if (!ids.length) return [];
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("products")
    .select(PRODUCT_COLUMNS)
    .eq("is_published", true)
    .in("id", ids);
  if (error) throw new Error(`Could not load products: ${error.message}`);
  return (data ?? []).map((r) => toProduct(r, supabase));
}

export type DeliveryOption = { code: string; label: string; fee: number };

const deliveryRow = z.object({ code: z.string(), label: z.string(), fee: z.coerce.number() });

export async function getDeliveryOptions(): Promise<DeliveryOption[]> {
  const supabase = createPublicClient();
  const { data, error } = await supabase
    .from("delivery_options")
    .select("code, label, fee")
    .eq("is_active", true)
    .order("sort_order");
  if (error) throw new Error(`Could not load delivery options: ${error.message}`);
  return z.array(deliveryRow).parse(data ?? []);
}
