import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/**
 * Liveness + readiness probe. Pings the database to confirm the function
 * can both start and reach Postgres. Use this for uptime monitors
 * (UptimeRobot, BetterStack, etc.) — alert when this returns non-200.
 */
export async function GET() {
  try {
    await prisma.$queryRaw`SELECT 1`;
    return NextResponse.json({
      status: "ok",
      timestamp: new Date().toISOString(),
    });
  } catch (e) {
    const message = e instanceof Error ? e.message : "DB unreachable";
    return NextResponse.json(
      { status: "fail", error: message },
      { status: 503 },
    );
  }
}
