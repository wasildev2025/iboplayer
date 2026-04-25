import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { refreshChannelsForProfile } from "@/lib/channel-refresh";

/**
 * Manually trigger an M3U re-pull for a profile. Synchronous — caller
 * waits for completion. Returns the refreshed channel count.
 *
 * For large M3Us that exceed Vercel function timeout, the refresh status
 * stays "running" in ChannelRefreshLog and admin can retry.
 */
export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const profileId = Number(id);
  if (!Number.isFinite(profileId)) {
    return NextResponse.json({ error: "Invalid profile id" }, { status: 400 });
  }

  const result = await refreshChannelsForProfile(profileId);
  if (result.status === "failed") {
    return NextResponse.json(
      { error: result.error || "Refresh failed" },
      { status: 502 },
    );
  }
  return NextResponse.json(result);
}

/** Read the current refresh status for a profile (for status polling in the UI). */
export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const log = await prisma.channelRefreshLog.findUnique({
    where: { profileId: Number(id) },
  });
  if (!log) {
    return NextResponse.json({ status: "never", channelCount: 0 });
  }
  return NextResponse.json({
    status: log.status,
    channelCount: log.channelCount,
    error: log.error,
    startedAt: log.startedAt.toISOString(),
    finishedAt: log.finishedAt?.toISOString() ?? null,
  });
}
