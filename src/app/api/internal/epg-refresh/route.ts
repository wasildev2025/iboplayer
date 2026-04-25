import { NextResponse } from "next/server";
import { requireAdminOrCron } from "@/lib/cron-auth";
import {
  refreshEpgForAllProfiles,
  refreshEpgForProfile,
} from "@/lib/epg-refresh";

/**
 * EPG ingest trigger.
 *
 * - Vercel Cron (GET) hits this with `Authorization: Bearer $CRON_SECRET`
 *   and runs `refreshEpgForAllProfiles()`.
 * - Admins (POST) can target one profile with `{ profileId }` from the
 *   credential profile editor.
 */

export async function POST(req: Request) {
  const authError = await requireAdminOrCron(req);
  if (authError) return authError;

  const body = (await req.json().catch(() => ({}))) as { profileId?: unknown };
  if (typeof body.profileId === "number") {
    const result = await refreshEpgForProfile(body.profileId);
    return NextResponse.json(result);
  }
  const result = await refreshEpgForAllProfiles();
  return NextResponse.json(result);
}

export async function GET(req: Request) {
  const authError = await requireAdminOrCron(req);
  if (authError) return authError;
  const result = await refreshEpgForAllProfiles();
  return NextResponse.json(result);
}
