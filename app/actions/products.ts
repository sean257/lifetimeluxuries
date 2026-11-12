"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { getAdmin } from "@/lib/admin";
import { BUCKET } from "@/lib/shop";
import { MAX_PHOTOS, productInputSchema, type ProductField } from "@/lib/product-schema";

export type SaveResult =
  | { ok: true; id: string; message: string }
  | { ok: false; error: string; fieldErrors?: Partial<Record<ProductField, string>> };
export type SimpleResult = { ok: true; message?: string } | { ok: false; error: string };

const SESSION_ENDED = "Your session has ended. Sign in again.";
const uuid = z.uuid();

/** Shop pages are static; refresh them after any catalogue change. */
function revalidateShop() {
  revalidatePath("/", "layout");
}

async function clearOtherFeatured(supabase: NonNullable<Awaited<ReturnType<typeof getAdmin>>>["supabase"], keepId: string) {
  return supabase.from("products").update({ is_featured: false }).eq("is_featured", true).neq("id", keepId);
}

export async function saveProduct(rawId: unknown, rawInput: unknown): Promise<SaveResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SESSION_ENDED };
  const id = rawId === null ? null : uuid.safeParse(rawId).success ? (rawId as string) : undefined;
  if (id === undefined) return { ok: false, error: "This product no longer exists." };

  const parsed = productInputSchema.safeParse(rawInput);
  if (!parsed.success) {
    const fieldErrors: Partial<Record<ProductField, string>> = {};
    for (const issue of parsed.error.issues) {
      const key = issue.path[0] as ProductField;
      fieldErrors[key] ??= issue.message;
    }
    return { ok: false, error: "Check the highlighted fields.", fieldErrors };
  }
  const values = parsed.data;
  const { supabase } = admin;

  let savedId: string;
  if (id) {
    const { data, error } = await supabase.from("products").update(values).eq("id", id).select("id").maybeSingle();
    if (error) return dbError(error);
    if (!data) return { ok: false, error: "This product no longer exists." };
    savedId = data.id;
  } else {
    const { data: last } = await supabase
      .from("products")
      .select("sort_order")
      .order("sort_order", { ascending: false })
      .limit(1)
      .maybeSingle();
    const { data, error } = await supabase
      .from("products")
      .insert({ ...values, sort_order: (last?.sort_order ?? 0) + 1 })
      .select("id")
      .single();
    if (error) return dbError(error);
    savedId = data.id;
  }

  if (values.is_featured) {
    const { error } = await clearOtherFeatured(supabase, savedId);
    if (error) console.error("clear featured failed", error);
  }

  revalidateShop();
  revalidatePath("/admin/products");
  return { ok: true, id: savedId, message: id ? "Product saved" : "Product created. You can add photos now." };
}

function dbError(error: { code?: string; message: string }): SaveResult {
  if (error.code === "23505") {
    return {
      ok: false,
      error: "Check the highlighted fields.",
      fieldErrors: { slug: "Another product already uses this web address. Change it." },
    };
  }
  console.error("product save failed", error);
  return { ok: false, error: "Couldn't save the product. Try again." };
}

/** Removes every photo object under <productId>/ in storage. */
async function removeProductFolder(supabase: NonNullable<Awaited<ReturnType<typeof getAdmin>>>["supabase"], productId: string) {
  const { data: files, error } = await supabase.storage.from(BUCKET).list(productId, { limit: 1000 });
  if (error) return error;
  if (!files?.length) return null;
  const { error: rmError } = await supabase.storage.from(BUCKET).remove(files.map((f) => `${productId}/${f.name}`));
  return rmError;
}

export async function deleteProduct(rawId: unknown): Promise<SimpleResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SESSION_ENDED };
  const parsed = uuid.safeParse(rawId);
  if (!parsed.success) return { ok: false, error: "This product no longer exists." };

  const storageError = await removeProductFolder(admin.supabase, parsed.data);
  if (storageError) {
    console.error("delete product photos failed", storageError);
    return { ok: false, error: "Couldn't delete the product's photos. Try again." };
  }
  // product_images rows cascade; past orders keep their snapshot of the name and price.
  const { error } = await admin.supabase.from("products").delete().eq("id", parsed.data);
  if (error) {
    console.error("delete product failed", error);
    return { ok: false, error: "Couldn't delete the product. Try again." };
  }
  revalidateShop();
  revalidatePath("/admin/products");
  redirect("/admin/products?deleted=1");
}

export async function setPublished(rawId: unknown, rawValue: unknown): Promise<SimpleResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SESSION_ENDED };
  const parsed = z.object({ id: uuid, value: z.boolean() }).safeParse({ id: rawId, value: rawValue });
  if (!parsed.success) return { ok: false, error: "Couldn't change that. Reload and try again." };
  const { error } = await admin.supabase.from("products").update({ is_published: parsed.data.value }).eq("id", parsed.data.id);
  if (error) return { ok: false, error: "Couldn't change that. Try again." };
  revalidateShop();
  revalidatePath("/admin/products");
  return { ok: true, message: parsed.data.value ? "Shown in the shop" : "Hidden from the shop" };
}

/** Saves a new shop order: ids in the order they should appear. */
export async function reorderProducts(rawIds: unknown): Promise<SimpleResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SESSION_ENDED };
  const parsed = z.array(uuid).min(1).max(1000).safeParse(rawIds);
  if (!parsed.success || new Set(parsed.data).size !== parsed.data.length) {
    return { ok: false, error: "Couldn't save the order. Reload and try again." };
  }
  const results = await Promise.all(
    parsed.data.map((id, i) => admin.supabase.from("products").update({ sort_order: i + 1 }).eq("id", id)),
  );
  if (results.some((r) => r.error)) return { ok: false, error: "Couldn't save the new order. Try again." };
  revalidateShop();
  revalidatePath("/admin/products");
  return { ok: true };
}

/* ---------------- photos ---------------- */

const PATH_RE = /^[0-9a-f-]{36}\/[0-9a-f-]{36}\.(webp|jpg)$/;

export async function addProductImage(raw: unknown): Promise<SimpleResult & { image?: { id: string; position: number } }> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SESSION_ENDED };
  const parsed = z
    .object({
      productId: uuid,
      path: z.string().regex(PATH_RE),
      width: z.number().int().min(1).max(10000),
      height: z.number().int().min(1).max(10000),
      alt: z.string().trim().max(200).optional(),
    })
    .safeParse(raw);
  if (!parsed.success || !parsed.data.path.startsWith(`${parsed.data.productId}/`)) {
    return { ok: false, error: "That upload doesn't belong to this product." };
  }
  const { productId, path, width, height, alt } = parsed.data;
  const { supabase } = admin;

  const { data: existing, error: countError } = await supabase
    .from("product_images")
    .select("position")
    .eq("product_id", productId)
    .order("position", { ascending: false });
  if (countError) return { ok: false, error: "Couldn't save the photo. Try again." };
  if ((existing?.length ?? 0) >= MAX_PHOTOS) return { ok: false, error: `A product can have up to ${MAX_PHOTOS} photos.` };

  const position = (existing?.[0]?.position ?? -1) + 1;
  const { data, error } = await supabase
    .from("product_images")
    .insert({ product_id: productId, storage_path: path, width, height, position, alt: alt || null })
    .select("id, position")
    .single();
  if (error) {
    console.error("insert product image failed", error);
    return { ok: false, error: "Couldn't save the photo. Try again." };
  }
  revalidateShop();
  return { ok: true, image: data };
}

export async function deleteProductImage(rawId: unknown): Promise<SimpleResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SESSION_ENDED };
  const parsed = uuid.safeParse(rawId);
  if (!parsed.success) return { ok: false, error: "That photo no longer exists." };
  const { supabase } = admin;

  const { data: img, error } = await supabase
    .from("product_images")
    .select("id, product_id, storage_path")
    .eq("id", parsed.data)
    .maybeSingle();
  if (error || !img) return { ok: false, error: "That photo no longer exists." };

  const { error: rmError } = await supabase.storage.from(BUCKET).remove([img.storage_path]);
  if (rmError) return { ok: false, error: "Couldn't delete the photo file. Try again." };
  const { error: delError } = await supabase.from("product_images").delete().eq("id", img.id);
  if (delError) return { ok: false, error: "Couldn't delete the photo. Try again." };

  // Close the gap so the first remaining photo becomes the main one.
  const { data: rest } = await supabase
    .from("product_images")
    .select("id")
    .eq("product_id", img.product_id)
    .order("position");
  await Promise.all((rest ?? []).map((r, i) => supabase.from("product_images").update({ position: i }).eq("id", r.id)));

  revalidateShop();
  return { ok: true, message: "Photo deleted" };
}

export async function reorderProductImages(rawProductId: unknown, rawIds: unknown): Promise<SimpleResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SESSION_ENDED };
  const parsed = z
    .object({ productId: uuid, ids: z.array(uuid).min(1).max(MAX_PHOTOS) })
    .safeParse({ productId: rawProductId, ids: rawIds });
  if (!parsed.success) return { ok: false, error: "Couldn't save the photo order. Reload and try again." };
  const results = await Promise.all(
    parsed.data.ids.map((id, i) =>
      admin.supabase.from("product_images").update({ position: i }).eq("id", id).eq("product_id", parsed.data.productId),
    ),
  );
  if (results.some((r) => r.error)) return { ok: false, error: "Couldn't save the photo order. Try again." };
  revalidateShop();
  return { ok: true };
}

export async function updateImageAlt(rawId: unknown, rawAlt: unknown): Promise<SimpleResult> {
  const admin = await getAdmin();
  if (!admin) return { ok: false, error: SESSION_ENDED };
  const parsed = z
    .object({ id: uuid, alt: z.string().trim().max(200, "Keep the description under 200 characters.") })
    .safeParse({ id: rawId, alt: rawAlt });
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Check the text." };
  const { error } = await admin.supabase
    .from("product_images")
    .update({ alt: parsed.data.alt || null })
    .eq("id", parsed.data.id);
  if (error) return { ok: false, error: "Couldn't save the description. Try again." };
  revalidateShop();
  return { ok: true };
}
