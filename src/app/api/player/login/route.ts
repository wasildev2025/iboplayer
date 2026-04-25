import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeMac } from "@/lib/mac";
import {
  playlistDtoFromProfile,
  playlistsForMacUser,
  trialExpireIsoForMac,
} from "@/lib/player-playlists";
import { deviceKeyFromMac, signPlayerToken } from "@/lib/player-jwt";

/**
 * Device login (no admin session).
 * Body: { macAddress: string, activationCode?: string }
 * - With activationCode: validates code (NotUsed), returns the code's profile
 *   as a one-shot playlist DTO + JWT scoped to that activation.
 * - Without activationCode: resolves MAC against MacUser and returns its
 *   persisted playlists.
 */
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const activationCode =
      typeof body.activationCode === "string" ? body.activationCode.trim() : "";
    const macRaw = typeof body.macAddress === "string" ? body.macAddress.trim() : "";
    if (!macRaw) {
      return NextResponse.json({ error: "macAddress is required" }, { status: 400 });
    }

    const mac = normalizeMac(macRaw);

    const trials = await prisma.trial.findMany();
    const trial = trials.find((t) => normalizeMac(t.macAddress) === mac);

    const macUser = await prisma.macUser.findUnique({ where: { macAddress: mac } });

    if (!macUser && trial && trial.expireDate < new Date()) {
      return NextResponse.json({ error: "Subscription expired" }, { status: 403 });
    }

    if (activationCode) {
      const codeRow = await prisma.activationCode.findFirst({
        where: { code: activationCode },
        include: { profile: { include: { dns: true } } },
      });
      if (!codeRow) {
        return NextResponse.json({ error: "Invalid activation code" }, { status: 401 });
      }
      if (codeRow.status !== "NotUsed") {
        return NextResponse.json({ error: "Activation code already used" }, { status: 403 });
      }

      await prisma.activationCode.update({
        where: { id: codeRow.id },
        data: { status: "Used" },
      });

      const playlists = [playlistDtoFromProfile(codeRow.profile, codeRow.id)];
      const token = signPlayerToken({ sub: `activation:${codeRow.id}`, mac });
      const expireAt = await trialExpireIsoForMac(mac);

      return NextResponse.json({
        token,
        playlists,
        expireAt,
        deviceKey: deviceKeyFromMac(mac),
      });
    }

    if (!macUser) {
      return NextResponse.json(
        { error: "Unknown device or invalid credentials" },
        { status: 401 }
      );
    }

    const playlists = await playlistsForMacUser(macUser);
    const token = signPlayerToken({ sub: `macUser:${macUser.id}`, mac });
    const expireAt = await trialExpireIsoForMac(mac);

    return NextResponse.json({
      token,
      playlists,
      expireAt,
      deviceKey: deviceKeyFromMac(mac),
    });
  } catch (e) {
    console.error("player/login", e);
    return NextResponse.json({ error: "Login failed" }, { status: 500 });
  }
}
