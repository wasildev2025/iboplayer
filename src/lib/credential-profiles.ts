import type { CredentialProfile, Dns } from "@prisma/client";
import { prisma } from "@/lib/db";
import { upsertDnsByUrl } from "@/lib/dns-resolver";
import { buildM3uPlaylistUrl } from "@/lib/mac";
import { parseM3uUrl } from "@/lib/m3u-parser";

export type CredentialProfileWithDns = CredentialProfile & { dns: Dns };

/**
 * Find or create the (dns, username, password) bundle. Idempotent — pasting
 * the same M3U twice returns the same profile row, so 100k activation codes
 * sharing one bundle all link to a single profile.
 */
export async function upsertCredentialProfile(input: {
  dnsId: number;
  username: string;
  password: string;
  title?: string | null;
}): Promise<CredentialProfileWithDns> {
  const { dnsId, username, password, title } = input;

  const existing = await prisma.credentialProfile.findUnique({
    where: {
      dnsId_username_password: { dnsId, username, password },
    },
    include: { dns: true },
  });
  if (existing) return existing;

  return prisma.credentialProfile.create({
    data: {
      dnsId,
      username,
      password,
      title: title?.trim() || null,
    },
    include: { dns: true },
  });
}

/**
 * Resolve an M3U get.php URL into a CredentialProfile, creating the underlying
 * DNS row if needed. The single entry point used by activation-code creation,
 * profile creation, and the M3U extractor UI.
 */
export async function profileFromM3uUrl(
  m3uUrl: string,
  opts: { title?: string | null } = {},
): Promise<CredentialProfileWithDns> {
  const parsed = parseM3uUrl(m3uUrl);
  if (!parsed.url || !parsed.username || !parsed.password) {
    throw new Error("M3U link missing host, username, or password");
  }
  const dns = await upsertDnsByUrl(parsed.url);
  return upsertCredentialProfile({
    dnsId: dns.id,
    username: parsed.username,
    password: parsed.password,
    title: opts.title ?? null,
  });
}

/**
 * Display label for a profile — uses explicit title if set, else falls back to
 * the DNS title and a redacted username so admin lists are scannable.
 */
export function profileDisplayLabel(profile: CredentialProfileWithDns): string {
  if (profile.title?.trim()) return profile.title;
  const host = profile.dns.title || profile.dns.url;
  return `${host} — ${profile.username}`;
}

/**
 * Build the M3U playlist URL the player will fetch from a profile.
 */
export function profileToPlaylistUrl(profile: CredentialProfileWithDns): string {
  return buildM3uPlaylistUrl(profile.dns.url, profile.username, profile.password);
}
