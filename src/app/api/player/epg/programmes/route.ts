import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPlayerToken } from "@/lib/player-jwt";

/**
 * Full programme listing for a single channel within a time window. Used by
 * the per-channel EPG details view in the player.
 *
 * GET /api/player/epg/programmes?playlistId=X&channelId=Y[&from=ISO][&to=ISO]
 *
 * Defaults: from = now - 1h, to = now + 24h.
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyPlayerToken(auth.slice(7).trim());
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const playlistId = Number(searchParams.get("playlistId") ?? "");
  const channelId = Number(searchParams.get("channelId") ?? "");
  if (!Number.isFinite(playlistId) || !Number.isFinite(channelId)) {
    return NextResponse.json({ error: "playlistId + channelId required" }, { status: 400 });
  }

  const now = Date.now();
  const from = parseTime(searchParams.get("from")) ?? new Date(now - 60 * 60 * 1000);
  const to = parseTime(searchParams.get("to")) ?? new Date(now + 24 * 60 * 60 * 1000);
  if (to <= from) {
    return NextResponse.json({ error: "`to` must be after `from`" }, { status: 400 });
  }

  const profileId = await resolveProfileForToken(payload.sub, playlistId);
  if (!profileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const channel = await prisma.channel.findFirst({
    where: { id: channelId, profileId },
    select: { externalId: true },
  });
  if (!channel) return NextResponse.json({ data: [] });

  const epgChannel = await prisma.epgChannel.findUnique({
    where: { profileId_epgChannelId: { profileId, epgChannelId: channel.externalId } },
    select: { id: true },
  });
  if (!epgChannel) return NextResponse.json({ data: [] });

  const programmes = await prisma.epgProgramme.findMany({
    where: {
      epgChannelId: epgChannel.id,
      stopUtc: { gt: from },
      startUtc: { lt: to },
    },
    orderBy: { startUtc: "asc" },
    take: 500,
  });

  return NextResponse.json({
    data: programmes.map((p) => ({
      title: p.title,
      description: p.description,
      startUtc: p.startUtc.toISOString(),
      stopUtc: p.stopUtc.toISOString(),
    })),
  });
}

function parseTime(raw: string | null): Date | null {
  if (!raw) return null;
  const d = new Date(raw);
  return Number.isNaN(d.getTime()) ? null : d;
}

async function resolveProfileForToken(sub: string, playlistId: number): Promise<number | null> {
  const [kind, idStr] = sub.split(":");
  const id = Number(idStr);
  if (!Number.isFinite(id)) return null;
  if (kind === "macUser") {
    const playlist = await prisma.playlist.findFirst({
      where: { id: playlistId, macUserId: id },
      select: { profileId: true },
    });
    return playlist?.profileId ?? null;
  }
  if (kind === "activation") {
    if (playlistId !== id) return null;
    const code = await prisma.activationCode.findUnique({
      where: { id },
      select: { profileId: true },
    });
    return code?.profileId ?? null;
  }
  return null;
}
