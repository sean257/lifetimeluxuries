import { describe, expect, it, vi } from "vitest";
import { lastNDays, harareDay, formatTime } from "@/lib/dates";
import { customerReplyText, formatPhoneDisplay } from "@/lib/phone";

vi.mock("server-only", () => ({}));
const { summarise } = await import("@/lib/orders");

const item = (product_name: string, qty: number) => ({ id: product_name, product_id: null, product_name, unit_price: 0, qty });

describe("summarise", () => {
  const recent = [
    { status: "new" as const, total: 1460, order_items: [item("Regent Chronograph 42", 1)] },
    { status: "paid" as const, total: 1580, order_items: [item("Regent Chronograph 42", 1), item("Rose Gold Cufflinks", 1)] },
    { status: "delivered" as const, total: 120, order_items: [item("Rose Gold Cufflinks", 1)] },
    { status: "cancelled" as const, total: 9999, order_items: [item("Field Classic 38", 5)] },
  ];

  it("counts revenue from Paid + Delivered only, and ignores cancelled orders", () => {
    const s = summarise(recent, [], ["2026-11-12"]);
    expect(s.revenue30).toBe(1700);
    expect(s.orders30).toBe(3);
    expect(s.averageOrder).toBeCloseTo((1460 + 1580 + 120) / 3);
  });

  it("ranks best sellers by units, excluding cancelled", () => {
    const s = summarise(recent, [], []);
    expect(s.bestSellers).toEqual([
      { name: "Regent Chronograph 42", units: 2 },
      { name: "Rose Gold Cufflinks", units: 2 },
    ]);
  });

  it("fills missing days with zero", () => {
    const s = summarise([], [{ day: "2026-11-11", value: 500, orders: 1 }], ["2026-11-10", "2026-11-11", "2026-11-12"]);
    expect(s.days.map((d) => d.value)).toEqual([0, 500, 0]);
  });

  it("handles no orders", () => {
    const s = summarise([], [], []);
    expect(s).toMatchObject({ revenue30: 0, orders30: 0, averageOrder: 0, bestSellers: [] });
  });
});

describe("dates in Harare time", () => {
  it("rolls over at Harare midnight, not UTC", () => {
    // 22:30 UTC on 11 Nov is 00:30 on 12 Nov in Harare (UTC+2).
    expect(harareDay(new Date("2026-11-11T22:30:00Z"))).toBe("2026-11-12");
    expect(formatTime(new Date("2026-11-11T22:30:00Z"))).toBe("00:30");
  });
  it("lists the last 14 days ending today", () => {
    const days = lastNDays(14, new Date("2026-11-12T10:00:00Z"));
    expect(days).toHaveLength(14);
    expect(days[0]).toBe("2026-10-30");
    expect(days[13]).toBe("2026-11-12");
  });
});

describe("phone display", () => {
  it("formats Zimbabwe numbers and greets by first name", () => {
    expect(formatPhoneDisplay("263772118430")).toBe("+263 77 211 8430");
    expect(formatPhoneDisplay("447700900123")).toBe("+447700900123");
    expect(customerReplyText("Tendai Moyo", "LL-1001")).toBe("Hello Tendai, this is Lifetime Luxuries about your order LL-1001.");
  });
});
