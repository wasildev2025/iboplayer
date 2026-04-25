import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

/**
 * Diagnostic for "what actually got fetched + bucketed under this profile".
 *
 * GET /api/credential-profiles/{id}/category-debug
 *
 * Returns counts per category and a small sample of channels per bucket
 * (id, name, group, URL prefix). Lets an admin eyeball whether a feed's
 * channels landed where they should — without exporting the full table.
 */
export async function GET(
  req: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { id } = await params;
  const profileId = Number(id);
  if (!Number.isFinite(profileId)) {
    return NextResponse.json({ error: "Invalid profile id" }, { status: 400 });
  }

  const { searchParams } = new URL(req.url);
  const sampleSize = Math.min(
    50,
    Math.max(1, Number(searchParams.get("sampleSize") ?? "10")),
  );

  const counts = await prisma.channel.groupBy({
    by: ["category"],
    where: { profileId },
    _count: { _all: true },
  });

  const categories = ["live", "movies", "series", "sports"];
  const samples: Record<string, unknown[]> = {};
  for (const cat of categories) {
    samples[cat] = await prisma.channel.findMany({
      where: { profileId, category: cat },
      select: {
        id: true,
        name: true,
        url: true,
        groupName: true,
        category: true,
      },
      orderBy: { id: "asc" },
      take: sampleSize,
    });
  }

  // Top group names per category — quick sanity check that real groups
  // landed where you'd expect.
  const topGroups: Record<string, { groupName: string | null; count: number }[]> = {};
  for (const cat of categories) {
    const grp = await prisma.channel.groupBy({
      by: ["groupName"],
      where: { profileId, category: cat },
      _count: { _all: true },
      orderBy: { _count: { groupName: "desc" } },
      take: 10,
    });
    topGroups[cat] = grp.map((g) => ({
      groupName: g.groupName,
      count: g._count._all,
    }));
  }

  const total = await prisma.channel.count({ where: { profileId } });

  return NextResponse.json({
    profileId,
    total,
    counts: Object.fromEntries(counts.map((c) => [c.category, c._count._all])),
    topGroups,
    samples,
  });
}
