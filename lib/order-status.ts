export const ORDER_STATUSES = ["new", "confirmed", "paid", "delivered", "cancelled"] as const;
export type OrderStatus = (typeof ORDER_STATUSES)[number];

export const STATUS_LABEL: Record<OrderStatus, string> = {
  new: "New",
  confirmed: "Confirmed",
  paid: "Paid",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

/** Text colour for the dot + label pill (admin only). */
export const STATUS_CLASS: Record<OrderStatus, string> = {
  new: "text-info",
  confirmed: "text-warn",
  paid: "text-ok",
  delivered: "text-muted",
  cancelled: "text-bad",
};

export function isOrderStatus(v: unknown): v is OrderStatus {
  return typeof v === "string" && (ORDER_STATUSES as readonly string[]).includes(v);
}

export const ORDER_REF_RE = /^LL-\d{1,10}$/;
