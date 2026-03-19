import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

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
          { macAddress: { contains: search } },
          { title: { contains: search } },
          { username: { contains: search } },
        ],
      }
    : {};

  const [items, total] = await Promise.all([
    prisma.macUser.findMany({
      where,
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

export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  const data = await req.json();
  const item = await prisma.macUser.create({
    data: {
      macAddress: data.macAddress,
      protection: data.protection,
      title: data.title,
      url: data.url,
      username: data.username,
      password: data.password,
    },
  });
  return NextResponse.json(item);
}
