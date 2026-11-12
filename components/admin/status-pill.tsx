import { STATUS_CLASS, STATUS_LABEL, type OrderStatus } from "@/lib/order-status";

export function StatusPill({ status, className = "" }: { status: OrderStatus; className?: string }) {
  return (
    <span className={`inline-flex items-center gap-1.5 text-xs ${STATUS_CLASS[status]} ${className}`}>
      <span aria-hidden="true" className="size-2 rounded-full bg-current" />
      {STATUS_LABEL[status]}
    </span>
  );
}
