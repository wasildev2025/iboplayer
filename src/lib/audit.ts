import { prisma } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { captureError } from "@/lib/observability";

type Json = unknown;

type LogInput = {
  action: string;
  targetType?: string;
  targetId?: string | number;
  metadata?: Json;
  req?: Request;
};

/**
 * Append-only audit log. Records who did what to what, when, from where.
 * Never throws — failures are captured to Sentry but don't block the
 * underlying admin mutation. Auditing is observability, not control flow.
 */
export async function audit(input: LogInput): Promise<void> {
  try {
    let actorId: number | null = null;
    let actorName = "system";
    const session = await getServerSession(authOptions);
    if (session?.user) {
      const idStr = (session.user as { id?: string }).id;
      const parsed = idStr ? Number(idStr) : NaN;
      actorId = Number.isFinite(parsed) ? parsed : null;
      actorName = session.user.name || actorName;
    }

    let ip: string | null = null;
    if (input.req) {
      ip =
        input.req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
        input.req.headers.get("x-real-ip")?.trim() ||
        null;
    }

    await prisma.auditLog.create({
      data: {
        actorId,
        actorName,
        action: input.action,
        targetType: input.targetType ?? null,
        targetId:
          input.targetId != null ? String(input.targetId) : null,
        metadata: input.metadata != null
          ? JSON.parse(JSON.stringify(input.metadata))
          : undefined,
        ip,
      },
    });
  } catch (e) {
    captureError(e, { op: "audit", action: input.action });
  }
}
