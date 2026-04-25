import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

/** Paginated audit log read for the admin UI. Most recent first. */
export async function GET(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;

  const { searchParams } = new URL(req.url);
  const page = Math.max(1, Number(searchParams.get("page") || "1"));
  const pageSize = 25;
  const action = searchParams.get("action") || undefined;

  const where = action ? { action: { startsWith: action } } : {};

  const [items, total] = await Promise.all([
    prisma.auditLog.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * pageSize,
      take: pageSize,
    }),
    prisma.auditLog.count({ where }),
  ]);

  return NextResponse.json({
    data: items,
    page,
    total,
    totalPages: Math.max(1, Math.ceil(total / pageSize)),
  });
}
