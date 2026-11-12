import { describe, expect, it } from "vitest";
import { cleanWhatsApp, deliveryCode, deliveryListSchema, whatsappSchema } from "@/lib/settings-schema";

describe("whatsappSchema", () => {
  it("accepts international numbers, with or without + and spaces", () => {
    expect(whatsappSchema.parse("263771234567")).toBe("263771234567");
    expect(whatsappSchema.parse("+263 77 123 4567")).toBe("263771234567");
    expect(whatsappSchema.parse("+44 (7700) 900-123")).toBe("447700900123");
  });
  it("refuses local format and wrong lengths with a clear message", () => {
    const local = whatsappSchema.safeParse("0771234567");
    expect(local.success).toBe(false);
    expect(local.error?.issues[0]?.message).toMatch(/without the leading 0/);
    expect(whatsappSchema.safeParse("263771").success).toBe(false);
    expect(whatsappSchema.safeParse("2637712345678901").success).toBe(false);
    expect(whatsappSchema.safeParse("26377abc4567").success).toBe(false);
  });
  it("cleans the way the form does", () => {
    expect(cleanWhatsApp(" +263-77-123-4567 ")).toBe("263771234567");
  });
});

describe("delivery options", () => {
  const row = { code: "harare", label: "Delivery in Harare", is_active: true };
  it("validates labels per row", () => {
    expect(deliveryListSchema.safeParse([row]).success).toBe(true);
    const bad = deliveryListSchema.safeParse([row, { ...row, code: "", label: "" }]);
    expect(bad.error?.issues[0]?.path[0]).toBe(1);
    expect(deliveryListSchema.safeParse([{ ...row, label: " " }]).success).toBe(false);
  });
  it("needs at least one active option", () => {
    const r = deliveryListSchema.safeParse([{ ...row, is_active: false }]);
    expect(r.error?.issues[0]?.message).toMatch(/at least one option switched on/);
  });
  it("makes unique codes from labels", () => {
    expect(deliveryCode("Courier to Bulawayo", new Set())).toBe("courier_to_bulawayo");
    expect(deliveryCode("Delivery in Harare", new Set(["delivery_in_harare"]))).toBe("delivery_in_harare_2");
    expect(deliveryCode("!!!", new Set())).toBe("option");
  });
});
