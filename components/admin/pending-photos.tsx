"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import { Panel } from "@/components/admin/panel";
import { MAX_PHOTOS } from "@/lib/product-schema";
import { PHOTO_ACCEPT, STAGE_LABEL, STAGE_PCT, isPhotoFile, type UploadStage } from "@/lib/upload-photo";

export type PendingPhoto = { key: string; file: File; stage?: UploadStage; error?: string };

/** Photo picker for a product that doesn't exist yet: files upload right after "Create product". */
export function PendingPhotos({
  photos,
  onChange,
  busy,
}: {
  photos: PendingPhoto[];
  onChange: (next: PendingPhoto[]) => void;
  busy: boolean;
}) {
  const input = useRef<HTMLInputElement>(null);
  const [error, setError] = useState("");
  const [dragOver, setDragOver] = useState(false);
  const room = MAX_PHOTOS - photos.length;

  // Local previews (object URLs), released when the list changes.
  const previews = useMemo(
    () => photos.map((p) => ({ key: p.key, url: /\.(heic|heif)$/i.test(p.file.name) ? null : URL.createObjectURL(p.file) })),
    [photos],
  );
  useEffect(() => () => previews.forEach((p) => p.url && URL.revokeObjectURL(p.url)), [previews]);

  const add = (list: FileList | File[]) => {
    setError("");
    const files = Array.from(list).filter(isPhotoFile);
    if (!files.length) return setError("Choose photo files (JPEG, PNG, WebP or HEIC).");
    if (files.length > room) setError(`You can add ${room} more photo${room === 1 ? "" : "s"} (${MAX_PHOTOS} at most).`);
    onChange([...photos, ...files.slice(0, Math.max(0, room)).map((file) => ({ key: crypto.randomUUID(), file }))]);
    if (input.current) input.current.value = "";
  };

  const move = (i: number, d: number) => {
    const to = i + d;
    if (to < 0 || to >= photos.length) return;
    const next = [...photos];
    const [m] = next.splice(i, 1);
    next.splice(to, 0, m!);
    onChange(next);
  };

  return (
    <Panel
      title="Photos"
      sub={`Up to ${MAX_PHOTOS}. The first photo is the main one. They upload when you press Create product.`}
    >
      <div
        onDragOver={(e) => {
          if (!busy && e.dataTransfer.types.includes("Files")) {
            e.preventDefault();
            setDragOver(true);
          }
        }}
        onDragLeave={() => setDragOver(false)}
        onDrop={(e) => {
          if (busy || !e.dataTransfer.files.length) return;
          e.preventDefault();
          setDragOver(false);
          add(e.dataTransfer.files);
        }}
        className={`grid place-items-center gap-3 border border-dashed px-4 py-7 text-center ${dragOver ? "border-rose bg-tile" : "border-line bg-bg"}`}
      >
        <p className="text-sm text-muted">{room > 0 ? "Drop photos here, or" : `${MAX_PHOTOS} photos chosen.`}</p>
        {room > 0 ? (
          <>
            <button type="button" className="btn btn-solid" onClick={() => input.current?.click()} disabled={busy}>
              Choose photos
            </button>
            <input
              ref={input}
              type="file"
              accept={PHOTO_ACCEPT}
              multiple
              className="sr-only"
              tabIndex={-1}
              aria-label="Choose photos"
              onChange={(e) => e.target.files && add(e.target.files)}
            />
          </>
        ) : null}
      </div>
      {error ? (
        <p role="alert" className="mt-3 text-[13px] text-bad">
          {error}
        </p>
      ) : null}

      {photos.length ? (
        <ul className="mt-5 grid grid-cols-2 gap-4 min-[560px]:grid-cols-3 min-[1000px]:grid-cols-4">
          {photos.map((p, i) => {
            const preview = previews.find((x) => x.key === p.key)?.url;
            return (
              <li key={p.key} className="grid gap-2">
                <div className="relative grid aspect-[4/5] place-items-center overflow-hidden bg-tile">
                  {preview ? (
                    // Local blob preview; next/image can't optimise blob: URLs.
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={preview} alt={`Photo ${i + 1}`} className="absolute inset-0 size-full object-cover" />
                  ) : (
                    <span className="px-2 text-center text-xs break-all text-muted">{p.file.name}</span>
                  )}
                  {i === 0 ? (
                    <span className="absolute top-2 left-2 bg-surface px-2 py-0.5 text-[10px] tracking-[0.16em] uppercase">Main</span>
                  ) : null}
                </div>
                {p.stage ? (
                  <div className="grid gap-1 text-xs">
                    <span className={p.stage === "error" ? "text-bad" : "text-muted"}>{p.error ?? STAGE_LABEL[p.stage]}</span>
                    <div className="h-1 bg-tile" role="progressbar" aria-label={`Photo ${i + 1} progress`} aria-valuemin={0} aria-valuemax={100} aria-valuenow={STAGE_PCT[p.stage]}>
                      <i className={`block h-full ${p.stage === "error" ? "bg-bad" : "bg-rose"}`} style={{ width: `${STAGE_PCT[p.stage]}%` }} />
                    </div>
                  </div>
                ) : (
                  <div className="flex gap-1">
                    <button type="button" className="grid h-8 flex-1 place-items-center border border-line text-muted hover:text-ink disabled:opacity-30" disabled={busy || i === 0} onClick={() => move(i, -1)} aria-label={`Move photo ${i + 1} earlier`}>
                      ←
                    </button>
                    <button type="button" className="grid h-8 flex-1 place-items-center border border-line text-muted hover:text-ink disabled:opacity-30" disabled={busy || i === photos.length - 1} onClick={() => move(i, 1)} aria-label={`Move photo ${i + 1} later`}>
                      →
                    </button>
                    <button type="button" className="grid h-8 flex-1 place-items-center border border-line text-bad disabled:opacity-30" disabled={busy} onClick={() => onChange(photos.filter((x) => x.key !== p.key))} aria-label={`Remove photo ${i + 1}`}>
                      ×
                    </button>
                  </div>
                )}
              </li>
            );
          })}
        </ul>
      ) : null}
    </Panel>
  );
}
