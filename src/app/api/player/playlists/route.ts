import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeMac } from "@/lib/mac";
import {
  playlistsForMacUser,
  playlistsFromActivation,
  trialExpireIsoForMac,
} from "@/lib/player-playlists";
import { deviceKeyFromMac, verifyPlayerToken } from "@/lib/player-jwt";

/** Refresh playlists + entitlement using Bearer player JWT */
export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const payload = verifyPlayerToken(auth.slice(7).trim());
  if (!payload) {
    return NextResponse.json({ error: "Invalid or expired token" }, { status: 401 });
  }

  const parts = payload.sub.split(":");
  const kind = parts[0];
  const id = Number(parts[1]);
  if (!kind || !Number.isFinite(id)) {
    return NextResponse.json({ error: "Invalid token" }, { status: 401 });
  }

  const normMac = normalizeMac(payload.mac);

  if (kind === "macUser") {
    const row = await prisma.macUser.findUnique({
      where: { id },
      include: { dns: true },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const playlists = await playlistsForMacUser(row);
    const expireAt = await trialExpireIsoForMac(normMac);
    return NextResponse.json({
      playlists,
      expireAt,
      deviceKey: deviceKeyFromMac(payload.mac),
    });
  }

  if (kind === "activation") {
    const row = await prisma.activationCode.findUnique({
      where: { id },
      include: { dns: true },
    });
    if (!row) return NextResponse.json({ error: "Not found" }, { status: 404 });
    const playlists = playlistsFromActivation(row);
    const expireAt = await trialExpireIsoForMac(normMac);
    return NextResponse.json({
      playlists,
      expireAt,
      deviceKey: deviceKeyFromMac(payload.mac),
    });
  }

  return NextResponse.json({ error: "Invalid token" }, { status: 401 });
}
