import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { normalizeMac } from "@/lib/mac";
import { deviceKeyFromMac, signPlayerToken } from "@/lib/player-jwt";
import {
  playlistDtoFromRow,
  playlistsForMacUser,
  trialExpireIsoForMac,
} from "@/lib/player-playlists";

/**
 * Redeem an activation code for a device.
 *
 * No bearer auth required — a device without a prior session needs this to
 * register itself for the first time. The MAC is supplied in the body.
 *
 * Body: { macAddress: string, activationCode: string }
 * Response: { token, playlists, added, expireAt, deviceKey }
 *
 * Behavior:
 *   - Auto-creates a MacUser for this MAC if none exists (copies the code's
 *     DNS/credentials onto the new MacUser so it stands on its own).
 *   - Creates a Playlist row under the MacUser (including dnsId from the code).
 *   - Marks the ActivationCode as Used.
 *   - Rejects duplicate playlists for the same MacUser.
 *   - Returns a fresh player JWT so the device can call /playlists next.
 */
function hostOf(raw: string): string {
  try {
    return new URL(raw).host;
  } catch {
    return "";
  }
}

export async function POST(req: Request) {
  let body: { macAddress?: unknown; activationCode?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const macRaw = typeof body.macAddress === "string" ? body.macAddress.trim() : "";
  const code = typeof body.activationCode === "string" ? body.activationCode.trim() : "";
  if (!macRaw) {
    return NextResponse.json({ error: "macAddress is required" }, { status: 400 });
  }
  if (!code) {
    return NextResponse.json({ error: "activationCode is required" }, { status: 400 });
  }

  const codeRow = await prisma.activationCode.findFirst({
    where: { code },
    include: { dns: true },
  });
  if (!codeRow) {
    return NextResponse.json({ error: "Invalid activation code" }, { status: 401 });
  }
  if (codeRow.status !== "NotUsed") {
    return NextResponse.json({ error: "Activation code already used" }, { status: 403 });
  }

  const normMac = normalizeMac(macRaw);
  const existingUsers = await prisma.macUser.findMany();
  const existing = existingUsers.find((u) => normalizeMac(u.macAddress) === normMac);

  const macUser =
    existing ??
    (await prisma.macUser.create({
      data: {
        macAddress: normMac,
        protection: false,
        title: `Device ${normMac}`,
        url: codeRow.url,
        username: codeRow.username,
        password: codeRow.password,
        dnsId: codeRow.dnsId,
      },
    }));

  const duplicate = await prisma.playlist.findFirst({
    where: {
      macUserId: macUser.id,
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

  const playlistTitle = codeRow.dns?.title?.trim() || hostOf(codeRow.url) || codeRow.url;

  const created = await prisma.$transaction(async (tx) => {
    const row = await tx.playlist.create({
      data: {
        macUserId: macUser.id,
        title: playlistTitle,
        url: codeRow.url,
        username: codeRow.username,
        password: codeRow.password,
        dnsId: codeRow.dnsId,
        protection: false,
      },
      include: { dns: true },
    });
    await tx.activationCode.update({
      where: { id: codeRow.id },
      data: { status: "Used" },
    });
    return row;
  });

  const macUserWithDns = await prisma.macUser.findUnique({
    where: { id: macUser.id },
    include: { dns: true },
  });
  const playlists = await playlistsForMacUser(macUserWithDns!);
  const token = signPlayerToken({ sub: `macUser:${macUser.id}`, mac: normMac });
  const expireAt = await trialExpireIsoForMac(normMac);

  return NextResponse.json({
    token,
    playlists,
    added: playlistDtoFromRow(created),
    expireAt,
    deviceKey: deviceKeyFromMac(normMac),
  });
}
