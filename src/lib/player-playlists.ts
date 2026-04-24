import type { ActivationCode, MacUser, Playlist } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildM3uPlaylistUrl, normalizeMac } from "@/lib/mac";

export type PlaylistDto = {
  id: number;
  title: string;
  playlistUrl: string;
  protection: boolean;
};

export function playlistDtoFromRow(row: Playlist): PlaylistDto {
  return {
    id: row.id,
    title: row.title || "Playlist",
    playlistUrl: buildM3uPlaylistUrl(row.url, row.username, row.password),
    protection: row.protection,
  };
}

/**
 * Returns all Playlist rows for a MacUser. If the relation is empty (legacy
 * data created before the multi-playlist schema), falls back to the legacy
 * single playlist stored on MacUser itself.
 */
export async function playlistsForMacUser(macUser: MacUser): Promise<PlaylistDto[]> {
  const rows = await prisma.playlist.findMany({
    where: { macUserId: macUser.id },
    orderBy: { id: "asc" },
  });
  if (rows.length > 0) return rows.map(playlistDtoFromRow);

  return [
    {
      id: macUser.id,
      title: macUser.title || "Playlist",
      playlistUrl: buildM3uPlaylistUrl(macUser.url, macUser.username, macUser.password),
      protection: macUser.protection,
    },
  ];
}

export function playlistsFromActivation(row: ActivationCode): PlaylistDto[] {
  return [
    {
      id: row.id,
      title: row.code,
      playlistUrl: buildM3uPlaylistUrl(row.url, row.username, row.password),
      protection: false,
    },
  ];
}

export async function trialExpireIsoForMac(normMac: string): Promise<string | null> {
  const trials = await prisma.trial.findMany();
  const trial = trials.find((t) => normalizeMac(t.macAddress) === normMac);
  if (!trial) return null;
  return trial.expireDate.toISOString();
}
