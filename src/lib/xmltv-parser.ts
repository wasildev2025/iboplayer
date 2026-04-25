/**
 * Minimal XMLTV parser. The format is small and well-defined:
 *
 *   <tv>
 *     <channel id="...">
 *       <display-name>...</display-name>
 *     </channel>
 *     <programme channel="..." start="20260425200000 +0000" stop="20260425210000 +0000">
 *       <title>...</title>
 *       <desc>...</desc>
 *     </programme>
 *   </tv>
 *
 * We avoid pulling in a SAX dep — provider EPG files run in the tens of MB
 * which is the same scale we already accept for M3U parsing. A regex sweep
 * over the raw text is fast enough and keeps the dependency surface flat.
 *
 * Memory note: the caller is expected to have already loaded the XML into a
 * string (mirrors how channel-refresh.ts handles M3U). For >100MB feeds the
 * ingest job should be moved to a streaming SAX parser; flagged in EPG ingest.
 */

export type XmltvChannel = {
  channelId: string;
  displayName: string;
};

export type XmltvProgramme = {
  channelId: string;
  startUtc: Date;
  stopUtc: Date;
  title: string;
  description: string | null;
};

export type XmltvParsed = {
  channels: XmltvChannel[];
  programmes: XmltvProgramme[];
};

const CHANNEL_BLOCK = /<channel\b([^>]*)>([\s\S]*?)<\/channel>/g;
const PROGRAMME_BLOCK = /<programme\b([^>]*)>([\s\S]*?)<\/programme>/g;
const SELF_CLOSING_PROGRAMME = /<programme\b([^>]*)\/>/g;
const ATTR = /(\w[\w-]*)="([^"]*)"/g;
const TAG_INNER = (tag: string) =>
  new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i");

export function parseXmltv(xml: string): XmltvParsed {
  const channels: XmltvChannel[] = [];
  const programmes: XmltvProgramme[] = [];

  for (const match of xml.matchAll(CHANNEL_BLOCK)) {
    const attrs = parseAttributes(match[1]);
    const channelId = attrs.id?.trim();
    if (!channelId) continue;
    const displayName = decodeEntities(
      stripCdata(extractTag(match[2], "display-name") ?? ""),
    ).trim();
    channels.push({ channelId, displayName });
  }

  const collectProgramme = (attrsRaw: string, body: string) => {
    const attrs = parseAttributes(attrsRaw);
    const channelId = attrs.channel?.trim();
    const start = parseXmltvDate(attrs.start);
    const stop = parseXmltvDate(attrs.stop) ?? start;
    if (!channelId || !start || !stop) return;
    const title = decodeEntities(stripCdata(extractTag(body, "title") ?? "")).trim();
    const descRaw = extractTag(body, "desc");
    const description = descRaw ? decodeEntities(stripCdata(descRaw)).trim() : null;
    programmes.push({
      channelId,
      startUtc: start,
      stopUtc: stop,
      title,
      description: description || null,
    });
  };

  for (const match of xml.matchAll(PROGRAMME_BLOCK)) {
    collectProgramme(match[1], match[2]);
  }
  for (const match of xml.matchAll(SELF_CLOSING_PROGRAMME)) {
    collectProgramme(match[1], "");
  }

  return { channels, programmes };
}

function parseAttributes(raw: string): Record<string, string> {
  const out: Record<string, string> = {};
  for (const match of raw.matchAll(ATTR)) {
    out[match[1]] = match[2];
  }
  return out;
}

function extractTag(body: string, tag: string): string | null {
  const m = body.match(TAG_INNER(tag));
  return m ? m[1] : null;
}

function stripCdata(value: string): string {
  return value.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1");
}

function decodeEntities(value: string): string {
  return value
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code) => String.fromCodePoint(Number(code)));
}

/**
 * XMLTV date format: `YYYYMMDDhhmmss [+/-HHMM]`. Timezone offset is optional;
 * when absent we treat the timestamp as UTC. Returns `null` for unparseable
 * input rather than throwing — a single bad row shouldn't sink an ingest.
 */
export function parseXmltvDate(raw: string | undefined): Date | null {
  if (!raw) return null;
  const m = raw.trim().match(/^(\d{14})(?:\s*([+-])(\d{2})(\d{2}))?$/);
  if (!m) return null;
  const [, ts, sign, hh, mm] = m;
  const year = Number(ts.slice(0, 4));
  const month = Number(ts.slice(4, 6));
  const day = Number(ts.slice(6, 8));
  const hour = Number(ts.slice(8, 10));
  const minute = Number(ts.slice(10, 12));
  const second = Number(ts.slice(12, 14));
  const utcMs = Date.UTC(year, month - 1, day, hour, minute, second);
  if (Number.isNaN(utcMs)) return null;
  if (!sign) return new Date(utcMs);
  const offsetMin = (Number(hh) * 60 + Number(mm)) * (sign === "+" ? 1 : -1);
  // The timestamp is in the local zone described by the offset — to convert
  // to UTC we subtract the offset.
  return new Date(utcMs - offsetMin * 60_000);
}
