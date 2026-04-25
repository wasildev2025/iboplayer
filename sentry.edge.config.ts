// This file configures the initialization of Sentry for edge features (middleware, edge routes, and so on).
// The config you add here will be used whenever one of the edge features is loaded.
// Note that this config is unrelated to the Vercel Edge Runtime and is also required when running locally.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f1ac4fb456ade67b8451178c34a5be07@o4511282190942208.ingest.de.sentry.io/4511282193236048",

  tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.1 : 1,
  enableLogs: true,
  // PII off — see sentry.server.config.ts for rationale.
  sendDefaultPii: false,
});
