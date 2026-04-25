import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { profileFromM3uUrl } from "@/lib/credential-profiles";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const item = await prisma.activationCode.findUnique({
    where: { id: Number(id) },
    include: { profile: { include: { dns: true } } },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  let data: {
    code?: unknown;
    status?: unknown;
    profileId?: unknown;
    m3uUrl?: unknown;
  };
  try {
    data = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    let profileId: number | undefined;
    if (typeof data.profileId === "number") {
      profileId = data.profileId;
    } else if (typeof data.m3uUrl === "string" && data.m3uUrl.trim()) {
      const profile = await profileFromM3uUrl(data.m3uUrl.trim());
      profileId = profile.id;
    }

    const item = await prisma.activationCode.update({
      where: { id: Number(id) },
      data: {
        code: typeof data.code === "string" ? data.code : undefined,
        status: typeof data.status === "string" ? data.status : undefined,
        profileId,
      },
      include: { profile: { include: { dns: true } } },
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
