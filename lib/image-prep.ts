/** Long edge after resizing. */
export const MAX_EDGE = 1600;
export const QUALITY = 0.82;
/** Inputs larger than this are refused before decoding (phone photos are ~3–12 MB). */
export const MAX_INPUT_BYTES = 40 * 1024 * 1024;

/** Fit (w, h) inside a MAX_EDGE box, never upscaling. */
export function fitWithin(width: number, height: number, maxEdge = MAX_EDGE) {
  const scale = Math.min(1, maxEdge / Math.max(width, height));
  return { width: Math.max(1, Math.round(width * scale)), height: Math.max(1, Math.round(height * scale)) };
}

export type PreparedImage = { blob: Blob; width: number; height: number; ext: "webp" | "jpg"; contentType: string };

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number) {
  return new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, type, quality));
}

/**
 * Decode (respecting EXIF rotation), resize to ≤1600px, and re-encode as WebP.
 * Re-encoding through a canvas drops all EXIF/GPS metadata. Browsers that
 * can't encode WebP (older Safari) get JPEG instead.
 */
export async function prepareImage(file: File): Promise<PreparedImage> {
  if (file.size > MAX_INPUT_BYTES) throw new Error("This photo is over 40 MB. Pick a smaller one.");

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    const heic = /heic|heif/i.test(file.type) || /\.(heic|heif)$/i.test(file.name);
    throw new Error(
      heic
        ? "This browser can't read HEIC photos. Use Safari, or set your iPhone camera to 'Most Compatible' and try again."
        : "This file isn't a photo we can read. Use a JPEG, PNG or WebP image.",
    );
  }

  const { width, height } = fitWithin(bitmap.width, bitmap.height);
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Couldn't process this photo. Try again.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const webp = await canvasToBlob(canvas, "image/webp", QUALITY);
  if (webp && webp.type === "image/webp") return { blob: webp, width, height, ext: "webp", contentType: "image/webp" };

  const jpeg = await canvasToBlob(canvas, "image/jpeg", QUALITY);
  if (!jpeg) throw new Error("Couldn't process this photo. Try again.");
  return { blob: jpeg, width, height, ext: "jpg", contentType: "image/jpeg" };
}
