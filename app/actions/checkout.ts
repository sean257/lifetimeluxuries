"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { createPublicClient } from "@/lib/supabase/public";
import { getDeliveryOptions, getProductsByIds, type DeliveryOption } from "@/lib/shop";
import { createRateLimiter } from "@/lib/rate-limit";
import { orderInputSchema, placedOrderSchema, type PlacedOrder } from "@/lib/schemas";

export type BagLine = {
  id: string;
  slug: string;
  name: string;
  price: number;
  stock: number;
  image: { url: string; alt: string } | null;
};

export type BagData = { lines: BagLine[]; delivery: DeliveryOption[] };

/** Re-reads the bag's products and the delivery options from the database. */
export async function loadBag(rawIds: unknown): Promise<BagData> {
  const ids = z.array(z.uuid()).max(50).catch([]).parse(rawIds);
  const [products, delivery] = await Promise.all([getProductsByIds(ids), getDeliveryOptions()]);
  return {
    delivery,
    lines: products.map((p) => ({
      id: p.id,
      slug: p.slug,
      name: p.name,
      price: p.price,
      stock: p.stock,
      image: p.images[0] ? { url: p.images[0].url, alt: p.images[0].alt || p.name } : null,
    })),
  };
}

export type PlaceOrderResult =
  | { ok: true; order: PlacedOrder }
  | { ok: false; error: string; field?: "name" | "phone" | "delivery" | "notes" };

const limiter = createRateLimiter({ limit: 5, windowMs: 10 * 60 * 1000 });

async function clientIp(): Promise<string> {
  const h = await headers();
  return h.get("x-forwarded-for")?.split(",")[0]?.trim() || h.get("x-real-ip") || "unknown";
}

export async function placeOrder(raw: unknown): Promise<PlaceOrderResult> {
  const parsed = orderInputSchema.safeParse(raw);
  if (!parsed.success) {
    const issue = parsed.error.issues[0];
    const field = issue?.path[0];
    if (field === "website") return { ok: false, error: "We couldn't place your order. Please try again." };
    return {
      ok: false,
      error: issue?.message ?? "Check the form and try again.",
      field: field === "name" || field === "phone" || field === "delivery" || field === "notes" ? field : undefined,
    };
  }

  if (!limiter.check(await clientIp())) {
    return {
      ok: false,
      error: "Too many orders from this connection. Wait a few minutes, or message us on WhatsApp directly.",
    };
  }

  const input = parsed.data;
  const supabase = createPublicClient();
  const { data, error } = await supabase.rpc("place_order", {
    p_customer_name: input.name,
    p_customer_phone: input.phone,
    p_delivery_code: input.delivery,
    p_notes: input.notes,
    p_items: input.items,
  });

  if (error) {
    // place_order raises customer-facing messages with errcode P0001.
    if (error.code === "P0001") return { ok: false, error: error.message };
    console.error("place_order failed", error);
    return { ok: false, error: "We couldn't place your order just now. Try again in a moment." };
  }

  const order = placedOrderSchema.safeParse(data);
  if (!order.success) {
    console.error("place_order returned an unexpected shape", order.error);
    return { ok: false, error: "We couldn't place your order just now. Try again in a moment." };
  }
  return { ok: true, order: order.data };
}

// Re-exported for the client's type checks only.
export type { DeliveryOption };
