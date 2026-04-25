import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

/**
 * Admin list of registered devices. Each device auto-registers on first
 * activation via the player API; this endpoint is read-mostly for the admin
 * to view/clean up devices, not to create them with credentials.
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
          { macAddress: { contains: search, mode: "insensitive" as const } },
          { title: { contains: search, mode: "insensitive" as const } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.macUser.findMany({
      where,
      include: { _count: { select: { playlists: true } } },
      orderBy: { id: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.macUser.count({ where }),
  ]);

  return NextResponse.json({
    data: items,
    total,
    page,
    totalPages: Math.ceil(total / pageSize),
  });
}

/**
 * Admin-side device creation. No credentials — playlists carry profileIds.
 * Body: { macAddress: string, title?: string }
 */
export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  const data = await req.json();
  const macAddress =
    typeof data.macAddress === "string" ? data.macAddress.trim() : "";
  if (!macAddress) {
    return NextResponse.json({ error: "macAddress is required" }, { status: 400 });
  }
  try {
    const item = await prisma.macUser.create({
      data: {
        macAddress,
        title: typeof data.title === "string" ? data.title : "",
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Create failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
