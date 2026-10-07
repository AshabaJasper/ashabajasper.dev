/**
 * In-memory sliding-window rate limit, per process. It is the cheap first
 * gate in front of the database counts, which are the real limit across
 * restarts. Memory stays bounded: each key keeps at most `limit` timestamps
 * and the map never holds more than `maxKeys` keys.
 */

export interface RateLimiterOptions {
  /** Hits allowed inside one window. */
  limit: number;
  windowMs: number;
  /** Most keys kept at once; the oldest are dropped first. */
  maxKeys?: number;
  /** Injected clock, in milliseconds. */
  now?: () => number;
}

export class SlidingWindowLimiter {
  private readonly hits = new Map<string, number[]>();
  private readonly limit: number;
  private readonly windowMs: number;
  private readonly maxKeys: number;
  private readonly now: () => number;

  constructor(options: RateLimiterOptions) {
    if (options.limit < 1) throw new Error("limit must be at least 1");
    this.limit = options.limit;
    this.windowMs = options.windowMs;
    this.maxKeys = options.maxKeys ?? 10_000;
    this.now = options.now ?? (() => Date.now());
  }

  /** Record one hit. True when it is allowed, false when the key is over its limit. */
  hit(key: string): boolean {
    const now = this.now();
    const since = now - this.windowMs;
    const recent = (this.hits.get(key) ?? []).filter((t) => t > since);

    if (recent.length >= this.limit) {
      this.hits.set(key, recent);
      return false;
    }
    recent.push(now);
    // Re-insert so the map's insertion order is least recently used first.
    this.hits.delete(key);
    this.hits.set(key, recent);
    this.evict(since);
    return true;
  }

  /** How many keys are tracked (for tests and diagnostics). */
  get size(): number {
    return this.hits.size;
  }

  clear(): void {
    this.hits.clear();
  }

  private evict(since: number): void {
    if (this.hits.size <= this.maxKeys) return;
    for (const [key, times] of this.hits) {
      if (times[times.length - 1] <= since) this.hits.delete(key);
    }
    while (this.hits.size > this.maxKeys) {
      const oldest = this.hits.keys().next().value;
      if (oldest === undefined) break;
      this.hits.delete(oldest);
    }
  }
}
