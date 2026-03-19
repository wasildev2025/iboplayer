import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { hashSync } from "bcryptjs";

const settingsMap: Record<string, { model: string; fields: string[] }> = {
  "demo": { model: "demo", fields: ["mplname", "mdns", "muser", "mpass"] },
  "notification": { model: "notification", fields: ["messageOne", "messageTwo"] },
  "mac-length": { model: "macLength", fields: ["length"] },
  "themes": { model: "theme", fields: ["themeNo"] },
  "login-text": { model: "loginText", fields: ["loginTitle", "loginSubtitle"] },
  "ads-type": { model: "adsSetting", fields: ["adsType"] },
  "auto-layout": { model: "autoLayout", fields: ["layout"] },
  "frame-layout": { model: "frameLayout", fields: ["layout"] },
  "sports": { model: "sport", fields: ["api", "headerName", "borderColor", "bgColor", "textColor"] },
  "tmdb": { model: "tmdbApi", fields: ["tmdbKey"] },
  "remote-update": { model: "remoteUpdate", fields: ["version", "url"] },
  "credentials": { model: "user", fields: ["username", "password"] },
};

export async function GET(_req: Request, { params }: { params: Promise<{ key: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { key } = await params;

  const config = settingsMap[key];
  if (!config) return NextResponse.json({ error: "Unknown setting" }, { status: 404 });

  const modelAny = prisma as Record<string, any>;
  const record = await modelAny[config.model].findFirst();
  return NextResponse.json(record);
}

export async function PUT(req: Request, { params }: { params: Promise<{ key: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { key } = await params;

  const config = settingsMap[key];
  if (!config) return NextResponse.json({ error: "Unknown setting" }, { status: 404 });

  const body = await req.json();

  // Filter to only allowed fields
  const data: Record<string, unknown> = {};
  for (const field of config.fields) {
    if (body[field] !== undefined) {
      data[field] = body[field];
    }
  }

  // Special handling for credentials - hash password
  if (key === "credentials" && data.password) {
    data.password = hashSync(data.password as string, 10);
  }

  // Special handling for mac-length - convert to int
  if (key === "mac-length" && data.length) {
    data.length = Number(data.length);
  }

  const modelAny = prisma as Record<string, any>;
  const existing = await modelAny[config.model].findFirst();

  let record;
  if (existing) {
    record = await modelAny[config.model].update({
      where: { id: existing.id },
      data,
    });
  } else {
    record = await modelAny[config.model].create({ data });
  }

  return NextResponse.json(record);
}
