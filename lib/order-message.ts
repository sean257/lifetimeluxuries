import { formatPrice } from "@/lib/format";

export type OrderMessageInput = {
  ref: string;
  items: { name: string; qty: number; line_total: number }[];
  subtotal: number;
  delivery_label: string;
  delivery_fee: number;
  total: number;
  name: string;
  /** As the customer typed it, e.g. "077 211 8430". */
  phone: string;
  notes?: string | null;
};

/** The WhatsApp order message. Keep the format exactly: the owner recognises it. */
export function buildOrderMessage(o: OrderMessageInput): string {
  const notes = o.notes?.trim();
  return [
    "Hello Lifetime Luxuries, I'd like to place an order.",
    "",
    `Order ${o.ref}`,
    ...o.items.map((i) => `${i.qty} × ${i.name} — ${formatPrice(i.line_total)}`),
    "",
    `Subtotal: ${formatPrice(o.subtotal)}`,
    `Delivery: ${o.delivery_label}${o.delivery_fee > 0 ? ` (${formatPrice(o.delivery_fee)})` : ""}`,
    `Total: ${formatPrice(o.total)}`,
    "",
    `Name: ${o.name}`,
    `Phone: ${o.phone.trim()}`,
    ...(notes ? [`Notes: ${notes}`] : []),
  ].join("\n");
}
