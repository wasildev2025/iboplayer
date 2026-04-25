import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPlayerToken } from "@/lib/player-jwt";

/**
 * Per-device favorite channels.
 *
 * GET  /api/player/favorites?playlistId=X        — list this device's favorites for the playlist's profile
 * POST /api/player/favorites { channelId, on }   — toggle a favorite on/off
 *
 * All bearer-authed; only macUser tokens (not activation-only ones) can
 * mutate favorites since favorites belong to a registered device.
 */

function getMacUserIdFromToken(sub: string): number | null {
  const [kind, idStr] = sub.split(":");
  if (kind !== "macUser") return null;
  const id = Number(idStr);
  return Number.isFinite(id) ? id : null;
}

async function profileForPlaylist(macUserId: number, playlistId: number): Promise<number | null> {
  const playlist = await prisma.playlist.findFirst({
    where: { id: playlistId, macUserId },
    select: { profileId: true },
  });
  return playlist?.profileId ?? null;
}

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyPlayerToken(auth.slice(7).trim());
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const macUserId = getMacUserIdFromToken(payload.sub);
  if (!macUserId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  const { searchParams } = new URL(req.url);
  const playlistId = Number(searchParams.get("playlistId") ?? "");
  if (!Number.isFinite(playlistId)) {
    return NextResponse.json({ error: "playlistId required" }, { status: 400 });
  }
  const profileId = await profileForPlaylist(macUserId, playlistId);
  if (!profileId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Only return favorites whose channel is on this profile (in case the
  // profile was rotated and channels regenerated — old favorites get
  // pruned by ON DELETE CASCADE on Channel, but defensive scope here).
  const favorites = await prisma.favorite.findMany({
    where: { macUserId, channel: { profileId } },
    include: { channel: true },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({
    data: favorites.map((f) => ({
      id: f.channel.id,
      externalId: f.channel.externalId,
      name: f.channel.name,
      url: f.channel.url,
      logo: f.channel.logo,
      groupName: f.channel.groupName,
      category: f.channel.category,
      favoritedAt: f.createdAt.toISOString(),
    })),
  });
}

export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyPlayerToken(auth.slice(7).trim());
  if (!payload) return NextResponse.json({ error: "Invalid token" }, { status: 401 });

  const macUserId = getMacUserIdFromToken(payload.sub);
  if (!macUserId) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  let body: { channelId?: unknown; on?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }
  const channelId = typeof body.channelId === "number" ? body.channelId : NaN;
  const on = body.on !== false; // default to "on" if omitted
  if (!Number.isFinite(channelId)) {
    return NextResponse.json({ error: "channelId required" }, { status: 400 });
  }

  // Verify the channel belongs to a profile this device can access.
  const channel = await prisma.channel.findUnique({
    where: { id: channelId },
    select: { profileId: true },
  });
  if (!channel) return NextResponse.json({ error: "Channel not found" }, { status: 404 });
  const ownsProfile = await prisma.playlist.findFirst({
    where: { macUserId, profileId: channel.profileId },
    select: { id: true },
  });
  if (!ownsProfile) return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  if (on) {
    await prisma.favorite.upsert({
      where: { macUserId_channelId: { macUserId, channelId } },
      create: { macUserId, channelId },
      update: {},
    });
  } else {
    await prisma.favorite.deleteMany({
      where: { macUserId, channelId },
    });
  }

  return NextResponse.json({ success: true, favorited: on });
}
