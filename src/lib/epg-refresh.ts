import { prisma } from "@/lib/db";
import { captureError } from "@/lib/observability";
import { parseXmltv } from "@/lib/xmltv-parser";

/**
 * Server-side EPG ingest. Fetches the profile's XMLTV feed, parses it, and
 * replaces this profile's EPG channels + programmes.
 *
 * Strategy:
 *   1. Mark refresh log `running`
 *   2. Fetch XMLTV over HTTP
 *   3. Parse channels + programmes (in-memory)
 *   4. Upsert epg_channels for the profile (skipDuplicates) and remove orphans
 *   5. Wipe this profile's existing programmes, then bulk-insert the new set
 *      in chunks. Brief window of empty EPG during refresh is acceptable —
 *      the cadence is daily, not realtime.
 *   6. Mark log `success`/`failed`
 *
 * Memory note: very large feeds (>100MB) load the entire XML into a string.
 * Same constraint as channel-refresh.ts. If a provider's EPG grows beyond
 * Vercel's memory budget, swap parseXmltv for a streaming SAX parser.
 */
export async function refreshEpgForProfile(profileId: number): Promise<{
  channelCount: number;
  programmeCount: number;
  status: "success" | "failed" | "skipped";
  error: string | null;
}> {
  const profile = await prisma.credentialProfile.findUnique({
    where: { id: profileId },
    select: { id: true, epgUrl: true },
  });
  if (!profile) {
    return { channelCount: 0, programmeCount: 0, status: "failed", error: "Profile not found" };
  }
  if (!profile.epgUrl) {
    return { channelCount: 0, programmeCount: 0, status: "skipped", error: null };
  }

  await prisma.epgRefreshLog.upsert({
    where: { profileId },
    create: {
      profileId,
      status: "running",
      channelCount: 0,
      programmeCount: 0,
      startedAt: new Date(),
    },
    update: {
      status: "running",
      channelCount: 0,
      programmeCount: 0,
      error: null,
      startedAt: new Date(),
      finishedAt: null,
    },
  });

  try {
    const res = await fetch(profile.epgUrl, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status} fetching EPG`);
    const xml = await res.text();
    const parsed = parseXmltv(xml);

    // De-dup channels by epgChannelId (XMLTV occasionally repeats)
    const seenChannelIds = new Set<string>();
    const dedupChannels = parsed.channels.filter((c) => {
      if (seenChannelIds.has(c.channelId)) return false;
      seenChannelIds.add(c.channelId);
      return true;
    });

    // Upsert epg_channels in chunks
    const CHANNEL_CHUNK = 1000;
    for (let i = 0; i < dedupChannels.length; i += CHANNEL_CHUNK) {
      const slice = dedupChannels.slice(i, i + CHANNEL_CHUNK).map((c) => ({
        profileId,
        epgChannelId: c.channelId,
        displayName: c.displayName,
      }));
      await prisma.epgChannel.createMany({ data: slice, skipDuplicates: true });
    }

    // Drop orphans — channels in DB but absent from this feed
    if (dedupChannels.length > 0) {
      await prisma.epgChannel.deleteMany({
        where: {
          profileId,
          epgChannelId: { notIn: dedupChannels.map((c) => c.channelId) },
        },
      });
    }

    // Map epgChannelId → DB id (now that all are inserted)
    const dbChannels = await prisma.epgChannel.findMany({
      where: { profileId },
      select: { id: true, epgChannelId: true },
    });
    const idLookup = new Map<string, number>();
    for (const c of dbChannels) idLookup.set(c.epgChannelId, c.id);

    // Wipe existing programmes for this profile's channels — simpler than
    // diffing, and the cadence is daily so the empty window is small.
    if (dbChannels.length > 0) {
      await prisma.epgProgramme.deleteMany({
        where: { epgChannelId: { in: dbChannels.map((c) => c.id) } },
      });
    }

    // Bulk-insert programmes. Skip programmes whose channel isn't in the
    // feed's channel list (rare but happens with malformed feeds).
    const programmes = parsed.programmes
      .map((p) => {
        const chId = idLookup.get(p.channelId);
        if (!chId) return null;
        return {
          epgChannelId: chId,
          startUtc: p.startUtc,
          stopUtc: p.stopUtc,
          title: p.title,
          description: p.description,
        };
      })
      .filter((p): p is NonNullable<typeof p> => p !== null);

    const PROGRAMME_CHUNK = 1000;
    for (let i = 0; i < programmes.length; i += PROGRAMME_CHUNK) {
      await prisma.epgProgramme.createMany({
        data: programmes.slice(i, i + PROGRAMME_CHUNK),
      });
    }

    await prisma.epgRefreshLog.update({
      where: { profileId },
      data: {
        status: "success",
        channelCount: dedupChannels.length,
        programmeCount: programmes.length,
        error: null,
        finishedAt: new Date(),
      },
    });

    return {
      channelCount: dedupChannels.length,
      programmeCount: programmes.length,
      status: "success",
      error: null,
    };
  } catch (e) {
    const message = e instanceof Error ? e.message : "Unknown error";
    await prisma.epgRefreshLog.update({
      where: { profileId },
      data: {
        status: "failed",
        error: message,
        finishedAt: new Date(),
      },
    });
    captureError(e, { profileId, op: "refreshEpg" });
    return { channelCount: 0, programmeCount: 0, status: "failed", error: message };
  }
}

/** Cron entrypoint: refresh every profile that has an EPG URL set. */
export async function refreshEpgForAllProfiles(): Promise<{
  ran: number;
  succeeded: number;
  failed: number;
  skipped: number;
}> {
  const profiles = await prisma.credentialProfile.findMany({
    where: { epgUrl: { not: null } },
    select: { id: true },
  });
  let succeeded = 0;
  let failed = 0;
  let skipped = 0;
  for (const p of profiles) {
    const result = await refreshEpgForProfile(p.id);
    if (result.status === "success") succeeded++;
    else if (result.status === "failed") failed++;
    else skipped++;
  }
  return { ran: profiles.length, succeeded, failed, skipped };
}
