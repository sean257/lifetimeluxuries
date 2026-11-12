import { describe, expect, it } from "vitest";
import { isValidPhone, normalisePhone } from "@/lib/phone";

describe("normalisePhone", () => {
  it("turns local 07… numbers into 2637…", () => {
    expect(normalisePhone("077 211 8430")).toBe("263772118430");
    expect(normalisePhone("0772-118-430")).toBe("263772118430");
  });
  it("keeps international numbers and strips + and spaces", () => {
    expect(normalisePhone("+263 77 211 8430")).toBe("263772118430");
    expect(normalisePhone("27821234567")).toBe("27821234567");
  });
});

describe("isValidPhone", () => {
  it("accepts 9 to 15 digits after normalising", () => {
    expect(isValidPhone("077 211 8430")).toBe(true);
    expect(isValidPhone("+44 7700 900123")).toBe(true);
  });
  it("rejects short, empty and overlong numbers", () => {
    expect(isValidPhone("")).toBe(false);
    expect(isValidPhone("0771")).toBe(false);
    expect(isValidPhone("1234567890123456")).toBe(false);
  });
});
