import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { profileFromM3uUrl } from "@/lib/credential-profiles";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const item = await prisma.credentialProfile.findUnique({
    where: { id: Number(id) },
    include: {
      dns: true,
      _count: { select: { activationCodes: true, playlists: true } },
    },
  });
  if (!item) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(item);
}

/**
 * Replace the profile's credentials in place. Two body shapes:
 *   { m3uUrl, title? }                        — extract from a new link
 *   { dnsId, username, password, title? }     — explicit fields
 *
 * Updates the *same row*, so every linked activation code, playlist, and
 * mac-user instantly uses the new credentials via the FK. No cascading
 * UPDATE storm — that's the whole point of the profile abstraction.
 */
export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  const profileId = Number(id);

  let body: {
    m3uUrl?: unknown;
    dnsId?: unknown;
    username?: unknown;
    password?: unknown;
    title?: unknown;
  };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  try {
    const title =
      typeof body.title === "string" && body.title.trim() ? body.title.trim() : null;

    let dnsId: number;
    let username: string;
    let password: string;

    if (typeof body.m3uUrl === "string" && body.m3uUrl.trim()) {
      // Resolve the new M3U into a DNS row + extract creds, then update this
      // profile to point at them (rather than upserting a new profile row).
      const tmp = await profileFromM3uUrl(body.m3uUrl.trim());
      // profileFromM3uUrl may have returned an existing profile if the new
      // (dns,user,pass) already exists as a different row. Either way we
      // copy the resolved values onto *this* profile.
      dnsId = tmp.dnsId;
      username = tmp.username;
      password = tmp.password;
    } else {
      const rawDns =
        typeof body.dnsId === "number" ? body.dnsId : null;
      const rawUser = typeof body.username === "string" ? body.username : "";
      const rawPass = typeof body.password === "string" ? body.password : "";
      if (!rawDns || !rawUser || !rawPass) {
        return NextResponse.json(
          { error: "dnsId, username, password required (or provide m3uUrl)" },
          { status: 400 }
        );
      }
      dnsId = rawDns;
      username = rawUser;
      password = rawPass;
    }

    // Save the profile, then optionally sync the DNS title for "single source
    // of truth" UX. Sync only when this is the *only* profile attached to the
    // DNS — otherwise renaming one profile would clobber a sibling profile's
    // preferred host name.
    const updated = await prisma.$transaction(async (tx) => {
      const p = await tx.credentialProfile.update({
        where: { id: profileId },
        data: { dnsId, username, password, title },
        include: { dns: true },
      });

      if (title) {
        const siblingCount = await tx.credentialProfile.count({
          where: { dnsId: p.dnsId, NOT: { id: profileId } },
        });
        if (siblingCount === 0) {
          const refreshedDns = await tx.dns.update({
            where: { id: p.dnsId },
            data: { title },
          });
          p.dns = refreshedDns;
        }
      }

      return p;
    });
    return NextResponse.json(updated);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to update profile";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

/**
 * Delete a profile. Restricted by Prisma if any activation code or playlist
 * references it — caller must reassign or delete dependents first.
 */
export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const authError = await requireAuth();
  if (authError) return authError;
  const { id } = await params;
  try {
    await prisma.credentialProfile.delete({ where: { id: Number(id) } });
    return NextResponse.json({ success: true });
  } catch (e) {
    const message = e instanceof Error ? e.message : "Failed to delete profile";
    // Foreign key violation surfaces here when codes/playlists reference it.
    return NextResponse.json(
      { error: `${message} — likely in use by activation codes or playlists` },
      { status: 409 }
    );
  }
}

