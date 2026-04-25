import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPlayerToken } from "@/lib/player-jwt";

/**
 * Groups + counts for the chip strip in the BrowseScreen. Bearer-authed and
 * scoped to a specific playlist's profile.
 *
 * Query params:
 *   playlistId   required (number)
 *   category     optional — restrict to one category bucket
 */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyPlayerToken(auth.slice(7).trim());
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const playlistId = Number(searchParams.get("playlistId") ?? "");
  if (!Number.isFinite(playlistId)) {
    return NextResponse.json({ error: "playlistId is required" }, { status: 400 });
  }

  const profileId = await resolveProfileForToken(payload.sub, playlistId);
  if (!profileId) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const category = searchParams.get("category") || undefined;

  // Cap at 500 groups — IPTV providers rarely exceed this and bounded
  // results keep payloads small for the chip strip on Android. If a real
  // provider has more, we sort largest-first so the user gets the
  // populated buckets first.
  const rows = await prisma.channel.groupBy({
    by: ["groupName"],
    where: {
      profileId,
      ...(category ? { category } : {}),
      groupName: { not: null },
    },
    _count: { _all: true },
    orderBy: { _count: { groupName: "desc" } },
    take: 500,
  });

  return NextResponse.json({
    data: rows.map((r) => ({
      groupName: r.groupName,
      count: r._count._all,
    })),
  });
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
