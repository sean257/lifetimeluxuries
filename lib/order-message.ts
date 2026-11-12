import { formatPrice } from "@/lib/format";

export type OrderMessageInput = {
  ref: string;
  items: { name: string; qty: number; line_total: number }[];
  subtotal: number;
  delivery_label: string;
  name: string;
  /** As the customer typed it, e.g. "077 211 8430". */
  phone: string;
  notes?: string | null;
};

/**
 * The WhatsApp order message. The owner recognises this format, so change it
 * only on purpose. Delivery fees are worked out after the order, so the
 * message shows the delivery choice and an items total excluding delivery.
 */
export function buildOrderMessage(o: OrderMessageInput): string {
  const notes = o.notes?.trim();
  return [
    "Hello Lifetime Luxuries, I'd like to place an order.",
    "",
    `Order ${o.ref}`,
    ...o.items.map((i) => `${i.qty} × ${i.name} — ${formatPrice(i.line_total)}`),
    "",
    `Subtotal: ${formatPrice(o.subtotal)}`,
    `Delivery: ${o.delivery_label}`,
    `Total: ${formatPrice(o.subtotal)} (excl. delivery)`,
    "",
    `Name: ${o.name}`,
    `Phone: ${o.phone.trim()}`,
    ...(notes ? [`Notes: ${notes}`] : []),
  ].join("\n");
}
