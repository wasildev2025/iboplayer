import { NextResponse } from "next/server";
import { requireAuth } from "@/lib/api-auth";
import { upsertDnsByUrl } from "@/lib/dns-resolver";

/**
 * Idempotent DNS insert by canonical URL. Used by M3U extraction and admin
 * forms so a DNS row exists as soon as its URL is seen anywhere.
 *
 * Body: { url: string, title?: string }
 */
export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  let body: { url?: unknown; title?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const url = typeof body.url === "string" ? body.url : "";
  const title = typeof body.title === "string" ? body.title : undefined;
  if (!url.trim()) {
    return NextResponse.json({ error: "url is required" }, { status: 400 });
  }

  try {
    const dns = await upsertDnsByUrl(url, title);
    return NextResponse.json(dns);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to upsert DNS";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
