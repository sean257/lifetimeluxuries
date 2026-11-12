"use client";
import { useCallback, useRef, useState } from "react";
import { ProductForm } from "@/components/admin/product-form";
import { PendingPhotos, type PendingPhoto } from "@/components/admin/pending-photos";
import { uploadProductPhoto } from "@/lib/upload-photo";

/** Add-product page: the form plus photos that upload once the product exists. */
export function NewProductEditor() {
  const [photos, setPhotos] = useState<PendingPhoto[]>([]);
  const [busy, setBusy] = useState(false);
  const photosRef = useRef(photos);
  photosRef.current = photos;

  const patch = (key: string, p: Partial<PendingPhoto>) =>
    setPhotos((list) => list.map((x) => (x.key === key ? { ...x, ...p } : x)));

  /** Runs after the product row is created. Returns how many photos failed. */
  const uploadAll = useCallback(async (productId: string) => {
    const list = photosRef.current;
    if (!list.length) return 0;
    setBusy(true);
    let failed = 0;
    for (const p of list) {
      try {
        await uploadProductPhoto(productId, p.file, (stage) => patch(p.key, { stage }));
      } catch (e) {
        failed++;
        patch(p.key, { stage: "error", error: e instanceof Error ? e.message : "Upload failed." });
      }
    }
    return failed;
  }, []);

  return (
    <ProductForm
      id={null}
      afterCreate={uploadAll}
      photoCount={photos.length}
      photosSlot={<PendingPhotos photos={photos} onChange={setPhotos} busy={busy} />}
    />
  );
}
