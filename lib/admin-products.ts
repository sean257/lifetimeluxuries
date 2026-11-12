import "server-only";
import { z } from "zod";
import type { createClient } from "@/lib/supabase/server";
import { createPublicClient } from "@/lib/supabase/public";
import { PRODUCT_COLUMNS, imageUrl, productRow } from "@/lib/shop";
import type { Product } from "@/lib/types";

type Supabase = Awaited<ReturnType<typeof createClient>>;

export type AdminProduct = Product & { is_published: boolean };

const adminRow = productRow.extend({ is_published: z.boolean() });
const COLUMNS = PRODUCT_COLUMNS.replace("sort_order,", "sort_order, is_published,");

function parse(raw: unknown, pub: ReturnType<typeof createPublicClient>): AdminProduct {
  const { product_images, ...row } = adminRow.parse(raw);
  const images = [...product_images]
    .sort((a, b) => a.position - b.position)
    .map((img) => ({ ...img, url: imageUrl(img.storage_path, pub) }));
  return { ...row, images };
}

/** Every product, published or not (admin session; RLS allows admins all rows). */
export async function listAdminProducts(supabase: Supabase): Promise<AdminProduct[]> {
  const { data, error } = await supabase.from("products").select(COLUMNS).order("sort_order").order("name");
  if (error) throw new Error(`Could not load products: ${error.message}`);
  const pub = createPublicClient();
  return (data ?? []).map((r) => parse(r, pub));
}

export async function getAdminProduct(supabase: Supabase, id: string): Promise<AdminProduct | null> {
  if (!z.uuid().safeParse(id).success) return null;
  const { data, error } = await supabase.from("products").select(COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error(`Could not load product: ${error.message}`);
  return data ? parse(data, createPublicClient()) : null;
}
