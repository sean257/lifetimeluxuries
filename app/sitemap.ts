import type { MetadataRoute } from "next";
import { createPublicClient } from "@/lib/supabase/public";
import { absoluteUrl } from "@/lib/seo";

export const revalidate = 3600;

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = createPublicClient();
  const { data } = await supabase
    .from("products")
    .select("slug, updated_at")
    .eq("is_published", true)
    .order("sort_order");
  const products = data ?? [];
  const latest = products.reduce<string | undefined>((m, p) => (!m || p.updated_at > m ? p.updated_at : m), undefined);
  const lastModified = latest ? new Date(latest) : new Date();

  return [
    { url: absoluteUrl("/"), lastModified, changeFrequency: "weekly", priority: 1 },
    { url: absoluteUrl("/watches"), lastModified, changeFrequency: "weekly", priority: 0.8 },
    { url: absoluteUrl("/accessories"), lastModified, changeFrequency: "weekly", priority: 0.8 },
    ...products.map((p) => ({
      url: absoluteUrl(`/product/${p.slug}`),
      lastModified: new Date(p.updated_at),
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
}
