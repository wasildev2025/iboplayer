// This file configures the initialization of Sentry on the server.
// The config you add here will be used whenever the server handles a request.
// https://docs.sentry.io/platforms/javascript/guides/nextjs/

import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: "https://f1ac4fb456ade67b8451178c34a5be07@o4511282190942208.ingest.de.sentry.io/4511282193236048",

  // Sample 10% of traces in production, 100% locally. At full sampling a
  // busy day will exhaust the Sentry free quota quickly; 10% gives a useful
  // signal without paying.
  tracesSampleRate: process.env.VERCEL_ENV === "production" ? 0.1 : 1,

  // Logs go to Sentry — deliberate, this is the value-add over plain logs.
  enableLogs: true,

  // PII off — we already have IPs in the rate-limit table for the small
  // number of cases where we need them. Leaving sendDefaultPii on would add
  // IPs and request bodies to every Sentry event, which is more data than
  // we need and complicates GDPR posture.
  sendDefaultPii: false,
});
