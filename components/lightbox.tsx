"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import { createPortal } from "react-dom";
import { useDialog } from "@/lib/use-dialog";
import type { ProductImage } from "@/lib/types";

const MAX_SCALE = 4;
const DOUBLE_TAP_SCALE = 2.5;

type View = { scale: number; x: number; y: number };
const RESET: View = { scale: 1, x: 0, y: 0 };

const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));

/**
 * Full-screen photo viewer. Pinch, double-tap/double-click or the +/− buttons
 * zoom; drag moves a zoomed photo; swipe or the arrows change photo.
 */
export function Lightbox({
  images,
  name,
  index,
  onIndex,
  onClose,
}: {
  images: ProductImage[];
  name: string;
  index: number;
  onIndex: (i: number) => void;
  onClose: () => void;
}) {
  const panel = useRef<HTMLDivElement>(null);
  const stage = useRef<HTMLDivElement>(null);
  const [view, setView] = useState<View>(RESET);
  const [animate, setAnimate] = useState(true);
  const pointers = useRef(new Map<number, { x: number; y: number }>());
  const gesture = useRef<{
    startView: View;
    startDist: number;
    startMid: { x: number; y: number };
    startPoint: { x: number; y: number };
    moved: boolean;
  } | null>(null);
  const lastTap = useRef(0);
  // Photo size (from the DB, or measured on load) so panning stops at the photo's edges.
  const natural = useRef<{ w: number; h: number } | null>(null);

  useDialog(panel, onClose);

  const count = images.length;
  const img = images[index]!;
  const go = useCallback(
    (d: number) => {
      const next = index + d;
      if (next >= 0 && next < count) onIndex(next);
    },
    [index, count, onIndex],
  );

  useEffect(() => {
    setView(RESET);
    natural.current = img.width && img.height ? { w: img.width, h: img.height } : null;
  }, [index, img.width, img.height]);

  /** Keep a zoomed photo from sliding out of view. */
  const bounded = useCallback((v: View): View => {
    const el = stage.current;
    if (!el || v.scale <= 1) return RESET;
    const sw = el.clientWidth;
    const sh = el.clientHeight;
    // Size the photo is drawn at before zooming (object-contain).
    const n = natural.current;
    const fit = n ? Math.min(sw / n.w, sh / n.h) : 1;
    const dw = n ? n.w * fit : sw;
    const dh = n ? n.h * fit : sh;
    const maxX = Math.max(0, (dw * v.scale - sw) / 2);
    const maxY = Math.max(0, (dh * v.scale - sh) / 2);
    return { scale: v.scale, x: clamp(v.x, -maxX, maxX), y: clamp(v.y, -maxY, maxY) };
  }, []);

  /** Zoom to `scale`, keeping the point under (px, py) (stage coordinates from centre) still. */
  const zoomAt = useCallback(
    (from: View, scale: number, px: number, py: number) => {
      const s = clamp(scale, 1, MAX_SCALE);
      const cx = (px - from.x) / from.scale;
      const cy = (py - from.y) / from.scale;
      return bounded({ scale: s, x: px - cx * s, y: py - cy * s });
    },
    [bounded],
  );

  const fromCentre = (clientX: number, clientY: number) => {
    const r = stage.current!.getBoundingClientRect();
    return { x: clientX - (r.left + r.width / 2), y: clientY - (r.top + r.height / 2) };
  };

  // Arrow keys change photo; +/- zoom. (Escape is handled by useDialog.)
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight") go(1);
      else if (e.key === "ArrowLeft") go(-1);
      else if (e.key === "+" || e.key === "=") setView((v) => zoomAt(v, v.scale * 1.5, 0, 0));
      else if (e.key === "-") setView((v) => zoomAt(v, v.scale / 1.5, 0, 0));
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [go, zoomAt]);

  // Wheel / trackpad zoom (non-passive so the page doesn't scroll).
  useEffect(() => {
    const el = stage.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const p = fromCentre(e.clientX, e.clientY);
      setAnimate(false);
      setView((v) => zoomAt(v, v.scale * Math.exp(-e.deltaY * 0.0025), p.x, p.y));
    };
    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [zoomAt]);

  const onPointerDown = (e: React.PointerEvent) => {
    (e.target as Element).setPointerCapture?.(e.pointerId);
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const pts = [...pointers.current.values()];
    setAnimate(false);
    gesture.current = {
      startView: view,
      startDist: pts.length === 2 ? Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y) : 0,
      startMid: pts.length === 2 ? fromCentre((pts[0]!.x + pts[1]!.x) / 2, (pts[0]!.y + pts[1]!.y) / 2) : { x: 0, y: 0 },
      startPoint: { x: e.clientX, y: e.clientY },
      moved: false,
    };
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!pointers.current.has(e.pointerId) || !gesture.current) return;
    pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY });
    const g = gesture.current;
    const pts = [...pointers.current.values()];
    if (pts.length === 2 && g.startDist) {
      const dist = Math.hypot(pts[0]!.x - pts[1]!.x, pts[0]!.y - pts[1]!.y);
      const mid = fromCentre((pts[0]!.x + pts[1]!.x) / 2, (pts[0]!.y + pts[1]!.y) / 2);
      const zoomed = zoomAt(g.startView, g.startView.scale * (dist / g.startDist), g.startMid.x, g.startMid.y);
      setView(bounded({ ...zoomed, x: zoomed.x + (mid.x - g.startMid.x), y: zoomed.y + (mid.y - g.startMid.y) }));
      g.moved = true;
    } else if (pts.length === 1) {
      const dx = e.clientX - g.startPoint.x;
      const dy = e.clientY - g.startPoint.y;
      if (Math.abs(dx) + Math.abs(dy) > 6) g.moved = true;
      if (g.startView.scale > 1) setView(bounded({ ...g.startView, x: g.startView.x + dx, y: g.startView.y + dy }));
    }
  };

  const onPointerUp = (e: React.PointerEvent) => {
    const g = gesture.current;
    const wasSingle = pointers.current.size === 1;
    pointers.current.delete(e.pointerId);
    setAnimate(true);
    if (!g || !wasSingle) {
      // A pinch finger lifted: restart the gesture from the remaining finger.
      if (pointers.current.size === 1) {
        const [p] = [...pointers.current.values()];
        gesture.current = { startView: view, startDist: 0, startMid: { x: 0, y: 0 }, startPoint: p!, moved: true };
      }
      return;
    }
    gesture.current = null;
    const dx = e.clientX - g.startPoint.x;
    const dy = e.clientY - g.startPoint.y;

    // Swipe to change photo when not zoomed.
    if (g.startView.scale === 1 && Math.abs(dx) > 50 && Math.abs(dx) > Math.abs(dy)) {
      go(dx < 0 ? 1 : -1);
      return;
    }
    if (g.moved) return;

    // Double tap / double click toggles zoom at that point.
    const now = Date.now();
    if (now - lastTap.current < 300) {
      lastTap.current = 0;
      const p = fromCentre(e.clientX, e.clientY);
      setView((v) => (v.scale > 1 ? RESET : zoomAt(v, DOUBLE_TAP_SCALE, p.x, p.y)));
    } else {
      lastTap.current = now;
    }
  };

  const zoomed = view.scale > 1.01;
  const btn =
    "grid size-11 place-items-center rounded-full border border-white/25 bg-black/45 text-white backdrop-blur-sm hover:bg-black/65 disabled:opacity-30";

  return createPortal(
    <div
      ref={panel}
      role="dialog"
      aria-modal="true"
      aria-label={`${name}, photo ${index + 1} of ${count}`}
      tabIndex={-1}
      className="fixed inset-0 z-[80] flex flex-col bg-[#0b0a09] pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] text-white outline-none"
    >
      <div className="flex items-center gap-2 px-3 py-2.5">
        <span className="num min-w-0 flex-1 truncate text-[13px] text-white/75">
          {name} · {index + 1} / {count}
        </span>
        <button type="button" className={btn} onClick={() => setView((v) => zoomAt(v, v.scale / 1.5, 0, 0))} disabled={!zoomed} aria-label="Zoom out">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14" />
          </svg>
        </button>
        <button type="button" className={btn} onClick={() => setView((v) => zoomAt(v, v.scale * 1.5, 0, 0))} disabled={view.scale >= MAX_SCALE} aria-label="Zoom in">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
            <path d="M5 12h14M12 5v14" />
          </svg>
        </button>
        <button type="button" className={btn} onClick={onClose} aria-label="Close photo viewer">
          <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden="true">
            <path d="M6 6l12 12M18 6 6 18" />
          </svg>
        </button>
      </div>

      <div
        ref={stage}
        className={`relative flex-1 touch-none overflow-hidden select-none ${zoomed ? "cursor-grab active:cursor-grabbing" : "cursor-zoom-in"}`}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
      >
        <div
          className={`absolute inset-0 ${animate ? "transition-transform duration-200 ease-out" : ""}`}
          style={{ transform: `translate3d(${view.x}px, ${view.y}px, 0) scale(${view.scale})` }}
        >
          {/* Full 1600px original (unoptimized) so zoomed detail stays sharp. */}
          <Image
            key={img.id}
            src={img.url}
            alt={img.alt || name}
            fill
            unoptimized
            draggable={false}
            sizes="100vw"
            onLoad={(e) => {
              const el = e.currentTarget;
              if (el.naturalWidth) natural.current = { w: el.naturalWidth, h: el.naturalHeight };
            }}
            className="pointer-events-none object-contain"
          />
        </div>

        {count > 1 ? (
          <>
            <button
              type="button"
              className={`${btn} absolute top-1/2 left-3 -translate-y-1/2`}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => go(-1)}
              disabled={index === 0}
              aria-label="Previous photo"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M15 5l-7 7 7 7" />
              </svg>
            </button>
            <button
              type="button"
              className={`${btn} absolute top-1/2 right-3 -translate-y-1/2`}
              onPointerDown={(e) => e.stopPropagation()}
              onPointerUp={(e) => e.stopPropagation()}
              onClick={() => go(1)}
              disabled={index === count - 1}
              aria-label="Next photo"
            >
              <svg viewBox="0 0 24 24" className="size-5" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <path d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </>
        ) : null}
      </div>

      <p className="px-3 py-2 text-center text-xs text-white/60">
        {zoomed ? "Drag to look around. Double-tap to zoom out." : "Pinch or double-tap to zoom."}
      </p>
    </div>,
    document.body,
  );
}
