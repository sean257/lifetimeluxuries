import { describe, expect, it } from "vitest";
import { buildOrderMessage } from "@/lib/order-message";

describe("buildOrderMessage", () => {
  it("matches the format in CLAUDE.md exactly", () => {
    const msg = buildOrderMessage({
      ref: "LL-1001",
      items: [
        { name: "Regent Chronograph 42", qty: 1, line_total: 1450 },
        { name: "Rose Gold Cufflinks", qty: 1, line_total: 120 },
      ],
      subtotal: 1570,
      delivery_label: "Delivery in Harare",
      delivery_fee: 10,
      total: 1580,
      name: "Tendai Moyo",
      phone: "077 211 8430",
      notes: "Gate code 44",
    });
    expect(msg).toBe(
      [
        "Hello Lifetime Luxuries, I'd like to place an order.",
        "",
        "Order LL-1001",
        "1 × Regent Chronograph 42 — $1,450",
        "1 × Rose Gold Cufflinks — $120",
        "",
        "Subtotal: $1,570",
        "Delivery: Delivery in Harare ($10)",
        "Total: $1,580",
        "",
        "Name: Tendai Moyo",
        "Phone: 077 211 8430",
        "Notes: Gate code 44",
      ].join("\n"),
    );
  });

  it("omits the fee for free delivery, and the notes line when empty", () => {
    const msg = buildOrderMessage({
      ref: "LL-1002",
      items: [{ name: "Italian Leather Strap", qty: 2, line_total: 170 }],
      subtotal: 170,
      delivery_label: "Collect in Harare",
      delivery_fee: 0,
      total: 170,
      name: "Farai Ncube",
      phone: " 0773405512 ",
      notes: "   ",
    });
    expect(msg).toContain("2 × Italian Leather Strap — $170");
    expect(msg).toContain("Delivery: Collect in Harare\n");
    expect(msg.endsWith("Phone: 0773405512")).toBe(true);
    expect(msg).not.toContain("Notes:");
  });

  it("survives the wa.me round trip", () => {
    const msg = buildOrderMessage({
      ref: "LL-1003",
      items: [{ name: "Tiger's Eye Bracelet", qty: 1, line_total: 65 }],
      subtotal: 65,
      delivery_label: "Courier to another city",
      delivery_fee: 25,
      total: 90,
      name: "Rumbi & Co",
      phone: "+263 77 401 9362",
      notes: "Ring #2 @ gate?",
    });
    expect(decodeURIComponent(encodeURIComponent(msg))).toBe(msg);
  });
});
