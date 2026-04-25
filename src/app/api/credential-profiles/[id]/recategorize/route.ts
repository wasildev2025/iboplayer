import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { categorize } from "@/lib/m3u-server";

// Re-applying categorization is a pure write loop — fast even for big
// profiles. 60s is plenty.
export const maxDuration = 60;

/**
 * Re-categorize existing channels for a profile *without* re-fetching the
 * M3U. Useful after the categorization rules change in code: avoids a full
 * re-pull (which is expensive for 100k-channel profiles) but corrects the
 * `category` column on every existing row.
 *
 * The logic mirrors what the M3U parser does — same `categorize(group, url)`
 * function — so a recategorize is equivalent to a fresh ingest's labelling.
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

  const channels = await prisma.channel.findMany({
    where: { profileId },
    select: { id: true, url: true, groupName: true, category: true },
  });

  // Group channel ids by the category they should land in.
  const buckets = new Map<string, number[]>();
  let changed = 0;
  for (const c of channels) {
    const next = categorize(c.groupName, c.url);
    if (next === c.category) continue;
    changed += 1;
    const arr = buckets.get(next) ?? [];
    arr.push(c.id);
    buckets.set(next, arr);
  }

  // Bulk-update each bucket. Postgres bind-param limit is 32k, so chunk at
  // 5k ids per UPDATE — keeps each round-trip small and well under the cap.
  const CHUNK = 5_000;
  for (const [category, ids] of buckets) {
    for (let i = 0; i < ids.length; i += CHUNK) {
      await prisma.channel.updateMany({
        where: { id: { in: ids.slice(i, i + CHUNK) } },
        data: { category },
      });
    }
  }

  return NextResponse.json({
    profileId,
    inspected: channels.length,
    changed,
    moved: Object.fromEntries(
      Array.from(buckets.entries()).map(([k, v]) => [k, v.length]),
    ),
  });
}
