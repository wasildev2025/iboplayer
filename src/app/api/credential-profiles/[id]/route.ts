import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { requireAuth } from "@/lib/api-auth";
import { resolveCredentialsFromM3u } from "@/lib/credential-profiles";
import { triggerRefreshAsync } from "@/lib/channel-refresh";
import { audit } from "@/lib/audit";

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
      // Resolve the new M3U into a DNS row + extract creds. Crucially we do
      // NOT call `profileFromM3uUrl` here — that would upsert a separate
      // profile row with the new (dns,user,pass) triple, which then collides
      // with the unique constraint when we try to apply the same triple to
      // *this* profile below.
      const resolved = await resolveCredentialsFromM3u(body.m3uUrl.trim());
      dnsId = resolved.dnsId;
      username = resolved.username;
      password = resolved.password;
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

    // Pre-check: another profile already has this exact (dns, user, pass)
    // triple. The unique constraint would surface this as a P2002 error
    // mid-transaction, but a clean 409 with explanation is friendlier.
    const collision = await prisma.credentialProfile.findFirst({
      where: {
        dnsId,
        username,
        password,
        NOT: { id: profileId },
      },
      select: { id: true, title: true },
    });
    if (collision) {
      return NextResponse.json(
        {
          error:
            `Another profile (#${collision.id}${collision.title ? ` — ${collision.title}` : ""}) ` +
            `already uses these exact credentials. Delete or merge that profile first, ` +
            `or relink your activation codes to it directly.`,
        },
        { status: 409 },
      );
    }

    // Save the profile, optionally sync the DNS title, and clean up the old
    // DNS row if the rotate orphaned it. All in one transaction so the DNS
    // table can never end up with a stale entry pointing nowhere.
    const updated = await prisma.$transaction(async (tx) => {
      const before = await tx.credentialProfile.findUnique({
        where: { id: profileId },
        select: { dnsId: true },
      });
      const oldDnsId = before?.dnsId;

      const p = await tx.credentialProfile.update({
        where: { id: profileId },
        data: { dnsId, username, password, title },
        include: { dns: true },
      });

      // If the profile moved to a different DNS, garbage-collect the old DNS
      // when nothing else references it. DNS rows are derived state — one
      // per host actually in use, no orphans.
      if (oldDnsId && oldDnsId !== p.dnsId) {
        const remaining = await tx.credentialProfile.count({
          where: { dnsId: oldDnsId },
        });
        if (remaining === 0) {
          await tx.dns.delete({ where: { id: oldDnsId } });
        }
      }

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
    // Credentials may have changed (M3U replace) — re-pull channels.
    triggerRefreshAsync(updated.id);
    await audit({
      action: "profile.update",
      targetType: "CredentialProfile",
      targetId: updated.id,
      metadata: {
        title: updated.title,
        dnsId: updated.dnsId,
        viaM3u: typeof body.m3uUrl === "string" && body.m3uUrl.length > 0,
      },
      req,
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
  const profileId = Number(id);
  try {
    await prisma.$transaction(async (tx) => {
      const profile = await tx.credentialProfile.findUnique({
        where: { id: profileId },
        select: { dnsId: true },
      });
      if (!profile) throw new Error("Profile not found");

      await tx.credentialProfile.delete({ where: { id: profileId } });

      // Garbage-collect orphan DNS row, same rule as the rotate flow.
      const remaining = await tx.credentialProfile.count({
        where: { dnsId: profile.dnsId },
      });
      if (remaining === 0) {
        await tx.dns.delete({ where: { id: profile.dnsId } });
      }
    });
    await audit({
      action: "profile.delete",
      targetType: "CredentialProfile",
      targetId: profileId,
    });
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

