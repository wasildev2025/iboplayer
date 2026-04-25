import * as Sentry from "@sentry/nextjs";

/**
 * Thin wrapper around Sentry. Exists so call sites stay short and so we can
 * always also write to console.error — Sentry can be down/throttled and we
 * don't want errors to vanish silently. Vercel function logs are still the
 * source of truth for "did this run fire."
 */
export function captureError(err: unknown, context?: Record<string, unknown>): void {
  try {
    Sentry.captureException(err, context ? { extra: context } : undefined);
  } catch {
    // Sentry transport failure must never crash the request. Fall through.
  }
  // eslint-disable-next-line no-console
  console.error("[error]", err, context ?? "");
}
