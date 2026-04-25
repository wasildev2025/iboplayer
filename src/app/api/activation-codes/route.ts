import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { profileFromM3uUrl } from "@/lib/credential-profiles";

/**
 * List activation codes with their linked credential profile + DNS, for
 * display in the admin table without N+1 lookups.
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
          { code: { contains: search, mode: "insensitive" as const } },
          { profile: { username: { contains: search, mode: "insensitive" as const } } },
          { profile: { dns: { title: { contains: search, mode: "insensitive" as const } } } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.activationCode.findMany({
      where,
      include: { profile: { include: { dns: true } } },
      orderBy: { id: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.activationCode.count({ where }),
  ]);

  return NextResponse.json({
    data: items,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  });
}

/**
 * Create an activation code. Two body shapes:
 *   { code, profileId, status? }                  — link to existing profile
 *   { code, m3uUrl, status? }                     — extract + upsert profile,
 *                                                   then link
 */
export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  let data: {
    code?: unknown;
    profileId?: unknown;
    m3uUrl?: unknown;
    status?: unknown;
  };
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const code = typeof data.code === "string" ? data.code.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "code is required" }, { status: 400 });
  }
  const status = typeof data.status === "string" ? data.status : "NotUsed";

  try {
    let profileId: number;
    if (typeof data.profileId === "number") {
      profileId = data.profileId;
    } else if (typeof data.m3uUrl === "string" && data.m3uUrl.trim()) {
      const profile = await profileFromM3uUrl(data.m3uUrl.trim());
      profileId = profile.id;
    } else {
      return NextResponse.json(
        { error: "profileId or m3uUrl is required" },
        { status: 400 }
      );
    }

    const item = await prisma.activationCode.create({
      data: { code, status, profileId },
      include: { profile: { include: { dns: true } } },
    });
    return NextResponse.json(item);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
