import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPlayerToken } from "@/lib/player-jwt";

/**
 * Paginated channels for the device's connected playlist. Replaces the
 * device-side Room channel cache.
 *
 * Bearer auth via player JWT. The token's macUserId/activationId is used to
 * scope which profile's channels can be read — devices can't query channels
 * for profiles they don't own.
 *
 * Query params:
 *   playlistId   required (number) — the device's playlist row to read against
 *   category     optional — live | movies | series | sports
 *   group        optional — exact groupName match
 *   search       optional — case-insensitive substring on name
 *   page         optional — 1-based, default 1
 *   pageSize     optional — default 50, capped at 200
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
  const group = searchParams.get("group") || undefined;
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") ?? "1"));
  const pageSize = Math.min(
    200,
    Math.max(1, Number(searchParams.get("pageSize") ?? "50")),
  );

  const where = {
    profileId,
    ...(category ? { category } : {}),
    ...(group ? { groupName: group } : {}),
    ...(search
      ? { name: { contains: search, mode: "insensitive" as const } }
      : {}),
  };

  const [items, total] = await Promise.all([
    prisma.channel.findMany({
      where,
      orderBy: [{ name: "asc" }],
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.channel.count({ where }),
  ]);

  return NextResponse.json({
    data: items.map((c) => ({
      id: c.id,
      externalId: c.externalId,
      name: c.name,
      url: c.url,
      logo: c.logo,
      groupName: c.groupName,
      category: c.category,
    })),
    page,
    pageSize,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}

/**
 * Resolve which CredentialProfile the token may read channels from. The
 * token holder must own the requested playlistId. Activation-scoped tokens
 * resolve via the activation code's profile.
 */
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
    // Activation tokens get a virtual single playlist matching the code id.
    if (playlistId !== id) return null;
    const code = await prisma.activationCode.findUnique({
      where: { id },
      select: { profileId: true },
    });
    return code?.profileId ?? null;
  }

  return null;
}
