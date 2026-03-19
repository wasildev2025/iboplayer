import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const data = await req.json();
  const item = await prisma.trial.update({
    where: { id: Number(id) },
    data: {
      macAddress: data.macAddress,
      expireDate: new Date(data.expireDate),
    },
  });
  return NextResponse.json(item);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  await prisma.trial.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
