import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";

/** Public config for player apps (login UI + DNS list). No secrets. */
export async function GET() {
  const [dns, loginText, notification, macLength, theme, remote] = await Promise.all([
    prisma.dns.findMany({ orderBy: { id: "asc" } }),
    prisma.loginText.findFirst(),
    prisma.notification.findFirst(),
    prisma.macLength.findFirst(),
    prisma.theme.findFirst(),
    prisma.remoteUpdate.findFirst(),
  ]);

  return NextResponse.json({
    dns: dns.map((d) => ({ id: d.id, title: d.title, url: d.url })),
    loginTitle: loginText?.loginTitle ?? "",
    loginSubtitle: loginText?.loginSubtitle ?? "",
    notifications: {
      messageOne: notification?.messageOne ?? "",
      messageTwo: notification?.messageTwo ?? "",
    },
    macLength: macLength?.length ?? 12,
    themeNo: theme?.themeNo ?? "theme_10",
    remoteVersion: remote?.version ?? "1.0",
    remoteUpdateUrl: remote?.url ?? "",
  });
}
