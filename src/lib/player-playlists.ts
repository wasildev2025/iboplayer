import type { ActivationCode, MacUser } from "@prisma/client";
import { prisma } from "@/lib/db";
import { buildM3uPlaylistUrl, normalizeMac } from "@/lib/mac";

export type PlaylistDto = {
  id: number;
  title: string;
  playlistUrl: string;
  protection: boolean;
};

export function playlistsFromMacUser(row: MacUser): PlaylistDto[] {
  const playlistUrl = buildM3uPlaylistUrl(row.url, row.username, row.password);
  return [
    {
      id: row.id,
      title: row.title || "Playlist",
      playlistUrl,
      protection: row.protection,
    },
  ];
}

export function playlistsFromActivation(row: ActivationCode): PlaylistDto[] {
  const playlistUrl = buildM3uPlaylistUrl(row.url, row.username, row.password);
  return [
    {
      id: row.id,
      title: row.code,
      playlistUrl,
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
