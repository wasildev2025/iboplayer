import { NextResponse } from "next/server";
import { rateLimit } from "@/lib/rate-limit";

/**
 * Internal-only rate-limit gate called by the edge middleware. Edge runtime
 * can't talk to Prisma; this endpoint runs on Node and does the actual
 * Postgres check.
 *
 * Not for external callers — we hide it behind the same Vercel project
 * boundary and don't expose it in any docs or admin UI.
 */
export async function POST(req: Request) {
  const body = (await req.json().catch(() => ({}))) as {
    key?: string;
    max?: number;
    windowMs?: number;
  };

  const key = typeof body.key === "string" && body.key.length > 0 ? body.key : null;
  const max = typeof body.max === "number" && body.max > 0 ? body.max : 10;
  const windowMs =
    typeof body.windowMs === "number" && body.windowMs > 0 ? body.windowMs : 60_000;

  if (!key) {
    return NextResponse.json({ error: "key required" }, { status: 400 });
  }

  const result = await rateLimit(key, max, windowMs);
  if (!result.allowed) {
    return NextResponse.json(
      { allowed: false, retryAfterMs: result.retryAfterMs },
      { status: 429 },
    );
  }
  return NextResponse.json({ allowed: true });
}
