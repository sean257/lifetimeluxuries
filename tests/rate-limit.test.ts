import { describe, expect, it } from "vitest";
import { createRateLimiter } from "@/lib/rate-limit";

describe("createRateLimiter", () => {
  it("allows 5 orders per IP per 10 minutes", () => {
    const rl = createRateLimiter({ limit: 5, windowMs: 600_000 });
    const t = 1_000_000;
    for (let i = 0; i < 5; i++) expect(rl.check("1.2.3.4", t + i)).toBe(true);
    expect(rl.check("1.2.3.4", t + 10)).toBe(false);
    expect(rl.check("5.6.7.8", t + 10)).toBe(true);
    expect(rl.check("1.2.3.4", t + 600_001)).toBe(true);
  });
});
