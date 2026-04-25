// This file configures the initialization of Sentry on the client.
// The added config here will be used whenever a users loads a page in their browser.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f1ac4fb456ade67b8451178c34a5be07@o4511282190942208.ingest.de.sentry.io/4511282193236048",

  // Add optional integrations for additional features
  integrations: [Sentry.replayIntegration()],

  tracesSampleRate: process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? 0.1 : 1,
  enableLogs: true,

  // Replay: only capture session video for 1% of sessions in prod (the dial
  // is here to keep the Sentry quota under control), but always capture
  // sessions where an error actually fires (those are the ones worth
  // watching back).
  replaysSessionSampleRate:
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production" ? 0.01 : 0.1,
  replaysOnErrorSampleRate: 1.0,

  // PII off in production — keeps GDPR posture simple. Local dev keeps it
  // on for richer debugging.
  sendDefaultPii: process.env.NEXT_PUBLIC_VERCEL_ENV !== "production",
});

export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
