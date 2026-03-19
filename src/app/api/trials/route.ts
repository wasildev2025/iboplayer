import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  const items = await prisma.trial.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  const data = await req.json();
  const item = await prisma.trial.create({
    data: {
      macAddress: data.macAddress,
      expireDate: new Date(data.expireDate),
    },
  });
  return NextResponse.json(item);
}
