import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

/**
 * Prune `Used` activation codes older than `olderThanDays` (default 90).
 * Run periodically — either manually from the dashboard or via a Vercel
 * Cron Job pointed at this endpoint with the admin session.
 *
 * Body: { olderThanDays?: number }
 */
export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const body = (await req.json().catch(() => ({}))) as { olderThanDays?: unknown };
  const days =
    typeof body.olderThanDays === "number" && body.olderThanDays > 0
      ? body.olderThanDays
      : 90;

  const cutoff = new Date(Date.now() - days * 24 * 60 * 60 * 1000);

  const result = await prisma.activationCode.deleteMany({
    where: {
      status: "Used",
      createdAt: { lt: cutoff },
    },
  });

  return NextResponse.json({
    deleted: result.count,
    cutoff: cutoff.toISOString(),
  });
}
