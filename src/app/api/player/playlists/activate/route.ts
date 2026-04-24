import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeMac } from "@/lib/mac";
import { verifyPlayerToken } from "@/lib/player-jwt";
import { playlistDtoFromRow, playlistsForMacUser } from "@/lib/player-playlists";

/**
 * Add a playlist to the current MacUser by redeeming an activation code.
 * Auth: Bearer player JWT (must resolve to a macUser:<id> subject).
 * Body: { activationCode: string }
 */
export async function POST(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  const payload = verifyPlayerToken(auth.slice(7).trim());
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const [kind, idStr] = payload.sub.split(":");
  const macUserId = Number(idStr);
  if (kind !== "macUser" || !Number.isFinite(macUserId)) {
    return NextResponse.json(
      { error: "Activation requires a registered device" },
      { status: 403 }
    );
  }

  const macUser = await prisma.macUser.findUnique({ where: { id: macUserId } });
  if (!macUser || normalizeMac(macUser.macAddress) !== normalizeMac(payload.mac)) {
    return NextResponse.json({ error: "Device not found" }, { status: 404 });
  }

  let body: { activationCode?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }
  const code = typeof body.activationCode === "string" ? body.activationCode.trim() : "";
  if (!code) {
    return NextResponse.json({ error: "activationCode is required" }, { status: 400 });
  }

  const codeRow = await prisma.activationCode.findFirst({ where: { code } });
  if (!codeRow) {
    return NextResponse.json({ error: "Invalid activation code" }, { status: 401 });
  }
  if (codeRow.status !== "NotUsed") {
    return NextResponse.json({ error: "Activation code already used" }, { status: 403 });
  }

  const duplicate = await prisma.playlist.findFirst({
    where: {
      macUserId,
      url: codeRow.url,
      username: codeRow.username,
      password: codeRow.password,
    },
  });
  if (duplicate) {
    return NextResponse.json(
      { error: "Playlist already added to this device" },
      { status: 409 }
    );
  }

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.playlist.create({
      data: {
        macUserId,
        title: codeRow.code,
        url: codeRow.url,
        username: codeRow.username,
        password: codeRow.password,
        protection: false,
      },
    });
    await tx.activationCode.update({
      where: { id: codeRow.id },
      data: { status: "Used" },
    });
    return row;
  });

  const playlists = await playlistsForMacUser(macUser);
  return NextResponse.json({
    playlists,
    added: playlistDtoFromRow(created),
  });
}
