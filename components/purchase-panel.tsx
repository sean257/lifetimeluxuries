"use client";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useBag } from "@/components/bag-provider";

type Props = { productId: string; name: string; stock: number; inModal?: boolean };

/** Quantity stepper + Add to bag. */
export function PurchasePanel({ productId, name, stock, inModal }: Props) {
  const router = useRouter();
  const { add, items, toast } = useBag();
  const [qty, setQty] = useState(1);
  const inBag = items.find((i) => i.id === productId)?.qty ?? 0;
  const available = Math.max(0, stock - inBag);
  const max = Math.max(1, available);
  const soldOut = stock <= 0;
  const allInBag = !soldOut && available <= 0;

  const onAdd = () => {
    add(productId, Math.min(qty, available), stock);
    setQty(1);
    if (inModal) router.back();
    toast(`${name} added to your bag`);
  };

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-2.5">
        <div className="inline-flex items-center border border-line" role="group" aria-label="Quantity">
          <button
            type="button"
            className="h-10 w-9 text-[15px] disabled:opacity-40"
            aria-label="Less"
            disabled={soldOut || allInBag || qty <= 1}
            onClick={() => setQty((q) => Math.max(1, q - 1))}
          >
            −
          </button>
          <span className="num min-w-[22px] text-center text-[13px]" aria-live="polite">
            {qty}
          </span>
          <button
            type="button"
            className="h-10 w-9 text-[15px] disabled:opacity-40"
            aria-label="More"
            disabled={soldOut || allInBag || qty >= max}
            onClick={() => setQty((q) => Math.min(max, q + 1))}
          >
            +
          </button>
        </div>
        <button type="button" className="btn btn-solid flex-1" disabled={soldOut || allInBag} onClick={onAdd}>
          Add to bag
        </button>
      </div>
      {allInBag ? <p className="text-xs text-muted">All the stock we have is already in your bag.</p> : null}
    </div>
  );
}
