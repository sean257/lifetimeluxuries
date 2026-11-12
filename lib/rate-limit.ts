/**
 * Fixed-window-per-key limiter kept in memory. Good enough for v1 on one
 * server instance; swap for Upstash when traffic needs it.
 */
export function createRateLimiter({ limit, windowMs }: { limit: number; windowMs: number }) {
  const hits = new Map<string, number[]>();
  return {
    /** Records a hit and returns false when the key is over the limit. */
    check(key: string, now = Date.now()): boolean {
      const recent = (hits.get(key) ?? []).filter((t) => now - t < windowMs);
      if (recent.length >= limit) {
        hits.set(key, recent);
        return false;
      }
      recent.push(now);
      hits.set(key, recent);
      if (hits.size > 5000) {
        for (const [k, ts] of hits) if (ts.every((t) => now - t >= windowMs)) hits.delete(k);
      }
      return true;
    },
  };
}
