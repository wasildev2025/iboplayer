/**
 * Server-side M3U parser. Mirrors the Android M3uParser logic so behavior is
 * identical regardless of where parsing happens. Categorization (live/movies/
 * series/sports) is also done here so the player API can serve already-bucketed
 * results without per-request scanning.
 */

export type ParsedChannel = {
  externalId: string;
  name: string;
  url: string;
  logo: string | null;
  groupName: string | null;
  category: ChannelCategory;
};

export type ChannelCategory = "live" | "movies" | "series" | "sports";

const ATTR_REGEX = /([a-zA-Z0-9-]+)="([^"]*)"/g;

const SPORT_KEYWORDS = [
  "SPORT", "FOOTBALL", "SOCCER", "NBA", "NFL", "UFC", "CRICKET",
  "TENNIS", "F1", "MOTOR", "RUGBY", "BOXING", "GOLF",
];
const SERIES_KEYWORDS = ["SERIES", "SERIE", "TV SHOW", "SEASON", "TELEFILM"];
const MOVIE_KEYWORDS = ["MOVIE", "FILM", "CINEMA", "VOD"];

export function categorize(group: string | null, url: string): ChannelCategory {
  // URL path is the authoritative signal for Xtream-Codes feeds: VOD streams
  // live under /movie/ or /series/ regardless of the group label. Group-title
  // keywords (e.g. "TURKISH SERIES", "DRAMA") miss our keyword list, so URL-
  // first avoids series/movies leaking into the Live tab.
  const u = url.toLowerCase();
  if (u.includes("/series/")) return "series";
  if (u.includes("/movie/") || u.includes("/movies/")) return "movies";

  if (group) {
    const g = group.toUpperCase();
    if (SPORT_KEYWORDS.some((k) => g.includes(k))) return "sports";
    if (SERIES_KEYWORDS.some((k) => g.includes(k))) return "series";
    if (MOVIE_KEYWORDS.some((k) => g.includes(k))) return "movies";
  }
  return "live";
}

function parseAttrs(line: string): Record<string, string> {
  const attrs: Record<string, string> = {};
  let m: RegExpExecArray | null;
  ATTR_REGEX.lastIndex = 0;
  while ((m = ATTR_REGEX.exec(line)) !== null) {
    attrs[m[1].toLowerCase()] = m[2];
  }
  return attrs;
}

/**
 * Parse an M3U `#EXTINF:` playlist. Skips comments, blank lines, and
 * malformed entries. Returns one ParsedChannel per stream URL.
 */
export function parseM3u(text: string): ParsedChannel[] {
  const channels: ParsedChannel[] = [];
  let pendingName: string | null = null;
  let pendingAttrs: Record<string, string> = {};
  let pendingGroup: string | null = null;
  let index = 0;

  const lines = text.split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (line.startsWith("#EXTM3U")) continue;

    if (line.startsWith("#EXTINF")) {
      const commaIdx = line.indexOf(",");
      const attrSection = commaIdx > 0 ? line.substring(0, commaIdx) : line;
      const title = commaIdx > 0 ? line.substring(commaIdx + 1).trim() : "";
      const attrs = parseAttrs(attrSection);
      pendingAttrs = attrs;
      pendingName = (attrs["tvg-name"]?.trim() || title).trim();
      pendingGroup = attrs["group-title"]?.trim() || null;
      continue;
    }

    if (line.startsWith("#EXTGRP:")) {
      const v = line.substring("#EXTGRP:".length).trim();
      if (v) pendingGroup = v;
      continue;
    }

    if (line.startsWith("#")) continue;

    // URL line
    if (!pendingName) continue;
    const tvgId = pendingAttrs["tvg-id"]?.trim();
    const externalId = tvgId || `${index}_${hashString(pendingName)}`;
    channels.push({
      externalId,
      name: pendingName,
      url: line,
      logo: pendingAttrs["tvg-logo"]?.trim() || null,
      groupName: pendingGroup || null,
      category: categorize(pendingGroup, line),
    });
    index += 1;
    pendingName = null;
    pendingGroup = null;
    pendingAttrs = {};
  }

  return channels;
}

function hashString(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i += 1) {
    h = (h << 5) - h + s.charCodeAt(i);
    h |= 0;
  }
  return Math.abs(h).toString(36);
}
