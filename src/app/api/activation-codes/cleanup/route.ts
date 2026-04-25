import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAdminOrCron } from "@/lib/cron-auth";

/**
 * Prune `Used` activation codes older than `olderThanDays` (default 90).
 * Triggered by Vercel Cron weekly OR manually by an admin from the
 * dashboard.
 *
 * Body: { olderThanDays?: number }
 */
export async function POST(req: Request) {
  const authError = await requireAdminOrCron(req);
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

// Vercel Cron sends GET. Re-use the POST handler with a default body.
export async function GET(req: Request) {
  return POST(
    new Request(req.url, {
      method: "POST",
      headers: req.headers,
      body: JSON.stringify({}),
    }),
  );
}
