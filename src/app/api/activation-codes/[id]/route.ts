import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const item = await prisma.activationCode.findUnique({
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
  try {
    const item = await prisma.activationCode.update({
      where: { id: Number(id) },
      data: {
        code: data.code,
        url: data.url,
        username: data.username,
        password: data.password,
        status: data.status,
        dnsId: typeof data.dnsId === "number" ? data.dnsId : null,
      },
    });
    return NextResponse.json(item);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Update failed";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  await prisma.activationCode.delete({ where: { id: Number(id) } });
  return NextResponse.json({ success: true });
}
