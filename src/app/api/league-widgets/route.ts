import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";

export async function GET() {
  const authError = await requireAuth();
  if (authError) return authError;
  const items = await prisma.leagueWidget.findMany({ orderBy: { id: "desc" } });
  return NextResponse.json(items);
}

export async function POST(req: Request) {
  const authError = await requireAuth();
  if (authError) return authError;
  const data = await req.json();
  const item = await prisma.leagueWidget.create({ data: { leagueName: data.leagueName, leagueId: data.leagueId } });
  return NextResponse.json(item);
}
