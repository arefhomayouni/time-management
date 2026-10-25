/**
 * Tiny in-memory rate limiter - no extra dependency, no shared state to
 * manage. Good enough for a single-process deployment, which is what this API
 * is; if it ever runs behind several instances the counter becomes per-instance
 * (still useful, just less strict).
 *
 * Usage: `rateLimit({ windowMs: 15 * 60_000, max: 10 })` counts per client IP
 * and route, and answers 429 with Retry-After once the budget is spent.
 */
const buckets = new Map();

// Keep memory bounded: drop expired buckets whenever the map grows past this.
const MAX_BUCKETS = 5000;

const prune = (now) => {
  if (buckets.size < MAX_BUCKETS) return;
  for (const [key, bucket] of buckets) {
    if (bucket.resetAt <= now) buckets.delete(key);
  }
};

export const rateLimit = ({ windowMs = 15 * 60_000, max = 20, message } = {}) => {
  return (req, res, next) => {
    const now = Date.now();
    prune(now);

    const key = `${req.ip}|${req.method}|${req.baseUrl}${req.path}`;
    let bucket = buckets.get(key);

    if (!bucket || bucket.resetAt <= now) {
      bucket = { count: 0, resetAt: now + windowMs };
      buckets.set(key, bucket);
    }

    bucket.count += 1;
    const remaining = Math.max(max - bucket.count, 0);
    res.setHeader("X-RateLimit-Limit", String(max));
    res.setHeader("X-RateLimit-Remaining", String(remaining));

    if (bucket.count > max) {
      const retryAfter = Math.ceil((bucket.resetAt - now) / 1000);
      res.setHeader("Retry-After", String(retryAfter));
      return res.status(429).json({
        success: false,
        message:
          message || "Too many attempts. Please wait a few minutes and try again.",
      });
    }

    next();
  };
};

/** Test helper: forget every counter. */
export const resetRateLimits = () => buckets.clear();
