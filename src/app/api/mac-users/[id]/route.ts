import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const item = await prisma.macUser.findUnique({
    where: { id: Number(id) },
    include: {
      playlists: { include: { profile: { include: { dns: true } } } },
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const data = await req.json();
  const item = await prisma.macUser.update({
    where: { id: Number(id) },
    data: {
      macAddress:
        typeof data.macAddress === "string" ? data.macAddress : undefined,
      title: typeof data.title === "string" ? data.title : undefined,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  // Cascades to the device's playlists (Prisma onDelete: Cascade) — does NOT
  // touch profiles, since they're shared across devices and codes.
  await prisma.macUser.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
