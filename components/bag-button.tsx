"use client";
import { useBag } from "@/components/bag-provider";

export function BagButton() {
  const { count, open } = useBag();
  return (
    <button
      type="button"
      onClick={open}
      aria-haspopup="dialog"
      className="flex items-center gap-2 rounded-full border border-line bg-surface px-3.5 py-[7px] text-[13px]"
    >
      Bag
      <span className="num inline-grid h-5 min-w-5 place-items-center rounded-full bg-rose px-1.5 text-[11px] text-on-rose">
        {count}
      </span>
      <span className="sr-only">{count === 1 ? "item" : "items"}</span>
    </button>
  );
}
