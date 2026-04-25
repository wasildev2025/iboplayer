import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrCron } from "@/lib/cron-auth";

/**
 * Daily sweep that drops rate_limit rows whose window has fully expired.
 * Without this, every unique IP that ever hit a rate-limited endpoint
 * stays in the table forever — millions of stale rows over time.
 */
async function run() {
  // Anything older than 24h is well past every window we use (currently
  // 60s max). Safe to delete.
  const cutoff = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const result = await prisma.rateLimit.deleteMany({
    where: { windowStart: { lt: cutoff } },
  });
  return { deleted: result.count, cutoff: cutoff.toISOString() };
}

export async function POST(req: Request) {
  const authError = await requireAdminOrCron(req);
  if (authError) return authError;
  return NextResponse.json(await run());
}

export async function GET(req: Request) {
  const authError = await requireAdminOrCron(req);
  if (authError) return authError;
  return NextResponse.json(await run());
}
