import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import {
  profileFromM3uUrl,
  upsertCredentialProfile,
} from "@/lib/credential-profiles";

/**
 * List credential profiles with usage counts. Search matches title, DNS
 * title, DNS URL, or username.
 */
export async function GET(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = 10;

  const where = search
    ? {
        OR: [
          { title: { contains: search, mode: "insensitive" as const } },
          { username: { contains: search, mode: "insensitive" as const } },
          { dns: { title: { contains: search, mode: "insensitive" as const } } },
          { dns: { url: { contains: search, mode: "insensitive" as const } } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.credentialProfile.findMany({
      where,
      include: {
        dns: true,
        _count: {
          select: { activationCodes: true, playlists: true },
        },
      },
      orderBy: { id: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.credentialProfile.count({ where }),
  ]);

  return NextResponse.json({
    data: items,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  });
}

/**
 * Create or fetch a profile. Two body shapes:
 *   { m3uUrl }                                — extract + upsert from a link
 *   { dnsId, username, password, title? }     — explicit fields
 *
 * Both are idempotent (returns the existing row if the (dns,user,pass)
 * triple already exists).
 */
export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  let body: {
    m3uUrl?: unknown;
    dnsId?: unknown;
    username?: unknown;
    password?: unknown;
    title?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const title =
      typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;

    if (typeof body.m3uUrl === "string" && body.m3uUrl.trim()) {
      const profile = await profileFromM3uUrl(body.m3uUrl.trim(), { title });
      return NextResponse.json(profile);
    }

    const dnsId = typeof body.dnsId === "number" ? body.dnsId : null;
    const username = typeof body.username === "string" ? body.username : "";
    const password = typeof body.password === "string" ? body.password : "";
    if (!dnsId || !username || !password) {
      return NextResponse.json(
        { error: "dnsId, username, password required (or provide m3uUrl)" },
        { status: 400 }
      );
    }
    const profile = await upsertCredentialProfile({
      dnsId,
      username,
      password,
      title,
    });
    return NextResponse.json(profile);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to upsert profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
