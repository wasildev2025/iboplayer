import { prisma } from "@/lib/db";
import { buildM3uPlaylistUrl } from "@/lib/mac";
import { parseM3u } from "@/lib/m3u-server";
import { captureError } from "@/lib/observability";

/**
 * Re-fetch and re-store all channels for a credential profile. This is the
 * server-side replacement for the device-side `refreshPlaylist` — Android
 * never touches the M3U directly anymore.
 *
 * Behavior:
 *   1. Mark refresh log as `running`
 *   2. Fetch the M3U over HTTP (using the profile's DNS + credentials)
 *   3. Parse + categorize
 *   4. DELETE existing channels for this profile, INSERT new ones in chunks
 *   5. Mark refresh log as `success` (or `failed` with error message)
 *
 * Long-running for big M3Us. Vercel Hobby caps function execution at ~10s,
 * so very large playlists may time out — the refresh log will then read
 * "running" forever until the next attempt overwrites it.
 */
export async function refreshChannelsForProfile(profileId: number): Promise<{
  channelCount: number;
  status: "success" | "failed";
  error: string | null;
}> {
  await prisma.channelRefreshLog.upsert({
    where: { profileId },
    create: {
      profileId,
      status: "running",
      channelCount: 0,
      startedAt: new Date(),
    },
    update: {
      status: "running",
      channelCount: 0,
      error: null,
      startedAt: new Date(),
      finishedAt: null,
    },
  });

  try {
    const profile = await prisma.credentialProfile.findUnique({
      where: { id: profileId },
      include: { dns: true },
    });
    if (!profile) throw new Error("Profile not found");

    const m3uUrl = buildM3uPlaylistUrl(
      profile.dns.url,
      profile.username,
      profile.password,
    );

    const res = await fetch(m3uUrl, {
      // No bearer auth — this is the IPTV provider's own get.php endpoint.
      cache: "no-store",
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status} fetching M3U`);
    }
    const text = await res.text();
    const parsed = parseM3u(text);

    // De-duplicate by externalId — providers occasionally repeat tvg-ids.
    // We keep the first occurrence to mirror Android's REPLACE semantics.
    const seen = new Set<string>();
    const dedup = parsed.filter((c) => {
      if (seen.has(c.externalId)) return false;
      seen.add(c.externalId);
      return true;
    });

    // Strategy: insert-first, then delete orphans. The profile's channel
    // table is never momentarily empty — old channels remain visible while
    // new ones stream in, then any channels whose externalId is absent
    // from the new feed get pruned at the end.
    //
    // For the prune step we need "DELETE WHERE external_id NOT IN (newIds)"
    // but Prisma's `notIn` with 100k+ elements would exceed Postgres's
    // 32k bind-parameter limit. Instead we fetch the existing externalIds
    // (just text strings), compute the diff in JS, and delete by primary
    // key in chunks. ~50 MB of strings fetched for a 272k-channel profile
    // — acceptable for a refresh that runs minutes-to-hours apart.
    const CHUNK = 1000;
    for (let i = 0; i < dedup.length; i += CHUNK) {
      const slice = dedup.slice(i, i + CHUNK).map((c) => ({
        profileId,
        externalId: c.externalId,
        name: c.name,
        url: c.url,
        logo: c.logo,
        groupName: c.groupName,
        category: c.category,
      }));
      // skipDuplicates: rows that already exist (same profile, same
      // externalId) are left untouched. Their metadata may go stale between
      // refreshes — acceptable trade for atomicity.
      await prisma.channel.createMany({ data: slice, skipDuplicates: true });
    }

    // Prune orphans
    const existingIds = await prisma.channel.findMany({
      where: { profileId },
      select: { id: true, externalId: true },
    });
    const orphanIds = existingIds
      .filter((c) => !seen.has(c.externalId))
      .map((c) => c.id);
    const DELETE_CHUNK = 5_000;
    for (let i = 0; i < orphanIds.length; i += DELETE_CHUNK) {
      await prisma.channel.deleteMany({
        where: { id: { in: orphanIds.slice(i, i + DELETE_CHUNK) } },
      });
    }

    await prisma.channelRefreshLog.update({
      where: { profileId },
      data: {
        status: "success",
        channelCount: dedup.length,
        error: null,
        finishedAt: new Date(),
      },
    });

    return { channelCount: dedup.length, status: "success", error: null };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    await prisma.channelRefreshLog.update({
      where: { profileId },
      data: {
        status: "failed",
        error: message,
        finishedAt: new Date(),
      },
    });
    captureError(e, { profileId, op: "refreshChannels" });
    return { channelCount: 0, status: "failed", error: message };
  }
}

/**
 * Schedule a channel refresh to run after the current request returns.
 *
 * Uses Next.js `after()` so Vercel keeps the function instance alive long
 * enough to finish the M3U fetch + ingest — a bare `void promise` would be
 * killed the moment the response is sent.
 *
 * Caveat: for very large M3Us (100k+ channels), the work can still exceed
 * the Vercel function timeout (10s on Hobby, up to 800s on Pro). On
 * timeout the ChannelRefreshLog stays in `running` and the admin can
 * retry from the dashboard "Refresh now" button.
 */
export function triggerRefreshAsync(profileId: number): void {
  // Lazy import keeps `next/server` out of non-Next environments (e.g. the
  // Prisma seed script which also imports from this module path indirectly).
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const { after } = require("next/server") as typeof import("next/server");
  after(async () => {
    try {
      await refreshChannelsForProfile(profileId);
    } catch (e) {
      console.error(
        `[channel-refresh] background refresh failed for profile ${profileId}:`,
        e,
      );
    }
  });
}
