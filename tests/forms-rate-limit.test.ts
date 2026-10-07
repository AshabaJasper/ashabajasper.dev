import { describe, expect, it } from "vitest";
import { SlidingWindowLimiter } from "@/lib/forms/rate-limit";

function clock(start = 0) {
  let t = start;
  return { now: () => t, advance: (ms: number) => (t += ms) };
}

describe("SlidingWindowLimiter", () => {
  it("allows the limit inside a window and refuses the next hit", () => {
    const c = clock();
    const limiter = new SlidingWindowLimiter({ limit: 5, windowMs: 60_000, now: c.now });
    for (let i = 0; i < 5; i++) expect(limiter.hit("a")).toBe(true);
    expect(limiter.hit("a")).toBe(false);
    expect(limiter.hit("b")).toBe(true);
  });

  it("slides: old hits fall out one by one", () => {
    const c = clock();
    const limiter = new SlidingWindowLimiter({ limit: 2, windowMs: 1000, now: c.now });
    expect(limiter.hit("a")).toBe(true); // t=0
    c.advance(600);
    expect(limiter.hit("a")).toBe(true); // t=600
    expect(limiter.hit("a")).toBe(false);
    c.advance(401); // t=1001: the first hit has left the window
    expect(limiter.hit("a")).toBe(true);
    expect(limiter.hit("a")).toBe(false);
    c.advance(600); // t=1601: the t=600 hit has left
    expect(limiter.hit("a")).toBe(true);
  });

  it("refused hits do not extend the wait", () => {
    const c = clock();
    const limiter = new SlidingWindowLimiter({ limit: 1, windowMs: 1000, now: c.now });
    expect(limiter.hit("a")).toBe(true);
    for (let i = 0; i < 10; i++) {
      c.advance(50);
      expect(limiter.hit("a")).toBe(false);
    }
    c.advance(501);
    expect(limiter.hit("a")).toBe(true);
  });

  it("keeps memory bounded", () => {
    const c = clock();
    const limiter = new SlidingWindowLimiter({ limit: 3, windowMs: 60_000, maxKeys: 100, now: c.now });
    for (let i = 0; i < 1000; i++) limiter.hit(`key-${i}`);
    expect(limiter.size).toBeLessThanOrEqual(100);
    // The most recent keys are the ones kept.
    expect(limiter.hit("key-999")).toBe(true);
  });

  it("drops expired keys first when over the bound", () => {
    const c = clock();
    const limiter = new SlidingWindowLimiter({ limit: 1, windowMs: 1000, maxKeys: 2, now: c.now });
    limiter.hit("old");
    c.advance(2000);
    limiter.hit("x");
    limiter.hit("y");
    expect(limiter.size).toBe(2);
    expect(limiter.hit("x")).toBe(false);
  });

  it("refuses a limit below one", () => {
    expect(() => new SlidingWindowLimiter({ limit: 0, windowMs: 1000 })).toThrow();
  });
});
