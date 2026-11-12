import "server-only";
import { z } from "zod";
import type { createClient } from "@/lib/supabase/server";
import { ORDER_STATUSES, type OrderStatus } from "@/lib/order-status";
import { lastNDays } from "@/lib/dates";

type Supabase = Awaited<ReturnType<typeof createClient>>;

const DAY = 86_400_000;

const itemRow = z.object({
  id: z.string(),
  product_id: z.string().nullable(),
  product_name: z.string(),
  unit_price: z.coerce.number(),
  qty: z.number().int(),
});

const orderRow = z.object({
  id: z.string(),
  ref: z.string(),
  customer_name: z.string(),
  customer_phone: z.string(),
  delivery_code: z.string(),
  delivery_label: z.string(),
  delivery_fee: z.coerce.number(),
  subtotal: z.coerce.number(),
  total: z.coerce.number(),
  notes: z.string().nullable(),
  status: z.enum(ORDER_STATUSES),
  admin_notes: z.string().nullable(),
  created_at: z.string(),
  order_items: z.array(itemRow).default([]),
});

export type Order = z.infer<typeof orderRow>;

const ORDER_COLUMNS =
  "id, ref, customer_name, customer_phone, delivery_code, delivery_label, delivery_fee, subtotal, total, notes, status, admin_notes, created_at, " +
  "order_items ( id, product_id, product_name, unit_price, qty )";

export const PAGE_SIZE = 50;

export async function listOrders(supabase: Supabase, opts: { status?: OrderStatus; page?: number }) {
  const page = Math.max(1, opts.page ?? 1);
  let q = supabase
    .from("orders")
    .select(ORDER_COLUMNS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range((page - 1) * PAGE_SIZE, page * PAGE_SIZE - 1);
  if (opts.status) q = q.eq("status", opts.status);
  const { data, error, count } = await q;
  if (error) throw new Error(`Could not load orders: ${error.message}`);
  return { orders: z.array(orderRow).parse(data ?? []), total: count ?? 0, page };
}

export async function getOrderByRef(supabase: Supabase, ref: string): Promise<Order | null> {
  const { data, error } = await supabase.from("orders").select(ORDER_COLUMNS).eq("ref", ref).maybeSingle();
  if (error) throw new Error(`Could not load order: ${error.message}`);
  return data ? orderRow.parse(data) : null;
}

/** Number of orders in each status (for the filter chips). */
export async function countByStatus(supabase: Supabase): Promise<Record<OrderStatus, number>> {
  const results = await Promise.all(
    ORDER_STATUSES.map((s) => supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", s)),
  );
  const out = {} as Record<OrderStatus, number>;
  ORDER_STATUSES.forEach((s, i) => {
    const r = results[i]!;
    if (r.error) throw new Error(`Could not count orders: ${r.error.message}`);
    out[s] = r.count ?? 0;
  });
  return out;
}

export type DayValue = { day: string; value: number; orders: number };

export type Overview = {
  revenue30: number;
  orders30: number;
  newCount: number;
  confirmedCount: number;
  averageOrder: number;
  days: DayValue[];
  bestSellers: { name: string; units: number }[];
};

/** Pure maths for the overview, kept separate so it can be tested. */
export function summarise(
  recent: Pick<Order, "status" | "total" | "order_items">[],
  daily: { day: string; value: number; orders: number }[],
  dayKeys: string[],
) {
  const live = recent.filter((o) => o.status !== "cancelled");
  const paid = live.filter((o) => o.status === "paid" || o.status === "delivered");
  const revenue30 = paid.reduce((s, o) => s + o.total, 0);
  const averageOrder = live.length ? live.reduce((s, o) => s + o.total, 0) / live.length : 0;

  const units = new Map<string, number>();
  for (const o of live) for (const i of o.order_items) units.set(i.product_name, (units.get(i.product_name) ?? 0) + i.qty);
  const bestSellers = [...units.entries()]
    .map(([name, u]) => ({ name, units: u }))
    .sort((a, b) => b.units - a.units || a.name.localeCompare(b.name))
    .slice(0, 5);

  const byDay = new Map(daily.map((d) => [d.day, d]));
  const days = dayKeys.map((day) => ({ day, value: byDay.get(day)?.value ?? 0, orders: byDay.get(day)?.orders ?? 0 }));

  return { revenue30, orders30: live.length, averageOrder, bestSellers, days };
}

export async function getOverview(supabase: Supabase, now = new Date()): Promise<Overview> {
  const since = new Date(now.getTime() - 30 * DAY).toISOString();
  const dayKeys = lastNDays(14, now);

  const [recentRes, dailyRes, newRes, confirmedRes] = await Promise.all([
    supabase
      .from("orders")
      .select("status, total, order_items ( product_name, qty )")
      .gte("created_at", since),
    supabase.from("daily_sales").select("day, orders, value").gte("day", dayKeys[0]!),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "confirmed"),
  ]);
  for (const r of [recentRes, dailyRes, newRes, confirmedRes]) {
    if (r.error) throw new Error(`Could not load overview: ${r.error.message}`);
  }

  const recent = z
    .array(
      z.object({
        status: z.enum(ORDER_STATUSES),
        total: z.coerce.number(),
        order_items: z.array(z.object({ product_name: z.string(), qty: z.number() })).default([]),
      }),
    )
    .parse(recentRes.data ?? []);
  const daily = z
    .array(z.object({ day: z.string(), orders: z.coerce.number(), value: z.coerce.number() }))
    .parse(dailyRes.data ?? []);

  return {
    ...summarise(recent as Pick<Order, "status" | "total" | "order_items">[], daily, dayKeys),
    newCount: newRes.count ?? 0,
    confirmedCount: confirmedRes.count ?? 0,
  };
}
