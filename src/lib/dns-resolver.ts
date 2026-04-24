import { prisma } from "@/lib/db";

type WithDnsAndUrl = {
  url: string;
  dnsId?: number | null;
  dns?: { url: string } | null;
};

/**
 * Returns the effective server URL for a row that may have a DNS FK or a
 * legacy inline `url` string. Prefers the FK when present so a single DNS
 * edit propagates everywhere it's referenced.
 */
export function resolveDnsUrl(row: WithDnsAndUrl): string {
  return row.dns?.url || row.url;
}

/**
 * Normalizes a URL to a canonical "host form" usable as a DNS row's `url`
 * column — strips `get.php?...`, trailing slashes, and query strings. Returns
 * just the origin (protocol + host[:port]) when possible.
 */
export function canonicalizeDnsUrl(raw: string): string {
  const trimmed = raw.trim();
  if (!trimmed) return "";
  try {
    const u = new URL(trimmed);
    return `${u.protocol}//${u.host}`;
  } catch {
    return trimmed.replace(/\/get\.php.*$/i, "").replace(/\/+$/, "");
  }
}

/**
 * Find an existing DNS row by canonical URL or create a new one with the
 * given title (defaulting to the host). Idempotent: safe to call on every
 * M3U extraction.
 */
export async function upsertDnsByUrl(
  rawUrl: string,
  title?: string,
): Promise<{ id: number; title: string; url: string }> {
  const url = canonicalizeDnsUrl(rawUrl);
  if (!url) throw new Error("Empty URL");

  const existing = await prisma.dns.findUnique({ where: { url } });
  if (existing) return existing;

  const derivedTitle = (() => {
    if (title && title.trim()) return title.trim();
    try {
      return new URL(url).host;
    } catch {
      return url;
    }
  })();

  return prisma.dns.create({ data: { title: derivedTitle, url } });
}
