import { requireAuth } from "@/lib/api-auth";
import { NextResponse } from "next/server";

/**
 * Allow either an authenticated admin session OR a valid Vercel Cron
 * invocation. Vercel Cron sends an `Authorization: Bearer <CRON_SECRET>`
 * header on every cron-triggered request — we verify it against
 * `process.env.CRON_SECRET`.
 *
 * Returns null when authorized, or a NextResponse with the error to return.
 */
export async function requireAdminOrCron(req: Request): Promise<NextResponse | null> {
  const cronSecret = process.env.CRON_SECRET;
  const authHeader = req.headers.get("authorization") || "";
  if (
    cronSecret &&
    authHeader === `Bearer ${cronSecret}`
  ) {
    return null;
  }
  return await requireAuth();
}
