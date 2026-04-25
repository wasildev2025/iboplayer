import * as Sentry from "@sentry/nextjs";
import { NextResponse } from "next/server";
import { captureError } from "@/lib/observability";

/**
 * One-off Sentry verification endpoint. Hitting it sends:
 *   - a captured exception via our observability wrapper
 *   - a captured message
 *   - a flushed unhandled throw (returned as 500)
 *
 * If Sentry is wired correctly, all three should appear in the dashboard
 * within a few seconds. Delete this route after you've confirmed.
 */
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mode = searchParams.get("mode") ?? "wrapper";

  if (mode === "wrapper") {
    captureError(new Error("[sentry-test] wrapper test"), { route: "sentry-test" });
    await Sentry.flush(2000);
    return NextResponse.json({ ok: true, mode, hint: "Check Sentry → Issues" });
  }

  if (mode === "message") {
    Sentry.captureMessage("[sentry-test] message test", "warning");
    await Sentry.flush(2000);
    return NextResponse.json({ ok: true, mode, hint: "Check Sentry → Issues" });
  }

  if (mode === "throw") {
    // Sentry's instrumentation.onRequestError catches this on the next render.
    throw new Error("[sentry-test] unhandled throw test");
  }

  return NextResponse.json({
    ok: false,
    error: "unknown mode",
    valid: ["wrapper", "message", "throw"],
  });
}
