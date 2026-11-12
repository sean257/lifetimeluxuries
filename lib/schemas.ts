import { z } from "zod";
import { isValidPhone } from "@/lib/phone";

export const MAX_LINES = 20;
export const MAX_QTY = 20;

export const bagItemSchema = z.object({
  product_id: z.uuid(),
  qty: z.number().int().min(1).max(MAX_QTY),
});

export const bagItemsSchema = z.array(bagItemSchema).max(MAX_LINES);

export const orderInputSchema = z.object({
  name: z
    .string()
    .trim()
    .min(1, "Add your name so we know who the order is for.")
    .max(120, "Use a shorter name (120 characters at most)."),
  phone: z
    .string()
    .trim()
    .max(30, "Add a phone number we can reach you on, for example 077 123 4567.")
    .refine(isValidPhone, "Add a phone number we can reach you on, for example 077 123 4567."),
  delivery: z.string().regex(/^[a-z0-9_]+$/, "Choose a delivery option."),
  notes: z.string().trim().max(1000, "Keep notes under 1,000 characters.").default(""),
  items: bagItemsSchema.min(1, "Your bag is empty."),
  /** Honeypot: hidden from people, bots fill it in. */
  website: z.string().max(0).default(""),
});

export type OrderInput = z.input<typeof orderInputSchema>;

/** What place_order() returns. */
export const placedOrderSchema = z.object({
  ref: z.string(),
  customer_name: z.string(),
  customer_phone: z.string(),
  delivery_label: z.string(),
  delivery_fee: z.coerce.number(),
  subtotal: z.coerce.number(),
  total: z.coerce.number(),
  notes: z.string().nullable(),
  items: z.array(
    z.object({
      name: z.string(),
      qty: z.number().int(),
      unit_price: z.coerce.number(),
      line_total: z.coerce.number(),
    }),
  ),
  whatsapp_number: z.string(),
});

export type PlacedOrder = z.infer<typeof placedOrderSchema>;
