import { describe, expect, it } from "vitest";
import { slugify, SLUG_RE } from "@/lib/slug";
import { productInputSchema } from "@/lib/product-schema";
import { fitWithin } from "@/lib/image-prep";

describe("slugify", () => {
  it("makes slugs the database accepts", () => {
    expect(slugify("Regent Chronograph 42")).toBe("regent-chronograph-42");
    expect(slugify("Tiger's Eye Bracelet")).toBe("tigers-eye-bracelet");
    expect(slugify("  Café — Rose & Gold!! ")).toBe("cafe-rose-and-gold");
    expect(slugify("---")).toBe("");
    for (const s of ["Regent Chronograph 42", "Tiger's Eye", "A  B", "x".repeat(200)]) {
      expect(SLUG_RE.test(slugify(s))).toBe(true);
    }
  });
});

const base = {
  name: "Regent Chronograph 42",
  slug: "regent-chronograph-42",
  category: "watch",
  subtitle: "",
  description: "",
  price: "1450",
  stock: "4",
  badge: "",
  is_featured: false,
  is_published: true,
  specs: [{ label: "Case", value: "42 mm" }],
};

describe("productInputSchema", () => {
  it("coerces numbers and turns empty text into null", () => {
    const r = productInputSchema.parse(base);
    expect(r.price).toBe(1450);
    expect(r.stock).toBe(4);
    expect(r.subtitle).toBeNull();
    expect(r.badge).toBeNull();
  });
  it("rejects cents, negatives, bad slugs and half-filled specs", () => {
    expect(productInputSchema.safeParse({ ...base, price: "14.50" }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, stock: "-1" }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, slug: "Regent Chrono" }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, slug: "regent--42" }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, category: "ring" }).success).toBe(false);
    expect(productInputSchema.safeParse({ ...base, specs: [{ label: "Case", value: "" }] }).success).toBe(false);
  });
  it("names the field that is wrong", () => {
    const r = productInputSchema.safeParse({ ...base, name: " " });
    expect(r.error?.issues[0]?.path).toEqual(["name"]);
    expect(r.error?.issues[0]?.message).toBe("Add a product name.");
  });
});

describe("fitWithin", () => {
  it("caps the long edge at 1600 and never upscales", () => {
    expect(fitWithin(4032, 3024)).toEqual({ width: 1600, height: 1200 });
    expect(fitWithin(3024, 4032)).toEqual({ width: 1200, height: 1600 });
    expect(fitWithin(800, 600)).toEqual({ width: 800, height: 600 });
  });
});
