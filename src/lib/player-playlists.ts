import type { ActivationCode, Dns, MacUser, Playlist } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildM3uPlaylistUrl, normalizeMac } from "@/lib/mac";
import { resolveDnsUrl } from "@/lib/dns-resolver";

export type PlaylistDto = {
  id: number;
  title: string;
  playlistUrl: string;
  protection: boolean;
};

export function playlistDtoFromRow(row: Playlist & { dns: Dns | null }): PlaylistDto {
  const serverUrl = resolveDnsUrl(row);
  // Prefer DNS title so renaming a DNS propagates everywhere, and so legacy
  // rows that stored the activation code as their title get cleaned up
  // automatically without a DB migration.
  const title =
    row.dns?.title?.trim() ||
    hostFromUrl(serverUrl) ||
    row.title?.trim() ||
    "Playlist";
  return {
    id: row.id,
    title,
    playlistUrl: buildM3uPlaylistUrl(serverUrl, row.username, row.password),
    protection: row.protection,
  };
}

/**
 * Returns all Playlist rows for a MacUser, resolving DNS FK when present.
 * Falls back to the legacy single-playlist stored on MacUser itself if the
 * relation is empty (migration path for pre-multi-playlist data).
 */
export async function playlistsForMacUser(
  macUser: MacUser & { dns?: Dns | null },
): Promise<PlaylistDto[]> {
  const rows = await prisma.playlist.findMany({
    where: { macUserId: macUser.id },
    include: { dns: true },
    orderBy: { id: "asc" },
  });
  if (rows.length > 0) return rows.map(playlistDtoFromRow);

  const legacyDns = macUser.dns ?? (
    macUser.dnsId ? await prisma.dns.findUnique({ where: { id: macUser.dnsId } }) : null
  );
  const serverUrl = resolveDnsUrl({
    url: macUser.url,
    dnsId: macUser.dnsId,
    dns: legacyDns,
  });
  const legacyTitle =
    legacyDns?.title?.trim() ||
    hostFromUrl(serverUrl) ||
    macUser.title?.trim() ||
    "Playlist";
  return [
    {
      id: macUser.id,
      title: legacyTitle,
      playlistUrl: buildM3uPlaylistUrl(serverUrl, macUser.username, macUser.password),
      protection: macUser.protection,
    },
  ];
}

export function playlistsFromActivation(
  row: ActivationCode & { dns: Dns | null },
): PlaylistDto[] {
  const serverUrl = resolveDnsUrl(row);
  const title = row.dns?.title?.trim() || hostFromUrl(serverUrl) || row.code;
  return [
    {
      id: row.id,
      title,
      playlistUrl: buildM3uPlaylistUrl(serverUrl, row.username, row.password),
      protection: false,
    },
  ];
}

function hostFromUrl(raw: string): string {
  try {
    return new URL(raw).host;
  } catch {
    return "";
  }
}

export async function trialExpireIsoForMac(normMac: string): Promise<string | null> {
  const trials = await prisma.trial.findMany();
  const trial = trials.find((t) => normalizeMac(t.macAddress) === normMac);
  if (!trial) return null;
  return trial.expireDate.toISOString();
}
