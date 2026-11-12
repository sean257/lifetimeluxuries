"use client";
import { addProductImage } from "@/app/actions/products";
import { createClient } from "@/lib/supabase/client";
import { prepareImage } from "@/lib/image-prep";

export type UploadStage = "prepare" | "upload" | "save" | "done" | "error";

export const STAGE_PCT: Record<UploadStage, number> = { prepare: 20, upload: 60, save: 90, done: 100, error: 100 };
export const STAGE_LABEL: Record<UploadStage, string> = {
  prepare: "Resizing…",
  upload: "Uploading…",
  save: "Saving…",
  done: "Done",
  error: "Failed",
};

export const PHOTO_ACCEPT = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export function isPhotoFile(f: File) {
  return f.type.startsWith("image/") || /\.(heic|heif)$/i.test(f.name);
}

/**
 * Resize/convert in the browser, upload to product-images/<productId>/<uuid>.<ext>
 * with the signed-in admin's session, then record it in product_images.
 * Throws an Error with a message for the owner if any step fails.
 */
export async function uploadProductPhoto(
  productId: string,
  file: File,
  onStage: (stage: UploadStage) => void = () => {},
) {
  const supabase = createClient();
  onStage("prepare");
  const prepared = await prepareImage(file);

  onStage("upload");
  const path = `${productId}/${crypto.randomUUID()}.${prepared.ext}`;
  const { error: upError } = await supabase.storage
    .from("product-images")
    .upload(path, prepared.blob, { contentType: prepared.contentType, cacheControl: "31536000", upsert: false });
  if (upError) throw new Error("Upload failed. Check your connection and try again.");

  onStage("save");
  const res = await addProductImage({ productId, path, width: prepared.width, height: prepared.height });
  if (!res.ok || !res.image) {
    await supabase.storage.from("product-images").remove([path]);
    throw new Error(res.ok ? "Couldn't save the photo." : res.error);
  }
  onStage("done");
  const url = supabase.storage.from("product-images").getPublicUrl(path).data.publicUrl;
  return { id: res.image.id, url, width: prepared.width, height: prepared.height };
}
