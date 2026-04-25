import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { resolveCredentialsFromM3u } from "@/lib/credential-profiles";
import { triggerRefreshAsync } from "@/lib/channel-refresh";

// Allow long-running uploads — large CSVs can take 30+s when each row
// triggers an upsert + DNS resolution.
export const maxDuration = 60;

/**
 * Bulk activation code import. Accepts a CSV body with one of two shapes:
 *
 *   1. code,m3uUrl
 *      ABC123,http://provider.com/get.php?username=u1&password=p1&type=m3u_plus
 *      ABC456,http://provider.com/get.php?username=u2&password=p2&type=m3u_plus
 *
 *   2. code,profileId
 *      ABC123,1
 *      ABC456,1
 *
 * Header row is REQUIRED and determines which shape we expect. Empty lines
 * and lines starting with `#` are ignored.
 *
 * Returns per-row results so the admin sees exactly which lines failed.
 */
export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  let body: { csv?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const csv = typeof body.csv === "string" ? body.csv : "";
  if (!csv.trim()) {
    return NextResponse.json({ error: "csv body is required" }, { status: 400 });
  }

  const lines = csv
    .split(/\r?\n/)
    .map((l) => l.trim())
    .filter((l) => l.length > 0 && !l.startsWith("#"));
  if (lines.length < 2) {
    return NextResponse.json(
      { error: "CSV needs a header row + at least one data row" },
      { status: 400 },
    );
  }

  const header = lines[0].split(",").map((h) => h.trim().toLowerCase());
  const codeIdx = header.indexOf("code");
  const m3uIdx = header.indexOf("m3uurl");
  const profileIdx = header.indexOf("profileid");
  if (codeIdx === -1 || (m3uIdx === -1 && profileIdx === -1)) {
    return NextResponse.json(
      { error: 'Header must include "code" and either "m3uUrl" or "profileId"' },
      { status: 400 },
    );
  }

  type RowResult = {
    line: number;
    code: string;
    status: "created" | "skipped" | "failed";
    profileId?: number;
    error?: string;
  };
  const results: RowResult[] = [];
  // Cache profile lookups by m3uUrl so we don't re-resolve the same M3U N times.
  const profileCache = new Map<string, number>();
  const touchedProfiles = new Set<number>();

  for (let i = 1; i < lines.length; i += 1) {
    const cols = lines[i].split(",").map((c) => c.trim());
    const code = cols[codeIdx];
    if (!code) {
      results.push({ line: i + 1, code: "", status: "failed", error: "missing code" });
      continue;
    }

    let profileId: number | null = null;
    try {
      if (m3uIdx !== -1) {
        const m3u = cols[m3uIdx];
        if (!m3u) throw new Error("missing m3uUrl");
        if (profileCache.has(m3u)) {
          profileId = profileCache.get(m3u)!;
        } else {
          const resolved = await resolveCredentialsFromM3u(m3u);
          // Find or create the profile for this credential bundle
          const profile = await prisma.credentialProfile.upsert({
            where: {
              dnsId_username_password: {
                dnsId: resolved.dnsId,
                username: resolved.username,
                password: resolved.password,
              },
            },
            create: {
              dnsId: resolved.dnsId,
              username: resolved.username,
              password: resolved.password,
            },
            update: {},
          });
          profileId = profile.id;
          profileCache.set(m3u, profile.id);
        }
      } else {
        profileId = parseInt(cols[profileIdx], 10);
        if (!Number.isFinite(profileId)) throw new Error("profileId not a number");
      }

      // Idempotent: skip if code already exists
      const existing = await prisma.activationCode.findUnique({ where: { code } });
      if (existing) {
        results.push({ line: i + 1, code, status: "skipped", profileId, error: "code already exists" });
        continue;
      }

      await prisma.activationCode.create({
        data: { code, profileId, status: "NotUsed" },
      });
      touchedProfiles.add(profileId);
      results.push({ line: i + 1, code, status: "created", profileId });
    } catch (e) {
      const msg = e instanceof Error ? e.message : "unknown";
      results.push({ line: i + 1, code, status: "failed", error: msg });
    }
  }

  // Auto-refresh channels for any newly-touched profile (no-op if it
  // already has a fresh ingest log).
  for (const pid of touchedProfiles) {
    triggerRefreshAsync(pid);
  }

  const summary = {
    total: lines.length - 1,
    created: results.filter((r) => r.status === "created").length,
    skipped: results.filter((r) => r.status === "skipped").length,
    failed: results.filter((r) => r.status === "failed").length,
  };

  return NextResponse.json({ summary, results });
}
