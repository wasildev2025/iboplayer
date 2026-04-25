import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeMac } from "@/lib/mac";
import { deviceKeyFromMac, signPlayerToken } from "@/lib/player-jwt";
import {
  playlistDtoFromProfile,
  playlistsForMacUser,
  trialExpireIsoForMac,
} from "@/lib/player-playlists";
import { rateLimit, callerIp } from "@/lib/rate-limit";

/**
 * Redeem an activation code for a device. No bearer auth required — this is
 * how a fresh device first registers itself.
 *
 * Body: { macAddress: string, activationCode: string }
 *
 * Behavior:
 *   - Auto-creates a MacUser for this MAC if none exists.
 *   - Creates a Playlist row under the MacUser linked to the code's profile.
 *   - Marks the ActivationCode as Used.
 *   - Rejects duplicate playlists (same MacUser + same profile).
 *   - Returns a fresh player JWT so the device can call /playlists next.
 */
export async function POST(req: Request) {
  // Rate-limit by caller IP. Activation codes are guessable in principle
  // (12-digit numeric, 10^12 space), so cap brute-force attempts.
  const ip = callerIp(req);
  const rl = await rateLimit(`activate:${ip}`, 10, 60_000);
  if (!rl.allowed) {
    return NextResponse.json(
      { error: "Too many activation attempts. Try again shortly." },
      {
        status: 429,
        headers: { "retry-after": String(Math.ceil(rl.retryAfterMs / 1000)) },
      },
    );
  }

  let body: {
    macAddress?: unknown;
    activationCode?: unknown;
    deviceName?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const macRaw = typeof body.macAddress === "string" ? body.macAddress.trim() : "";
  const code = typeof body.activationCode === "string" ? body.activationCode.trim() : "";
  const deviceName =
    typeof body.deviceName === "string" ? body.deviceName.trim() : "";
  if (!macRaw) {
    return NextResponse.json({ error: "macAddress is required" }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "activationCode is required" }, { status: 400 });
  }

  const codeRow = await prisma.activationCode.findFirst({
    where: { code },
    include: { profile: { include: { dns: true } } },
  });
  if (!codeRow) {
    return NextResponse.json({ error: "Invalid activation code" }, { status: 401 });
  }
  if (codeRow.status !== "NotUsed") {
    return NextResponse.json({ error: "Activation code already used" }, { status: 403 });
  }

  const normMac = normalizeMac(macRaw);

  // Title is set on first registration only — admin edits afterwards stick.
  const macUser = await prisma.macUser.upsert({
    where: { macAddress: normMac },
    update: {},
    create: {
      macAddress: normMac,
      title: deviceName || `Device ${normMac}`,
    },
  });

  const duplicate = await prisma.playlist.findFirst({
    where: {
      macUserId: macUser.id,
      profileId: codeRow.profileId,
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
        macUserId: macUser.id,
        profileId: codeRow.profileId,
        // Don't snapshot the title — playlistDtoFromRow always derives it live
        // from profile.title / dns.title so admin renames propagate.
        title: null,
        protection: false,
      },
      include: { profile: { include: { dns: true } } },
    });
    await tx.activationCode.update({
      where: { id: codeRow.id },
      data: { status: "Used" },
    });
    return row;
  });

  const playlists = await playlistsForMacUser(macUser);
  const token = signPlayerToken({ sub: `macUser:${macUser.id}`, mac: normMac });
  const expireAt = await trialExpireIsoForMac(normMac);

  return NextResponse.json({
    token,
    playlists,
    added: playlistDtoFromProfile(created.profile, created.id),
    expireAt,
    deviceKey: deviceKeyFromMac(normMac),
  });
}
