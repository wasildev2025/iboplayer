import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

/**
 * Edge middleware. Currently only used to rate-limit admin auth attempts —
 * NextAuth's CredentialsProvider has no clean hook for IP-based throttling,
 * so we gate the inbound POST to /api/auth/callback/credentials before it
 * reaches the handler.
 *
 * The rate-limit check itself runs on the Node runtime via a separate
 * internal endpoint because Prisma can't run on the Edge — we forward the
 * caller IP and let that endpoint decide.
 */
export async function middleware(req: NextRequest) {
  if (
    req.method === "POST" &&
    req.nextUrl.pathname === "/api/auth/callback/credentials"
  ) {
    const ip =
      req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      req.headers.get("x-real-ip")?.trim() ||
      "unknown";

    // Forward the rate-limit check to a node-runtime endpoint that has
    // Prisma available.
    const rlUrl = new URL("/api/internal/rate-limit-check", req.url);
    const rlRes = await fetch(rlUrl, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ key: `login:${ip}`, max: 10, windowMs: 60_000 }),
    });

    if (rlRes.status === 429) {
      const json = await rlRes.json().catch(() => ({}));
      return NextResponse.json(
        { error: "Too many login attempts. Try again shortly." },
        {
          status: 429,
          headers: {
            "retry-after": String(Math.ceil((json.retryAfterMs ?? 60_000) / 1000)),
          },
        },
      );
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/api/auth/callback/:path*"],
};
