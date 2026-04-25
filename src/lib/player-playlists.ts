import type { CredentialProfile, Dns, MacUser, Playlist } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildM3uPlaylistUrl, normalizeMac } from "@/lib/mac";

export type PlaylistDto = {
  id: number;
  title: string;
  playlistUrl: string;
  protection: boolean;
};

type PlaylistWithProfile = Playlist & {
  profile: CredentialProfile & { dns: Dns };
};

/**
 * Build the player-facing DTO from a Playlist row. The title is *always*
 * derived live from the linked CredentialProfile → DNS so admin renames
 * propagate to every device immediately. We deliberately ignore any title
 * stored on the Playlist row itself — that field was a pre-refactor snapshot
 * and is now superseded by the profile.
 *
 * Credentials are resolved through profile → DNS for the same reason: one
 * edit, instant propagation, nothing duplicated client-side.
 */
export function playlistDtoFromRow(row: PlaylistWithProfile): PlaylistDto {
  const { profile } = row;
  const title =
    profile.title?.trim() ||
    profile.dns.title?.trim() ||
    hostFromUrl(profile.dns.url) ||
    "Playlist";
  return {
    id: row.id,
    title,
    playlistUrl: buildM3uPlaylistUrl(profile.dns.url, profile.username, profile.password),
    protection: row.protection,
  };
}

/**
 * Returns all playlists for a MacUser, each resolved against its current
 * credential profile. No legacy single-playlist-on-MacUser fallback — every
 * playlist now lives in the Playlist table with a profileId.
 */
export async function playlistsForMacUser(macUser: MacUser): Promise<PlaylistDto[]> {
  const rows = await prisma.playlist.findMany({
    where: { macUserId: macUser.id },
    include: { profile: { include: { dns: true } } },
    orderBy: { id: "asc" },
  });
  return rows.map(playlistDtoFromRow);
}

/**
 * Build a one-shot DTO from a CredentialProfile (used by the activation flow
 * before the device has any persisted Playlist rows).
 */
export function playlistDtoFromProfile(
  profile: CredentialProfile & { dns: Dns },
  fallbackId: number,
): PlaylistDto {
  return {
    id: fallbackId,
    title:
      profile.title?.trim() ||
      profile.dns.title?.trim() ||
      hostFromUrl(profile.dns.url) ||
      "Playlist",
    playlistUrl: buildM3uPlaylistUrl(profile.dns.url, profile.username, profile.password),
    protection: false,
  };
}

export async function trialExpireIsoForMac(normMac: string): Promise<string | null> {
  const trials = await prisma.trial.findMany();
  const trial = trials.find((t) => normalizeMac(t.macAddress) === normMac);
  if (!trial) return null;
  return trial.expireDate.toISOString();
}

function hostFromUrl(raw: string): string {
  try {
    return new URL(raw).host;
  } catch {
    return "";
  }
}
