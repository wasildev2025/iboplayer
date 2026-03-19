import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const data = await req.json();
  const item = await prisma.manualAd.update({ where: { id: Number(id) }, data: { title: data.title, url: data.url } });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  await prisma.manualAd.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
