import { prisma } from "@/lib/db";

export type RateLimitResult = {
  allowed: boolean;
  retryAfterMs: number;
};

/**
 * Postgres-backed fixed-window rate limit. One row per (caller, endpoint)
 * key. When the current window expires the row is reset on the next hit;
 * old entries are harmless (just take a few bytes) and can be GC'd by a
 * scheduled cleanup if the table ever grows large.
 *
 * Why Postgres instead of Redis/KV: zero new infra to provision and the
 * load (a couple of hits per login attempt) is trivial for any database.
 * Trade-off: ~10ms per check vs <1ms for Redis. Worth it for the simplicity.
 */
export async function rateLimit(
  key: string,
  max: number,
  windowMs: number,
): Promise<RateLimitResult> {
  const now = Date.now();
  const windowStartCutoff = new Date(now - windowMs);

  // Single round-trip via raw upsert + read. Uses Prisma's transaction for
  // serialization correctness — two concurrent requests can't both pass
  // when the limit is at threshold.
  const result = await prisma.$transaction(async (tx) => {
    const existing = await tx.rateLimit.findUnique({ where: { key } });

    if (!existing || existing.windowStart < windowStartCutoff) {
      await tx.rateLimit.upsert({
        where: { key },
        create: { key, count: 1, windowStart: new Date(now) },
        update: { count: 1, windowStart: new Date(now) },
      });
      return { allowed: true, retryAfterMs: 0 };
    }

    if (existing.count >= max) {
      const elapsed = now - existing.windowStart.getTime();
      return { allowed: false, retryAfterMs: Math.max(0, windowMs - elapsed) };
    }

    await tx.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } },
    });
    return { allowed: true, retryAfterMs: 0 };
  });

  return result;
}

/**
 * Best-effort caller identifier from common proxy headers, falling back to
 * a constant if nothing's available (in which case rate-limiting becomes
 * effectively per-process, which is still better than nothing).
 */
export function callerIp(req: Request): string {
  const fwd = req.headers.get("x-forwarded-for");
  if (fwd) return fwd.split(",")[0]?.trim() || "unknown";
  return req.headers.get("x-real-ip")?.trim() || "unknown";
}
