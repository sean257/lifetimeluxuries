import { describe, expect, it } from "vitest";
import { orderInputSchema } from "@/lib/schemas";

const ID = "6f1c2b8e-3d4a-4b5c-9d6e-7f8091a2b3c4";
const valid = {
  name: "  Tendai Moyo ",
  phone: "077 211 8430",
  delivery: "harare",
  notes: "Gate code 44",
  items: [{ product_id: ID, qty: 1 }],
  website: "",
};

describe("orderInputSchema", () => {
  it("accepts a valid order and trims text", () => {
    const r = orderInputSchema.parse(valid);
    expect(r.name).toBe("Tendai Moyo");
    expect(r.items).toHaveLength(1);
  });

  it("explains a missing name and a bad phone in customer words", () => {
    const noName = orderInputSchema.safeParse({ ...valid, name: "  " });
    expect(noName.success).toBe(false);
    expect(noName.error?.issues[0]?.message).toBe("Add your name so we know who the order is for.");
    const badPhone = orderInputSchema.safeParse({ ...valid, phone: "12" });
    expect(badPhone.error?.issues[0]?.path).toEqual(["phone"]);
  });

  it("rejects an empty bag, bad ids and silly quantities", () => {
    expect(orderInputSchema.safeParse({ ...valid, items: [] }).success).toBe(false);
    expect(orderInputSchema.safeParse({ ...valid, items: [{ product_id: "x", qty: 1 }] }).success).toBe(false);
    expect(orderInputSchema.safeParse({ ...valid, items: [{ product_id: ID, qty: 0 }] }).success).toBe(false);
    expect(orderInputSchema.safeParse({ ...valid, items: [{ product_id: ID, qty: 21 }] }).success).toBe(false);
    expect(orderInputSchema.safeParse({ ...valid, items: [{ product_id: ID, qty: 1.5 }] }).success).toBe(false);
  });

  it("rejects a filled honeypot and odd delivery codes", () => {
    expect(orderInputSchema.safeParse({ ...valid, website: "http://spam" }).success).toBe(false);
    expect(orderInputSchema.safeParse({ ...valid, delivery: "DROP TABLE" }).success).toBe(false);
  });

  it("caps notes at 1,000 characters", () => {
    expect(orderInputSchema.safeParse({ ...valid, notes: "x".repeat(1001) }).success).toBe(false);
  });
});
