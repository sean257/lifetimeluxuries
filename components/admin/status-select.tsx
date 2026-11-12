"use client";
import { useRouter } from "next/navigation";
import { useOptimistic, useState, useTransition } from "react";
import { updateOrderStatus } from "@/app/actions/orders";
import { ORDER_STATUSES, STATUS_LABEL, type OrderStatus } from "@/lib/order-status";
import { StatusPill } from "@/components/admin/status-pill";

/** Status pill + dropdown. Changes save straight away. */
export function StatusSelect({ orderRef, status, showPill = true }: { orderRef: string; status: OrderStatus; showPill?: boolean }) {
  const router = useRouter();
  const [optimistic, setOptimistic] = useOptimistic(status);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");

  const change = (next: OrderStatus) => {
    setError("");
    startTransition(async () => {
      setOptimistic(next);
      const res = await updateOrderStatus({ ref: orderRef, status: next });
      if (!res.ok) setError(res.error);
      router.refresh();
    });
  };

  return (
    <div className="flex flex-col items-start gap-1.5">
      {showPill ? <StatusPill status={optimistic} /> : null}
      <select
        value={optimistic}
        onChange={(e) => change(e.target.value as OrderStatus)}
        disabled={pending}
        aria-label={`Change status of ${orderRef}`}
        className="rounded-[2px] border border-line bg-bg px-2 py-1.5 text-[13px] disabled:opacity-60"
      >
        {ORDER_STATUSES.map((s) => (
          <option key={s} value={s}>
            {STATUS_LABEL[s]}
          </option>
        ))}
      </select>
      {error ? (
        <span role="alert" className="text-xs text-bad">
          {error}
        </span>
      ) : null}
    </div>
  );
}
