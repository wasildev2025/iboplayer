import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const item = await prisma.macUser.findUnique({
    where: { id: Number(id) },
    include: { dns: true },
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
      macAddress: data.macAddress,
      protection: data.protection,
      title: data.title,
      url: data.url,
      username: data.username,
      password: data.password,
      dnsId: typeof data.dnsId === "number" ? data.dnsId : null,
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  await prisma.macUser.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
