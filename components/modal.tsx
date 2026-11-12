"use client";
import { useRouter } from "next/navigation";
import { useCallback, useRef } from "react";
import { useDialog } from "@/lib/use-dialog";

/** Product quick view over the grid. Closing goes back, so the grid URL is restored. */
export function Modal({ children, labelledBy }: { children: React.ReactNode; labelledBy: string }) {
  const router = useRouter();
  const panel = useRef<HTMLDivElement>(null);
  const close = useCallback(() => router.back(), [router]);
  useDialog(panel, close);

  return (
    <>
      <div data-keep-live className="fixed inset-0 z-40 bg-veil" onClick={close} aria-hidden="true" />
      <div className="pointer-events-none fixed inset-0 z-50 grid place-items-center p-4">
        <div
          ref={panel}
          role="dialog"
          aria-modal="true"
          aria-labelledby={labelledBy}
          tabIndex={-1}
          className="pointer-events-auto relative max-h-[calc(100%-32px)] w-[min(920px,100%)] overflow-auto bg-surface outline-none"
        >
          <button
            type="button"
            onClick={close}
            aria-label="Close"
            className="absolute top-2 right-2 z-10 px-2 py-1 text-[26px] leading-none text-muted hover:text-ink"
          >
            ×
          </button>
          {children}
        </div>
      </div>
    </>
  );
}
