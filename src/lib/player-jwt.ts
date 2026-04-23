import crypto from "crypto";

function getSecret(): string {
  const s = process.env.PLAYER_JWT_SECRET ?? process.env.NEXTAUTH_SECRET;
  if (!s) {
    throw new Error("PLAYER_JWT_SECRET or NEXTAUTH_SECRET must be set");
  }
  return s;
}

function base64UrlEncode(data: Buffer | string): string {
  const buf = Buffer.isBuffer(data) ? data : Buffer.from(data, "utf8");
  return buf
    .toString("base64")
    .replace(/=/g, "")
    .replace(/\+/g, "-")
    .replace(/\//g, "_");
}

function base64UrlDecodeToString(segment: string): string {
  let b64 = segment.replace(/-/g, "+").replace(/_/g, "/");
  while (b64.length % 4) b64 += "=";
  return Buffer.from(b64, "base64").toString("utf8");
}

export type PlayerJwtPayload = {
  sub: string;
  mac: string;
};

/** sub format: macUser:&lt;id&gt; | activation:&lt;id&gt; */
export function signPlayerToken(payload: PlayerJwtPayload, expiresInSeconds = 60 * 60 * 24 * 30): string {
  const secret = getSecret();
  const header = { alg: "HS256", typ: "JWT" };
  const now = Math.floor(Date.now() / 1000);
  const body = {
    ...payload,
    iat: now,
    exp: now + expiresInSeconds,
  };
  const headerB64 = base64UrlEncode(JSON.stringify(header));
  const payloadB64 = base64UrlEncode(JSON.stringify(body));
  const signingInput = `${headerB64}.${payloadB64}`;
  const sig = crypto.createHmac("sha256", secret).update(signingInput).digest();
  const sigB64 = base64UrlEncode(sig);
  return `${signingInput}.${sigB64}`;
}

export function verifyPlayerToken(token: string): PlayerJwtPayload | null {
  try {
    const secret = getSecret();
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const [headerB64, payloadB64, sigB64] = parts;
    const signingInput = `${headerB64}.${payloadB64}`;
    const expectedMac = crypto.createHmac("sha256", secret).update(signingInput).digest();
    let sigPad = sigB64.replace(/-/g, "+").replace(/_/g, "/");
    while (sigPad.length % 4) sigPad += "=";
    let sigBuf: Buffer;
    try {
      sigBuf = Buffer.from(sigPad, "base64");
    } catch {
      return null;
    }
    if (sigBuf.length !== expectedMac.length || !crypto.timingSafeEqual(sigBuf, expectedMac)) {
      return null;
    }

    const json = base64UrlDecodeToString(payloadB64);
    const payload = JSON.parse(json) as { sub?: string; mac?: string; exp?: number };
    if (!payload.sub || !payload.mac) return null;
    if (payload.exp != null && payload.exp < Math.floor(Date.now() / 1000)) return null;
    return { sub: payload.sub, mac: payload.mac };
  } catch {
    return null;
  }
}

export function deviceKeyFromMac(mac: string): string {
  const secret = getSecret();
  const h = crypto.createHash("sha256").update(`${normalizeForKey(mac)}:${secret}`).digest("hex");
  const n = parseInt(h.slice(0, 8), 16) % 1_000_000;
  return String(n).padStart(6, "0");
}

function normalizeForKey(mac: string): string {
  return mac.replace(/[^0-9a-fA-F]/g, "").toLowerCase();
}
