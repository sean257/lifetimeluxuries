"use client";
import Image from "next/image";
import { useRouter } from "next/navigation";
import { useRef, useState, useTransition } from "react";
import {
  deleteProductImage,
  reorderProductImages,
  updateImageAlt,
} from "@/app/actions/products";
import { Panel } from "@/components/admin/panel";
import { inputClass } from "@/components/admin/form-bits";
import { PHOTO_ACCEPT, STAGE_LABEL, STAGE_PCT, isPhotoFile, uploadProductPhoto, type UploadStage } from "@/lib/upload-photo";
import { MAX_PHOTOS } from "@/lib/product-schema";

export type ManagedImage = { id: string; url: string; alt: string | null; width: number | null; height: number | null };

type Upload = { key: string; name: string; stage: UploadStage; error?: string };

export function PhotoManager({
  productId,
  productName,
  initial,
}: {
  productId: string;
  productName: string;
  initial: ManagedImage[];
}) {
  const router = useRouter();
  const [images, setImages] = useState(initial);
  const [uploads, setUploads] = useState<Upload[]>([]);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const [dragId, setDragId] = useState<string | null>(null);
  const [, startTransition] = useTransition();
  const input = useRef<HTMLInputElement>(null);

  const busy = uploads.some((u) => u.stage !== "done" && u.stage !== "error");
  const room = MAX_PHOTOS - images.length;

  const patchUpload = (key: string, patch: Partial<Upload>) =>
    setUploads((list) => list.map((u) => (u.key === key ? { ...u, ...patch } : u)));

  async function handleFiles(fileList: FileList | File[]) {
    setError("");
    const files = Array.from(fileList).filter(isPhotoFile);
    if (!files.length) {
      setError("Choose photo files (JPEG, PNG, WebP or HEIC).");
      return;
    }
    if (files.length > room) {
      setError(room > 0 ? `You can add ${room} more photo${room === 1 ? "" : "s"} (${MAX_PHOTOS} at most).` : `This product already has ${MAX_PHOTOS} photos. Delete one first.`);
      if (room <= 0) return;
    }
    const batch = files.slice(0, Math.max(0, room)).map((f) => ({ file: f, key: crypto.randomUUID() }));
    setUploads((list) => [
      ...list.filter((u) => u.stage !== "done"),
      ...batch.map(({ file, key }) => ({ key, name: file.name, stage: "prepare" as const })),
    ]);

    let added = 0;
    // One at a time keeps memory low on phones.
    for (const { file, key } of batch) {
      try {
        const img = await uploadProductPhoto(productId, file, (stage) => patchUpload(key, { stage }));
        setImages((list) => [...list, { id: img.id, url: img.url, alt: null, width: img.width, height: img.height }]);
        added++;
      } catch (e) {
        patchUpload(key, { stage: "error", error: e instanceof Error ? e.message : "Upload failed." });
      }
    }
    if (added) {
      setStatus(`${added} photo${added === 1 ? "" : "s"} added`);
      router.refresh();
    }
    if (input.current) input.current.value = "";
  }

  const saveOrder = (next: ManagedImage[]) => {
    const prev = images;
    setImages(next);
    setError("");
    startTransition(async () => {
      const res = await reorderProductImages(productId, next.map((i) => i.id));
      if (!res.ok) {
        setImages(prev);
        setError(res.error);
      } else {
        setStatus("Photo order saved");
        router.refresh();
      }
    });
  };

  const move = (index: number, delta: number) => {
    const to = index + delta;
    if (to < 0 || to >= images.length) return;
    const next = [...images];
    const [m] = next.splice(index, 1);
    next.splice(to, 0, m!);
    saveOrder(next);
  };

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return;
    const from = images.findIndex((i) => i.id === dragId);
    const to = images.findIndex((i) => i.id === targetId);
    const next = [...images];
    const [m] = next.splice(from, 1);
    next.splice(to, 0, m!);
    saveOrder(next);
  };

  const remove = (img: ManagedImage, index: number) => {
    if (!window.confirm(`Delete photo ${index + 1}? This can't be undone.`)) return;
    const prev = images;
    setImages((list) => list.filter((i) => i.id !== img.id));
    startTransition(async () => {
      const res = await deleteProductImage(img.id);
      if (!res.ok) {
        setImages(prev);
        setError(res.error);
      } else {
        setStatus("Photo deleted");
        router.refresh();
      }
    });
  };

  const saveAlt = (img: ManagedImage, alt: string) => {
    if ((img.alt ?? "") === alt.trim()) return;
    setImages((list) => list.map((i) => (i.id === img.id ? { ...i, alt: alt.trim() || null } : i)));
    startTransition(async () => {
      const res = await updateImageAlt(img.id, alt);
      if (!res.ok) setError(res.error);
      else setStatus("Description saved");
    });
  };

  return (
    <Panel
      title="Photos"
      sub={`Up to ${MAX_PHOTOS}. The first photo is the main one. Photos are resized and compressed on your device before upload.`}
    >
      <div
        onDragOver={(e) => {
          if (e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (!e.dataTransfer.files.length) return;
          e.preventDefault();
          setDragOver(false);
          void handleFiles(e.dataTransfer.files);
        }}
        className={`grid place-items-center gap-3 border border-dashed px-4 py-7 text-center ${dragOver ? "border-rose bg-tile" : "border-line bg-bg"}`}
      >
        <p className="text-sm text-muted">
          {room > 0 ? "Drop photos here, or" : `This product has ${MAX_PHOTOS} photos. Delete one to add another.`}
        </p>
        {room > 0 ? (
          <>
            <button type="button" className="btn btn-solid" onClick={() => input.current?.click()} disabled={busy}>
              {busy ? "Adding photos…" : "Choose photos"}
            </button>
            <input
              ref={input}
              type="file"
              accept={PHOTO_ACCEPT}
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-label="Choose photos"
              onChange={(e) => e.target.files && void handleFiles(e.target.files)}
            />
          </>
        ) : null}
      </div>

      {uploads.length ? (
        <ul className="mt-4 grid gap-2" aria-label="Uploads">
          {uploads.map((u) => (
            <li key={u.key} className="grid gap-1 text-[13px]">
              <div className="flex justify-between gap-3">
                <span className="truncate">{u.name}</span>
                <span className={u.stage === "error" ? "text-bad" : "text-muted"}>{STAGE_LABEL[u.stage]}</span>
              </div>
              <div
                className="h-1 bg-tile"
                role="progressbar"
                aria-label={`${u.name} progress`}
                aria-valuemin={0}
                aria-valuemax={100}
                aria-valuenow={STAGE_PCT[u.stage]}
              >
                <i
                  className={`block h-full transition-[width] duration-300 ${u.stage === "error" ? "bg-bad" : "bg-rose"}`}
                  style={{ width: `${STAGE_PCT[u.stage]}%` }}
                />
              </div>
              {u.error ? <span className="text-xs text-bad">{u.error}</span> : null}
            </li>
          ))}
        </ul>
      ) : null}

      <div role="status" className="sr-only">
        {status}
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-bad">
          {error}
        </p>
      ) : null}

      {images.length ? (
        <ul className="mt-5 grid grid-cols-2 gap-4 min-[560px]:grid-cols-3 min-[1000px]:grid-cols-4">
          {images.map((img, i) => (
            <li
              key={img.id}
              draggable
              onDragStart={(e) => {
                setDragId(img.id);
                e.dataTransfer.effectAllowed = "move";
              }}
              onDragEnd={() => setDragId(null)}
              onDragOver={(e) => dragId && e.preventDefault()}
              onDrop={(e) => {
                if (!dragId) return;
                e.preventDefault();
                dropOn(img.id);
              }}
              className={`grid gap-2 ${dragId === img.id ? "opacity-50" : ""}`}
            >
              <div className="relative aspect-[4/5] cursor-grab overflow-hidden bg-tile">
                <Image src={img.url} alt={img.alt || productName} fill sizes="(max-width: 560px) 50vw, 240px" className="object-cover" />
                {i === 0 ? (
                  <span className="absolute top-2 left-2 bg-surface px-2 py-0.5 text-[10px] tracking-[0.16em] uppercase">Main</span>
                ) : null}
              </div>
              <div className="flex gap-1">
                <button type="button" className="grid h-8 flex-1 place-items-center border border-line text-muted hover:text-ink disabled:opacity-30" disabled={i === 0} onClick={() => move(i, -1)} aria-label={`Move photo ${i + 1} earlier`}>
                  ←
                </button>
                <button type="button" className="grid h-8 flex-1 place-items-center border border-line text-muted hover:text-ink disabled:opacity-30" disabled={i === images.length - 1} onClick={() => move(i, 1)} aria-label={`Move photo ${i + 1} later`}>
                  →
                </button>
                <button type="button" className="grid h-8 flex-1 place-items-center border border-line text-bad" onClick={() => remove(img, i)} aria-label={`Delete photo ${i + 1}`}>
                  ×
                </button>
              </div>
              <label className="sr-only" htmlFor={`alt-${img.id}`}>
                Description of photo {i + 1}
              </label>
              <input
                id={`alt-${img.id}`}
                defaultValue={img.alt ?? ""}
                placeholder={productName}
                maxLength={200}
                onBlur={(e) => saveAlt(img, e.target.value)}
                className={`${inputClass} py-1.5 text-[13px]`}
              />
            </li>
          ))}
        </ul>
      ) : (
        <p className="mt-4 text-[13px] text-muted">No photos yet. The shop shows the crown mark until you add one.</p>
      )}
      {images.length > 1 ? (
        <p className="mt-3 text-xs text-muted">Drag photos, or use the arrows, to change the order. The text under each photo describes it for screen readers; it defaults to the product name.</p>
      ) : null}
    </Panel>
  );
}
