/** Normalize MAC to upper-case colon-separated AA:BB:CC:DD:EE:FF */
export function normalizeMac(mac: string): string {
  const hex = mac.replace(/[^0-9a-fA-F]/g, "");
  if (hex.length !== 12) return mac.trim();
  return hex.match(/.{2}/g)!.join(":").toUpperCase();
}

/** If url is already an M3U line or Xtream get.php, return as-is; else build default Xtream M3U URL */
export function buildM3uPlaylistUrl(portalUrl: string, username: string, password: string): string {
  const raw = portalUrl.trim();
  const lower = raw.toLowerCase();
  if (
    lower.includes("get.php") ||
    lower.endsWith(".m3u") ||
    lower.endsWith(".m3u8")
  ) {
    return raw;
  }
  const base = raw.replace(/\/$/, "");
  return `${base}/get.php?username=${encodeURIComponent(username)}&password=${encodeURIComponent(password)}&type=m3u_plus`;
}
