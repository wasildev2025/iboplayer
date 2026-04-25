import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPlayerToken } from "@/lib/player-jwt";

/**
 * Now/next EPG lookup for a batch of channels — used to overlay programme
 * info on the Browse grid.
 *
 * GET /api/player/epg/now-next?playlistId=X&channelIds=1,2,3
 *
 * Returns one entry per requested channel id (only those that map to an
 * EpgChannel and have current or upcoming programmes). Channels with no EPG
 * data are simply omitted.
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
  if (!Number.isFinite(playlistId)) {
    return NextResponse.json({ error: "playlistId required" }, { status: 400 });
  }
  const channelIdsParam = searchParams.get("channelIds") ?? "";
  const channelIds = channelIdsParam
    .split(",")
    .map((x) => Number(x.trim()))
    .filter((x) => Number.isFinite(x));
  if (channelIds.length === 0) {
    return NextResponse.json({ data: [] });
  }
  if (channelIds.length > 200) {
    return NextResponse.json({ error: "Too many channelIds (max 200)" }, { status: 400 });
  }

  const profileId = await resolveProfileForToken(payload.sub, playlistId);
  if (!profileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Resolve Channel.id → externalId, scoped to this profile so devices can't
  // peek into other profiles' EPG by id-spoofing.
  const channels = await prisma.channel.findMany({
    where: { id: { in: channelIds }, profileId },
    select: { id: true, externalId: true },
  });
  if (channels.length === 0) return NextResponse.json({ data: [] });

  const externalIds = channels.map((c) => c.externalId);
  const epgChannels = await prisma.epgChannel.findMany({
    where: { profileId, epgChannelId: { in: externalIds } },
    select: { id: true, epgChannelId: true },
  });
  if (epgChannels.length === 0) return NextResponse.json({ data: [] });

  // Programmes that are running now or start in the next 24h. Two-per-channel
  // (now + next) is enough for the grid overlay; cap with `take` defensively.
  const now = new Date();
  const horizon = new Date(now.getTime() + 24 * 60 * 60 * 1000);
  const epgChannelIds = epgChannels.map((c) => c.id);
  const programmes = await prisma.epgProgramme.findMany({
    where: {
      epgChannelId: { in: epgChannelIds },
      stopUtc: { gt: now },
      startUtc: { lt: horizon },
    },
    orderBy: { startUtc: "asc" },
    take: epgChannelIds.length * 4,
  });

  // Group + collapse to (now, next) per epgChannelId
  const byEpgChannel = new Map<number, { now: typeof programmes[number] | null; next: typeof programmes[number] | null }>();
  for (const p of programmes) {
    const slot = byEpgChannel.get(p.epgChannelId) ?? { now: null, next: null };
    if (p.startUtc <= now && p.stopUtc > now && !slot.now) slot.now = p;
    else if (p.startUtc > now && !slot.next) slot.next = p;
    byEpgChannel.set(p.epgChannelId, slot);
  }

  // Stitch back to the requested Channel.id
  const epgIdLookup = new Map<string, number>(); // externalId -> EpgChannel.id
  for (const ec of epgChannels) epgIdLookup.set(ec.epgChannelId, ec.id);

  const data = channels
    .map((c) => {
      const epgId = epgIdLookup.get(c.externalId);
      if (epgId == null) return null;
      const slot = byEpgChannel.get(epgId);
      if (!slot || (!slot.now && !slot.next)) return null;
      return {
        channelId: c.id,
        now: slot.now
          ? {
              title: slot.now.title,
              startUtc: slot.now.startUtc.toISOString(),
              stopUtc: slot.now.stopUtc.toISOString(),
            }
          : null,
        next: slot.next
          ? {
              title: slot.next.title,
              startUtc: slot.next.startUtc.toISOString(),
              stopUtc: slot.next.stopUtc.toISOString(),
            }
          : null,
      };
    })
    .filter((x): x is NonNullable<typeof x> => x !== null);

  return NextResponse.json({ data });
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
