import { describe, expect, it } from "vitest";
import { formatPrice, stockNote } from "@/lib/format";
import { productEnquiryText, waLink } from "@/lib/whatsapp";

describe("formatPrice", () => {
  it("formats whole US dollars with separators", () => {
    expect(formatPrice(1450)).toBe("$1,450");
    expect(formatPrice(2150.0)).toBe("$2,150");
    expect(formatPrice(65)).toBe("$65");
    expect(formatPrice(0)).toBe("$0");
  });
  it("accepts numeric strings from Postgres and rounds", () => {
    expect(formatPrice("1580.00")).toBe("$1,580");
    expect(formatPrice(99.6)).toBe("$100");
  });
});

describe("stockNote", () => {
  it("shows sold out, low stock and in stock", () => {
    expect(stockNote(0)).toMatch(/^Sold out/);
    expect(stockNote(1)).toBe("Only 1 left");
    expect(stockNote(2)).toBe("Only 2 left");
    expect(stockNote(3)).toBe("In stock");
  });
});

describe("waLink", () => {
  it("builds a wa.me link with an encoded message", () => {
    const text = productEnquiryText("Regent Chronograph 42", "$1,450");
    expect(waLink("263771234567", text)).toBe(`https://wa.me/263771234567?text=${encodeURIComponent(text)}`);
    expect(waLink("+263 77 123 4567")).toBe("https://wa.me/263771234567");
  });
});
